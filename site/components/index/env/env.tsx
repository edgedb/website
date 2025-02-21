import {
  BufferGeometry,
  Float32BufferAttribute,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  SRGBColorSpace,
  Vector2,
  RGBAFormat,
  NoBlending,
  Mesh,
  LinearToneMapping,
  Color
} from 'three'
import { useEffect, useState, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

import bgShader from "./lines";
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

function colorToVec(hex: string) {
  const col = new Color(hex);
  const rgb = col.toArray();
  return `vec3(${rgb[0].toFixed(3)}, ${rgb[1].toFixed(3)}, ${rgb[2].toFixed(3)})`;
}

function posToVec({x, y}: {x: number, y: number}) {
  return `vec2(${(-x).toFixed(3)}, ${y.toFixed(3)})`
}

function Environment({lowPerf}: EnvironmentProps) {
  const {gl} = useThree();

  const frameNumber = useRef<number>(0);
  const bgCamera = useRef<OrthographicCamera>();
  const bgScene = useRef<Scene>();
  const bgMaterial = useRef<ShaderMaterial>();
  const currentDpr = useRef<number>(-1);
  const needPointer = useRef<boolean>(false);
  const target = useRef<WebGLRenderTarget>();

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
      if (target.current != null) {
        target.current.setSize(res.x, res.y);
      }
    };

    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize, {passive: true});

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    }
  }, [bgMaterial.current]);

  const settings = readPaneSettings([
    'bg_lines',
    'bg_nspace',
    'bg_line_size_vari',
    'bg_line_brightness',
    'bg_line_roughness',
    'bg_line_speedfactor',
    'bg_line_scrollfactor',
    'bg_line_parallax_pow',
    'bg_line_curviness',
    'bg_line_fade_after',
    'bg_line_fade_coeff',
    'bg_line_fade_max',
    'bg_scene',
    'bg_color1',
    'bg_color2',
    'bg_color3',
    'bg_color4',
    'bg_blob1_color',
    'bg_blob1_pos',
    'bg_blob1_strength',
    'bg_blob1_dims',
    'bg_blob2_color',
    'bg_blob2_pos',
    'bg_blob2_strength',
    'bg_blob2_dims',
    'bg_blob3_color',
    'bg_blob3_pos',
    'bg_blob3_strength',
    'bg_blob3_dims',
    'bg_blob4_color',
    'bg_blob4_pos',
    'bg_blob4_strength',
    'bg_blob4_dims',
    'bg_blob_fade_after',
    'bg_blob_fade_coeff',
    'bg_blob_fade_max',
    'bg_vignette_strength',
    'debug_draw_nspace',
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
    'bg_random_seed',
    'scene_max_dpr',
    'scene_max_samples',
  ]);

  useMemo(() => {
    const ctx = gl.getContext();
    const MAX_SHADERS = ctx.getParameter(ctx.MAX_FRAGMENT_UNIFORM_VECTORS);

    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = LinearToneMapping;

    bgCamera.current = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const resolution = gl.getDrawingBufferSize(new Vector2());

    const _target = new WebGLRenderTarget(
      resolution.x,
      resolution.y,
      {
        format: RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        samples: (lowPerf || MAX_SHADERS <= 512) ? 0 : settings.scene_max_samples,
      }
    );
    _target.texture.colorSpace = SRGBColorSpace;
    _target.texture.generateMipmaps = false;
    target.current = _target;

    const _bgScene = new Scene();
    bgScene.current = _bgScene;

    let LINES = settings.bg_lines;
    let NSPACE = settings.bg_nspace;
    const RANDOM_SEED = settings.bg_random_seed;

    if (MAX_SHADERS <= 256) {
      LINES = 1;
      NSPACE = Math.max(Math.floor(NSPACE / 3), 3);
    } else  if (MAX_SHADERS <= 512) {
      LINES = 2;
      NSPACE = Math.max(Math.floor(NSPACE / 2), 3);
    }

    type vec2 = [number, number];
    const fract = (x: number) => x % 1;
    const fractvec2 = (x: vec2) => [fract(x[0]), fract(x[1])] as vec2;
    const dotvec2 = (x: vec2, y: vec2) => x[0] * y[0] + x[1] * y[1];
    const mulvec2 = (x: vec2, y: vec2) => [x[0] * y[0], x[1] * y[1]] as vec2;
    const addvec2 = (x: vec2, v: number) => [x[0] + v, x[1] * v] as vec2;
    const sign = (x: number) => x >= 0 ? 1 : -1;
    const hash21 = (x: number, y: number) => {
      let p = mulvec2([x, y], [RANDOM_SEED, RANDOM_SEED * 11.52102]);
      p = fractvec2(p);
      p = addvec2(p, dotvec2(p, addvec2(p, 45.32)));
      return fract(p[0] * p[1]);
    };

    const list = [];
    let numPerLine = 0;
    for (let n = 0; n < NSPACE + 4; n++) {
      for (let i = 1; i <= LINES; i++) {
        const seed = fract(hash21(n, fract(i * 11.18)) * 71.4213);

        list.push(seed);

        // scroll speed
        list.push((fract(i * 1.37) + 7.) / 2. + (fract(n * 121.114) * 10.));

        // sin params, in pairs
        list.push(sign(fract(seed * 13.11) - 0.5), (fract(seed * 13.41) + 1.) * 3.);

        // brightness
        list.push(fract(seed * 281.137) * settings.bg_line_brightness);

        // line color
        list.push(fract(seed * 37.371));

        const sizeFactor = fract(seed * 21.777);
        const sizeSeed = fract(seed * 31.111);
        if (sizeFactor < settings.bg_line_size_vari.min) {
          // up close
          list.push(sizeSeed * 4);
        } else if (sizeFactor > settings.bg_line_size_vari.max) {
          // far away
          list.push(sizeSeed) * 0.7;
        } else {
          // not so far, not so close
          list.push(sizeSeed * 2);
        }

        if (numPerLine == 0) {
          numPerLine = list.length;
        }
      }
    }
    const f32list = new Float32Array(list);

    const defines: any = {
      LINES,
      NSPACE,
      HALF_NSPACE: ((NSPACE / 2.) | 0) + 1,
      LINE_BRIGHTNESS: settings.bg_line_brightness.toFixed(2),
      LINE_ROUGHNESS: settings.bg_line_roughness.toFixed(2),
      LINE_CURVINESS: settings.bg_line_curviness.toFixed(2),
      LINE_FADE_AFTER: settings.bg_line_fade_after.toFixed(2),
      LINE_FADE_COEFF: settings.bg_line_fade_coeff.toFixed(2),
      LINE_MAX_FADE: settings.bg_line_fade_max.toFixed(2),
      SPEED_FACTOR: settings.bg_line_speedfactor.toFixed(2),
      SCROLL_FACTOR: settings.bg_line_scrollfactor.toFixed(2),
      NUM_RANDOM: list.length,
      NUM_RANDOM_PER_LINE: numPerLine,
      COLOR_SCENE: colorToVec(settings.bg_scene),
      COLOR1: colorToVec(settings.bg_color1),
      COLOR2: colorToVec(settings.bg_color2),
      COLOR3: colorToVec(settings.bg_color3),
      COLOR4: colorToVec(settings.bg_color4),

      BLOB1_COLOR: colorToVec(settings.bg_blob1_color),
      BLOB1_POS: posToVec(settings.bg_blob1_pos),
      BLOB1_STRENGTH: settings.bg_blob1_strength.toFixed(2),
      BLOB1_DIMS: posToVec(settings.bg_blob1_dims),
      BLOB2_COLOR: colorToVec(settings.bg_blob2_color),
      BLOB2_POS: posToVec(settings.bg_blob2_pos),
      BLOB2_STRENGTH: settings.bg_blob2_strength.toFixed(2),
      BLOB2_DIMS: posToVec(settings.bg_blob2_dims),
      BLOB3_COLOR: colorToVec(settings.bg_blob3_color),
      BLOB3_POS: posToVec(settings.bg_blob3_pos),
      BLOB3_STRENGTH: settings.bg_blob3_strength.toFixed(2),
      BLOB3_DIMS: posToVec(settings.bg_blob3_dims),
      BLOB4_COLOR: colorToVec(settings.bg_blob4_color),
      BLOB4_POS: posToVec(settings.bg_blob4_pos),
      BLOB4_STRENGTH: settings.bg_blob4_strength.toFixed(2),
      BLOB4_DIMS: posToVec(settings.bg_blob4_dims),
      BLOB_FADE_AFTER: settings.bg_blob_fade_after.toFixed(2),
      BLOB_FADE_COEFF: settings.bg_blob_fade_coeff.toFixed(2),
      BLOB_MAX_FADE: settings.bg_blob_fade_max.toFixed(2),
    };

    if (settings.bg_vignette_strength) {
      defines.VIGNETTE = settings.bg_vignette_strength.toFixed(2);
    }
    if (settings.debug_draw_nspace) {
      defines.DRAW_BORDER = '';
    }
    if (settings.bg_line_parallax_pow <= 100) {
      defines.PARALLAX = settings.bg_line_parallax_pow.toFixed(2);
      needPointer.current = true;
    } else {
      needPointer.current = false;
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
        uResolution: { value: resolution },
        uRandos: { value: f32list },
        uScene: { value: _target.texture },
        uOpacity: { value: 0 },
      },
    });
    bgMaterial.current = _bgMaterial;

    const bgTriangle = new Mesh(getFullscreenTriangle(), _bgMaterial);
    bgTriangle.frustumCulled = false;
    _bgScene.add(bgTriangle);
  }, [
    lowPerf, ...Array.from(Object.values(settings)),
  ]);

  useFrame(({gl}) => {
    if (!target.current || !bgMaterial.current ||
      !bgCamera.current || !bgScene.current
    ) {
      return;
    }

    const dpr = gl.getPixelRatio();
    if (currentDpr.current != dpr) {
      const res = gl.getDrawingBufferSize(new Vector2());
      target.current.setSize(res.x, res.y);
      bgMaterial.current.uniforms.uResolution.value = res;
      currentDpr.current = dpr;
    }

    // Prepare to draw the views
    gl.setRenderTarget(target.current);
    // Important to clear the buffer before rendering the views,
    // and after, otherwise the screen is flickering on resize
    gl.clear();
  }, 0);

  useFrame(({gl, clock, pointer}) => {
    if (!target.current || !bgMaterial.current ||
        !bgCamera.current || !bgScene.current
    ) {
      return;
    }

    frameNumber.current += 1;
    if (frameNumber.current > 10000) {
      frameNumber.current = 10;
    }
    const opacity = Math.min(frameNumber.current / 10.0, 1);

    gl.setRenderTarget(null);
    bgMaterial.current.uniforms.uScene.value = target.current.texture;
    bgMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
    bgMaterial.current.uniforms.uOpacity.value = opacity;
    if (needPointer.current) {
      bgMaterial.current.uniforms.uMouse.value = pointer;
    }
    gl.render(bgScene.current, bgCamera.current);

    // Besides fixing flickering, on relatively slow devices (iphone)
    // a lot of frame skipping can occur which can result in 'target'
    // buffer never being cleared properly, so make sure it's empty.
    gl.setRenderTarget(target.current);
    gl.clear();
  }, 99);

  return <>
    <group></group>
  </>
}

export default Environment;
