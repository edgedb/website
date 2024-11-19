import {
  BufferGeometry,
  Float32BufferAttribute,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  NoBlending,
  Mesh,
  Color
} from 'three'
import { useEffect, useState, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

import bgShader from "./space";
import { readPaneSettings } from '../settings';


const vertexShader = `precision highp float;
void main() {
  gl_Position = vec4(position, 1.0);
}`;

const getFullscreenTriangle = () => {
  const geometry = new BufferGeometry();

  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)
  );

  geometry.setAttribute(
    'uv',
    new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2)
  );

  return geometry;
};

type EnvironmentProps = {
  lowPerf: boolean
}

function colorToVec3(hex: string) {
  const col = new Color(hex);
  const rgb = col.toArray();
  return `vec3(${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)})`;
}

function colorToVec4(hex: string) {
  const col = new Color(hex.slice(0, -2));
  const alpha = parseInt(hex.slice(-2), 16);
  const rgb = col.toArray();
  return `vec4(${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)}, ${(alpha / 255).toFixed(2)})`;
}

function posToVec2({x, y}: {x: number, y: number}) {
  return `vec2(${(-x).toFixed(3)}, ${y.toFixed(3)})`
}

function posToVec3({x, y, z}: {x: number, y: number, z: number}) {
  return `vec3(${(-x).toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`
}

function splitPosToVec3({x, y}: {x: number, y: number}, z: number) {
  return `vec3(${(-x).toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`
}

