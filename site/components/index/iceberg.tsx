'use client';

import {
  WebGLProgramParametersWithUniforms,
  Mesh,
  Group,
  MeshStandardMaterial,
  Box3,
  PMREMGenerator,
  FrontSide,
  Color,
  MeshBasicMaterial,
  DoubleSide,
  AdditiveBlending,
  Euler,
  PerspectiveCamera,
  Vector3,
  MathUtils
} from 'three'
import React, { Suspense, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { useFrame, useThree } from '@react-three/fiber';
import useRGBE from '@edgedb-site/shared/utils/useRGBE';
import SNOISE from './snoise';
import styles from "./styles.module.scss";

import {PatchedView} from "@edgedb-site/shared/utils/view";

import { readPaneSettings, readPaneSettingsAsArray, usePaneSetting } from './settings';

type Shader = WebGLProgramParametersWithUniforms;

const iceberg_model_path = '/assets/iceberg/iceberg.glb';
const iceberg_env_path = '/assets//iceberg/env.hdr';

useGLTF.preload(iceberg_model_path);
useRGBE.preload(iceberg_env_path);

type IcebergGLTFResult = GLTF & {
  nodes: {
    iceberg_1_piece001: Mesh
  }
  materials: {}
}

type IcebergModelProps = {
  ice_top_color: string
  ice_bottom_color: string
  ice_brightness: number
}

function IcebergModel(
  {
    ice_top_color,
    ice_bottom_color,
    ice_brightness,
  }: IcebergModelProps)
{
  const ref = React.useRef<Group>(null!);

  const texture = useRGBE(iceberg_env_path);
  const getThree = useThree((state) => state.get);

  const {nodes} = useGLTF(iceberg_model_path) as IcebergGLTFResult;
  const node = nodes.iceberg_1_piece001;

  const [material, setMaterial] = useState<MeshStandardMaterial>();

  useEffect(() => {
    const box3 = new Box3().setFromObject(node, true);
    const width = box3.max.x - box3.min.x;
    ref.current.scale.setScalar(1 / width);
  }, []);

  useMemo(() => {
    const state = getThree();
    const pmremGenerator = new PMREMGenerator(state.gl);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose();

    const mat = new MeshStandardMaterial({
      side: FrontSide,
      envMap,
    });
    mat.onBeforeCompile = function (shader) {
      Object.assign(shader.uniforms, {
        uIceBrigthness: { value: ice_brightness },
        uIceTopColor: { value: new Color(ice_top_color) },
        uIceBottomColor: { value: new Color(ice_bottom_color) },
      });

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `varying vec3 vPos;
        void main() {`
      ).replace(
        '#include <begin_vertex>',
        `
        vPos = position.xyz;
        vec3 transformed = position.xyz;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',`
        varying vec3 vPos;
        uniform vec3 uIceTopColor;
        uniform vec3 uIceBottomColor;
        uniform float uIceBrigthness;
        void main() {`
      ).replace(
        '#include <color_fragment>',`
        float h = 15. * vPos.y;
        diffuseColor.rgb = mix(
          uIceBottomColor, uIceTopColor, step(0., h)
        ) * uIceBrigthness;`
      );
    };

    mat.needsUpdate = true;

    setMaterial(mat);
  }, [ice_top_color, ice_bottom_color, ice_brightness]);

  return (
    <group dispose={null} ref={ref}>
      <mesh
        geometry={node.geometry}
        material={material}
      />
    </group>
  )
}

const ANNOS = [
  {
    title: <>Built-in UI</>,
    pos: [-0.05, 0.25, 0],
    mos: [-0.6, 0.3, 0]
  },
  {
    title: <>Built-in RAG</>,
    pos: [0.1, 0.13, 0],
    mos: [0.1, 0.3, 0]
  },
  {
    title: <>Built-in Auth</>,
    pos: [-0.2, 0.1, 0],
    mos: [-.6, 0.12, 0]
  },
  {
    title: <>Effortless JSON</>,
    pos: [-0.3, -0.1, 0],
    mos: [.1, 0.12, 0]
  },
  {
    title: <>Storing vectors</>,
    pos: [0.3, -0.07, 0],
    mos: [-.6, -0.07, 0]
  },
  {
    title: <>Built-in GraphQL</>,
    pos: [0.02, -0.03, 0],
    mos: [.1, -0.07, 0]
  },
  {
    title: <>Access policies</>,
    pos: [-0.02, -0.178, 0],
    mos: [-.6, -0.26, 0]
  },
  {
    title: <>Polymorphic queries</>,
    pos: [-0.42, -0.268, 0],
    mos: [.1, -0.26, 0]
  },
  {
    title: <>No NULL</>,
    pos: [-0.12, -0.348, 0],
    mos: [-.6, -0.45, 0]
  },
  {
    title: <>SQL support</>,
    pos: [0.12, -0.398, 0],
    mos: [.1, -0.45, 0]
  },
  {
    title: <>HTTP tunneling</>,
    pos: [0.22, -0.227, 0],
    mos: [-.6, -0.64, 0]
  },
  {
    title: <>Reusable schemas</>,
    pos: [-0.41, -0.44, 0],
    mos: [.1, -0.64, 0]
  },
  {
    title: <>Protocol auto-recovery</>,
    pos: [-0.1, -0.59, 0],
    mos: [-.6, -0.83, 0]
  },
  {
    title: <>Set-based</>,
    pos: [-0.27, -0.64, 0],
    mos: [.13, -0.83, 0]
  },
  {
    title: <>
      Solves object-relational<br/>
      impedance mismatch
    </>,
    pos: [0.11, -1.1, 0],
    mos: [-.6, -1.03, 0]
  },
  {
    title: <>Formally defined</>,
    pos: [-0.11, -0.9, 0],
    mos: [.13, -0.99, 0]
  },
  {
    title: <>Arrays &amp; tuples</>,
    pos: [0.17, -0.64, 0],
    mos: [.13, -1.16, 0]
  },
]

function IcebergInnards({view} : {view: MutableRefObject<HTMLDivElement>}) {
  const gRef = useRef<Group>(null!);
  const cnt = React.useRef<Group>(null!);

  const [
    scene_camera_pos,
  ] = readPaneSettingsAsArray([
    'scene_camera_pos',
  ]);

  const { getCurrentViewport } = useThree(state => state.viewport);

  useFrame(({camera, size}) => {
    if (!view.current) {
      return;
    }

    const wih = window.innerHeight;
    const rect = view.current!.getBoundingClientRect();
    if (rect.top > wih || (rect.y < 0 && -rect.y > rect.height)) {
      return;
    }

    // It's important to re-calibrate camera and re-compute the viewport here
    // to avoid rendering and sizing artefacts
    camera.position.set(
      scene_camera_pos.x,
      scene_camera_pos.y,
      scene_camera_pos.z
    );
    const viewport = getCurrentViewport(camera, new Vector3(), size);
    const scale = viewport.width * 1.7;

    const ratio = wih / window.innerWidth;
    const top = Math.abs(rect.top - wih) / (wih + rect.height);

    const sb = -viewport.height + (ratio / 2);
    const st = viewport.height * 1.2 - (ratio / 2);

    camera.position.y = MathUtils.lerp(sb, st, 1-top);
    camera.rotation.x = MathUtils.lerp(-.4, .2, top);

    if (gRef.current.scale.x != scale) {
      gRef.current.scale.setScalar(scale);
    }
  });

  const waterOptions = readPaneSettings([
    'ice_rot',
    'ice_pos',
    'ice_grid_color',
    'ice_water_color',
    'ice_water_opacity',
    'ice_noise_speed',
    'ice_noise_amplitude',
    'ice_grid_opacity',
    'ice_grid_thick',
    'ice_edgeline_color',
    'ice_edgeline_thick',
    'ice_edgeline_glow',
  ]);

  const icebergOptions = readPaneSettings([
    'ice_top_color',
    'ice_bottom_color',
    'ice_glow_color',
    'ice_glow_intensity',
    'ice_brightness'
  ]);

  return <group ref={gRef}
    rotation={[waterOptions.ice_rot.x, waterOptions.ice_rot.y, waterOptions.ice_rot.z]}
    position={[waterOptions.ice_pos.x, waterOptions.ice_pos.y, waterOptions.ice_pos.z]}
  >
    <group ref={cnt}>
      <Suspense fallback={null}>
        <IcebergModel {...icebergOptions} />
      </Suspense>
    </group>

    <Annotations/>

    <group>
      <Suspense fallback={null}>
        <Glow {...icebergOptions} />
        <Water {...waterOptions} />
        <Waterback {...waterOptions} />
        <Edge z={1.0001} {...waterOptions} />
        <Edge z={-1.0001} {...waterOptions}/>
      </Suspense>
    </group>
  </group>
}

function Annotations() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(
      typeof window != 'undefined' && window.innerWidth < 600
    );
  });

  return <group>
    {ANNOS.map((a, i) => {
      let pos = mobile ? a.mos : a.pos;
      return <Annotation position={pos} key={`${i}-${pos}`}>
        {a.title}
      </Annotation>
    })}
  </group>
}

type WaterProps = {
  ice_grid_color: string
  ice_noise_speed: number
  ice_noise_amplitude: number
  ice_grid_opacity: number
  ice_grid_thick: number
  ice_water_color: string
  ice_water_opacity: number
}

function Water(
  {
    ice_water_color,
    ice_water_opacity,
    ice_grid_color,
    ice_noise_speed,
    ice_noise_amplitude,
    ice_grid_opacity,
    ice_grid_thick
  }: WaterProps
) {
  const [material, setMaterial] = useState<MeshBasicMaterial>();
  const [shader, setShader] = useState<Shader>();

  useMemo(() => {
    const watermat = new MeshBasicMaterial({
      color: new Color(ice_water_color),
      blending: AdditiveBlending,
    });
    watermat.transparent = true;
    watermat.side = DoubleSide;
    watermat.onBeforeCompile = function (shader) {
      Object.assign(shader.uniforms, {
        uTime: {value: 0},
        uWaterOpacity: {value: ice_water_opacity},
        uGridColor: { value: new Color(ice_grid_color) },
        uNoiseSpeed: {value: ice_noise_speed },
        uNoiseAmpl: {value: ice_noise_amplitude },
        uGridOpacity: {value: ice_grid_opacity },
        uGridThickness: {value: ice_grid_thick },
      });
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `uniform float uTime;
        uniform float uNoiseSpeed;
        uniform float uNoiseAmpl;
        ${SNOISE}
        varying vec2 vPos;
        void main() {`
      ).replace(
        '#include <begin_vertex>',
        `vPos = position.xy;
        float t0 = .2 * uTime * uNoiseSpeed;

        float pz = uNoiseAmpl * .06 * snoise(vec3(2.5*position.xy + t0, t0).xzy);
        pz *= smoothstep(0., .5, abs((length(position.xy+vec2(0.21, 0.0)) - 0.4)));
        vec3 transformed = vec3(position.x, position.y, position.z + pz);`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `varying vec2 vPos;
        uniform float uWaterOpacity;
        uniform vec3 uGridColor;
        uniform float uGridOpacity;
        uniform float uGridThickness;
        void main() {`
      ).replace(
        '#include <color_fragment>',
        `vec2 coord = vPos * vec2(64. / 4., 20. / 2.);

        // Compute anti-aliased world-space grid lines
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        float line = min(grid.x, grid.y);

        // Just visualize the grid lines directly
        line = (uGridThickness - min(line, uGridThickness));

        // Apply gamma correction
        diffuseColor.a = mix(uWaterOpacity, uGridOpacity, line);
        diffuseColor.rgb = mix(diffuseColor.rgb, uGridColor, vec3(line));
        `
      );
      setShader(shader);
    }
    setMaterial(watermat);
  }, [
    ice_water_color, ice_water_opacity, ice_grid_color,
    ice_noise_speed, ice_noise_amplitude, ice_grid_opacity,
    ice_grid_thick,
  ]);

  useFrame((state) => {
    const {clock} = state;
    if (shader) {
      shader.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return <mesh material={material} rotation={[Math.PI / 2., 0, 0]}>
    <planeGeometry args={[4, 2, 64, 20]} />
  </mesh>
}

type WaterbackProps = {
  ice_water_color: string
  ice_water_opacity: number
  ice_noise_speed: number
  ice_noise_amplitude: number
}

function Waterback(
  {
    ice_water_color,
    ice_water_opacity,
    ice_noise_speed,
    ice_noise_amplitude
}: WaterbackProps)
{
  const [material, setMaterial] = useState<MeshBasicMaterial>();
  const [shader, setShader] = useState<Shader>();

  useMemo(() => {
    const watermat = new MeshBasicMaterial({
      color: new Color(ice_water_color),
      opacity: ice_water_opacity,
      blending: AdditiveBlending,
    });
    watermat.transparent = true;
    watermat.side = DoubleSide;
    watermat.onBeforeCompile = function (shader) {
      // @ts-ignore
      setShader(shader);

      Object.assign(shader.uniforms, {
        uTime: { value: 0 },
        uNoiseSpeed: {value: ice_noise_speed},
        uNoiseAmpl: {value: ice_noise_amplitude},
      });
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        ` uniform float uTime;
          uniform float uNoiseSpeed;
          uniform float uNoiseAmpl;
          ${SNOISE}
          varying vec2 vPos;
          void main() {`
      ).replace(
        '#include <begin_vertex>',
        `float t0 = .2 * uTime * uNoiseSpeed;
        float py = uNoiseAmpl * .06 * snoise(vec3(2.5*(position.xy + vec2(0,-3)) + t0, t0).xzy);
        vec3 transformed = vec3(position.x, position.y - py, position.z);
        vPos = position.xy;`
      );
      // Gradient water plane into full transparency towards the bottom
      // of the iceberg scene
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `varying vec2 vPos;
        void main() {`
      ).replace(
        '#include <color_fragment>',
        `
        diffuseColor.a *= smoothstep(0., 1., (vPos.y + .55) / (abs(vPos.x) + 1.));
        diffuseColor.a *= clamp(vPos.y + 0.1, 0., 1.);
        `
      );
    }
    setMaterial(watermat);
  }, [
    ice_water_color, ice_water_opacity,
    ice_noise_speed, ice_noise_amplitude,
  ]);

  useFrame((state) => {
    const {clock} = state;
    if (shader) {
      shader.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return <mesh material={material} position={[0, -2, -1.01]} renderOrder={-1}>
    <planeGeometry args={[4, 4, 64, 20]} />
  </mesh>
}

type GlowProps = {
  ice_glow_color: string
  ice_glow_intensity: number
}

function Glow({ice_glow_color, ice_glow_intensity}: GlowProps) {
  const [material, setMaterial] = useState<MeshBasicMaterial>();
  const [shader, setShader] = useState<Shader>();

  useMemo(() => {
    const watermat = new MeshBasicMaterial({
      blending: AdditiveBlending,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });
    watermat.onBeforeCompile = function (shader) {
      // @ts-ignore
      setShader(shader);

      Object.assign(shader.uniforms, {
        uIceGlowColor: { value: new Color(ice_glow_color) },
        uIceGlowIntensity: { value: ice_glow_intensity },
      });

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `varying vec2 vPos;
         void main() {`
      ).replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = position;
        vPos = position.xy;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `varying vec2 vPos;
        uniform vec3 uIceGlowColor;
        uniform float uIceGlowIntensity;

        float calcGlow(float x, float y, float wk, float hk) {
          return smoothstep(0.08, 0.99,
              2./(length((vPos-vec2(x, y)) / vec2(wk, hk)))) / 3.;
        }

        void main() {`
      ).replace(
        '#include <color_fragment>',
        `
        float glow =
          calcGlow(0.04, 0.27, 0.35, 0.5) +
          calcGlow(0.11, 0.25, 0.45, 0.53) +
          calcGlow(-0.03, -0.1, 0.4, 0.7) +
          calcGlow(0.05, 0.5, 0.38, 0.8);

        glow = smoothstep(0.2,  0.99, glow - 0.08) * uIceGlowIntensity;

        diffuseColor = vec4(
          uIceGlowColor * glow,
          glow * max(0.99 - length(vPos - vec2(0.03, 0.12)), 0.)
        );
        `
      );
    }
    setMaterial(watermat);
  }, [ice_glow_color, ice_glow_intensity]);

  return <mesh material={material} position={[0.02, -0.5, -0.08]}>
    <planeGeometry args={[2, 2, 1, 1]} />
  </mesh>
}

type EdgeProps = {
  ice_edgeline_color: string
  ice_noise_speed: number
  ice_noise_amplitude: number
  ice_edgeline_thick: number
  ice_edgeline_glow: number
  z: number
}

function Edge(
  {
    ice_edgeline_color,
    ice_noise_speed,
    ice_noise_amplitude,
    ice_edgeline_thick,
    ice_edgeline_glow,
    z,
  }: EdgeProps)
{
  const [material, setMaterial] = useState<MeshBasicMaterial>();
  const [shader, setShader] = useState<Shader>();

  useMemo(() => {
    const edgeMat = new MeshBasicMaterial({
      color: new Color().setHex(0x002299),
      blending: AdditiveBlending,
    });
    edgeMat.transparent = true;
    edgeMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uTime: { value: 0 },
        iZ: { value: z },
        uEdgeLineColor: { value: new Color(ice_edgeline_color) },
        uEdgeLineThickness: { value: ice_edgeline_thick },
        uEdgeLineGlowThickness: { value: ice_edgeline_glow },
        uNoiseSpeed: { value: ice_noise_speed },
        uNoiseAmpl: { value: ice_noise_amplitude },
      }),
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        ` uniform float uTime;
          uniform float iZ;
          uniform float uNoiseSpeed;
          uniform float uNoiseAmpl;
          ${SNOISE}
          varying float vPy;
          void main() {`
      ).replace(
        '#include <begin_vertex>',
        `
        float t0 = .2 * uTime * uNoiseSpeed;
        float py = uNoiseAmpl * .06 * snoise(vec3(2.5*(position.xz+vec2(0,iZ)) + t0, t0).xzy);
        vPy = position.y + py;
        vec3 transformed = vec3(position.xy, position.z * smoothstep(0., .5, abs((length(position.xy+vec2(0.21, 0.0)) - 0.4))));
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',`
        varying float vPy;
        uniform vec3 uEdgeLineColor;
        uniform float uEdgeLineThickness;
        uniform float uEdgeLineGlowThickness;
        void main() {`
      ).replace(
        '#include <color_fragment>',`
        float h = 15.*vPy;
        float powh = pow(uEdgeLineThickness / abs(h), uEdgeLineGlowThickness);
        powh *= smoothstep(.05, .1, powh);
        diffuseColor = vec4(uEdgeLineColor, powh);
        `
      );
      setShader(shader);
    }

    setMaterial(edgeMat);
  }, [
    ice_edgeline_color, ice_noise_speed,
    ice_noise_amplitude, ice_edgeline_thick,
    ice_edgeline_glow, z,
  ]);

  useFrame((state) => {
    const {clock} = state;
    if (shader) {
      shader.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return <mesh material={material} position={[0, 0, z]}>
    <planeGeometry args={[4, 1, 64]} />
  </mesh>
}

function CameraUpdater() {
  const [
    scene_camera_fov,
    scene_camera_rot,
    scene_camera_pos,
  ] = readPaneSettingsAsArray([
    'scene_camera_fov',
    'scene_camera_rot',
    'scene_camera_pos',
  ]);

  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useMemo(() => {
    camera.position.x = scene_camera_pos.x;
    camera.position.y = scene_camera_pos.y;
    camera.position.z = scene_camera_pos.z;

    camera.fov = scene_camera_fov;
    camera.setRotationFromEuler(new Euler(
      scene_camera_rot.x,
      scene_camera_rot.y,
      scene_camera_rot.z,
      'XYZ'
    ));
    camera.updateProjectionMatrix();
  }, [
    scene_camera_fov,
    scene_camera_rot,
    scene_camera_pos,
  ]);

  return <><group></group></>;
}

export default function Iceberg({className}: {className: string}) {
  const viewRef = useRef<HTMLDivElement>(null!);

  return <PatchedView
        className={className} ref={viewRef} index={2} skipScissor={true}>
    <IcebergInnards view={viewRef} />
    <CameraUpdater/>
  </PatchedView>;
}

// @ts-ignore
function Annotation({ children, ...props }) {
  return (
    <Html
      {...props}
    >
      <div className={styles.anno}>
        <span className={styles.dot}></span><span className={styles.text}>{children}</span>
      </div>
    </Html>
  )
}