function Environment({lowPerf}: EnvironmentProps) {
  const {gl} = useThree();

  const frameNumber = useRef<number>(0);
  const bgCamera = useRef<OrthographicCamera>();
  const bgScene = useRef<Scene>();
  const bgMaterial = useRef<ShaderMaterial>();
  const currentDpr = useRef<number>(-1);
  const needPointer = useRef<boolean>(false);

  const calcScroll = () =>
    document.documentElement.scrollTop / window.innerHeight;

  useEffect(() => {
    const onScroll = () => {
      if (bgMaterial.current != null) {
        const scrollOffset = calcScroll();
        bgMaterial.current.uniforms.uScroll.value = scrollOffset;
      }
    };

    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, {passive: true});

    const onResize = () => {
      const res = gl.getDrawingBufferSize(new Vector2());

      if (bgMaterial.current != null) {
        bgMaterial.current.uniforms.uResolution.value = res;
      }
    };

    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize, {passive: true});

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    }
  }, [bgMaterial.current]);

  const NLINES = 7;
  const snames = [
    'scene_max_dpr',
    'bg_camera_zoom',
    'bg_camera_parallax',
    'bg_scene',
    'bg_scene_scroll_factor',
    'bg_grad_c1',
    'bg_grad_c2',
    'bg_grad_c3',
    'bg_blob1_c',
    'bg_blob1_p_xy',
    'bg_blob1_p_z',
    'bg_blob1_strength',
    'bg_blob2_c',
    'bg_blob2_p_xy',
    'bg_blob2_p_z',
    'bg_blob2_strength',
    'bg_blob3_c',
    'bg_blob3_p_xy',
    'bg_blob3_p_z',
    'bg_blob3_strength',
    'bg_line_formula',
    'bg_aces',
    'bg_contrast',
    'bg_contrast_r',
    'bg_contrast_g',
    'bg_contrast_b',
    'bg_noise',
    'bg_noise_speed',
    'bg_noise_intensity',
    'bg_noise_mean',
    'bg_noise_variance',
    'bg_fade_after',
    'bg_fade_coeff',
    'bg_fade_max',
  ];

  for (let i = 1; i <= NLINES; i++) {
    snames.push(
      `bg_line${i}_p1_xy`,
      `bg_line${i}_p1_z`,
      `bg_line${i}_p2_xy`,
      `bg_line${i}_p2_z`,
      `bg_line${i}_strength`
    );
  }

  // @ts-ignore
  const settings = readPaneSettings(snames);

  useMemo(() => {
    bgCamera.current = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const resolution = gl.getDrawingBufferSize(new Vector2());

    const _bgScene = new Scene();
    bgScene.current = _bgScene;

    const untypedSettings = settings as unknown as any;

    const defines: any = {
      COLOR_SCENE: colorToVec3(settings.bg_scene),

      CAM_ZOOM: settings.bg_camera_zoom.toFixed(2),
      CAM_PARA: settings.bg_camera_parallax.toFixed(2),

      SCROLL_FACTOR: settings.bg_scene_scroll_factor.toFixed(2),

      FADE_AFTER: settings.bg_fade_after.toFixed(2),
      FADE_COEFF: settings.bg_fade_coeff.toFixed(2),
      MAX_FADE: settings.bg_fade_max.toFixed(2),

      C1: colorToVec4(settings.bg_grad_c1),
      C2: colorToVec4(settings.bg_grad_c2),
      C3: colorToVec4(settings.bg_grad_c3),

      FORMULA: settings.bg_line_formula,

      B1C: colorToVec4(settings.bg_blob1_c),
      B1P: splitPosToVec3(
        settings.bg_blob1_p_xy,
        settings.bg_blob1_p_z
      ),
      B1S: settings.bg_blob1_strength.toFixed(2),
      B2C: colorToVec4(settings.bg_blob2_c),
      B2P: splitPosToVec3(
        settings.bg_blob2_p_xy,
        settings.bg_blob2_p_z
      ),
      B2S: settings.bg_blob2_strength.toFixed(2),
      B3C: colorToVec4(settings.bg_blob3_c),
      B3P: splitPosToVec3(
        settings.bg_blob3_p_xy,
        settings.bg_blob3_p_z
      ),
      B3S: settings.bg_blob3_strength.toFixed(2),
    };

    for (let i = 1; i <= NLINES; i++) {
      defines[`L${i}P1`] = splitPosToVec3(
        untypedSettings[`bg_line${i}_p1_xy`],
        untypedSettings[`bg_line${i}_p1_z`]
      );

      defines[`L${i}P2`] = splitPosToVec3(
        untypedSettings[`bg_line${i}_p2_xy`],
        untypedSettings[`bg_line${i}_p2_z`]
      );

      defines[`L${i}S`] = untypedSettings[`bg_line${i}_strength`].toFixed(2);
    }

    if (settings.bg_camera_parallax >= 500) {
      defines['DISABLE_CAM_PARA'] = '1';
      needPointer.current = false;
    } else {
      needPointer.current = true;
    }

    const _bgMaterial = new ShaderMaterial({
      transparent: false,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
      defines,
      fragmentShader: bgShader({
        noise: {
          enabled: settings.bg_noise,
          speed: settings.bg_noise_speed,
          mean: settings.bg_noise_mean,
          intensity: settings.bg_noise_intensity,
          variance: settings.bg_noise_variance,
        },
        aces: {enabled: settings.bg_aces},
        contrast: {
          enabled: settings.bg_contrast,
          r: {amount: settings.bg_contrast_r.x, correction: settings.bg_contrast_r.y},
          g: {amount: settings.bg_contrast_g.x, correction: settings.bg_contrast_g.y},
          b: {amount: settings.bg_contrast_b.x, correction: settings.bg_contrast_b.y},
        },
      }),
      vertexShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uScroll: { value: calcScroll() },
        uOpacity: { value: 0 },
        uResolution: { value: resolution },
      },
    });
    bgMaterial.current = _bgMaterial;

    const bgTriangle = new Mesh(getFullscreenTriangle(), _bgMaterial);
    bgTriangle.frustumCulled = false;
    _bgScene.add(bgTriangle);
  }, [
    lowPerf, ...Array.from(Object.values(settings)),
  ]);

  useFrame(({gl, clock, pointer}) => {
    if (!bgMaterial.current || !bgScene.current || !bgCamera.current) {
      return;
    }

    frameNumber.current += 1;
    if (frameNumber.current > 10000) {
      frameNumber.current = 10;
    }
    const opacity = Math.min(frameNumber.current / 10.0, 1);

    const dpr = gl.getPixelRatio();
    if (currentDpr.current != dpr) {
      const res = gl.getDrawingBufferSize(new Vector2());
      bgMaterial.current.uniforms.uResolution.value = res;
      currentDpr.current = dpr;
    }

    gl.setRenderTarget(null);
    bgMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
    bgMaterial.current.uniforms.uOpacity.value = opacity;
    if (needPointer.current) {
      bgMaterial.current.uniforms.uMouse.value = pointer;
    }
    gl.render(bgScene.current, bgCamera.current);
  }, 1);

  return <>
    <group></group>
  </>
}

export default Environment;
