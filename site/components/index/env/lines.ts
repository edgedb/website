import { noiseShader, acesShader, contrastShader } from "@edgedb-site/shared/utils/effects";
import { NoiseOptions, ACESFilmOptions, ContrastOptions } from "@edgedb-site/shared/utils/effects";


type BGOptions = {
  noise: NoiseOptions,
  aces: ACESFilmOptions,
  contrast: ContrastOptions,
};

const bgShader = (options: BGOptions) => /*glsl*/`precision highp float;

uniform sampler2D uScene;
uniform float uRandos[NUM_RANDOM];
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform float uScroll;
uniform float uOpacity;

${noiseShader(options.noise)}
${contrastShader(options.contrast)}
${acesShader(options.aces)}

#define PI  3.1415926535
#define TAU 6.2831853071

#define ST_ADJ (LINE_CURVINESS * 0.02)

#if 1==0
#define fsin(x)   smoothstep(0.49, 0.5, abs(fract((x) /  7.) * 2. - 1.))
#define flsin(x)  smoothstep(0.6,  0.9, abs(fract((x) / 10.) * 2. - 1.))
#else
#define fsin(x)   smoothstep(0.47-ST_ADJ, 0.53+ST_ADJ, sin(x))
#define flsin(x)  sin(x)
#endif

vec3 drawLines(vec2 uv) {
  vec3 color = vec3(0.);

  uv *= float(NSPACE);

  vec2 gv = vec2(fract(uv.x) - .5, uv.y);
  int rbase = int(floor(uv.x)) + HALF_NSPACE + 1;

#ifdef PARALLAX
  float mx = -uMouse.x / PARALLAX;
#endif

  for (int x = -1; x <= 1; x++) {
    for (int i = 1; i <= LINES; i++) {
      int rr = NUM_RANDOM_PER_LINE * (
        i + LINES * (rbase + x)
      );
      float seed = uRandos[rr];
      vec2 gvx = vec2(
        gv.x - float(x),
        gv.y - uScroll / SCROLL_FACTOR * uRandos[rr+1] + seed * 10.);

#ifdef PARALLAX
      float mxx = mx * (uRandos[rr+6] + float(i));
#endif

      float dx = (
        (seed - 0.5) * 3. +
        uRandos[rr+2] * fsin(gvx.y / uRandos[rr+3] * LINE_CURVINESS)
#ifdef PARALLAX
        + mxx
#endif
      ) / (6. - uRandos[rr+6]);

      float d1 = distance(gvx.x, dx);
      float bright = uRandos[rr+4] * uRandos[rr+6];
      float dist = (d1 + 0.002) / bright;
      float line = (
        (smoothstep(0.5, LINE_ROUGHNESS, (

            flsin(
              gvx.y + seed * 32.17 + mod(uTime / SPEED_FACTOR, TAU)
            )

            + 0.5) / 155. + 0.5) + 0.00012
        ) / (dist + 0.001)
      ) * max(0.0, 1.0 - d1);

      line /= clamp((uScroll - LINE_FADE_AFTER) * LINE_FADE_COEFF, 0., LINE_MAX_FADE) + 1.;

      float ci = uRandos[rr+5];
      color += line * (
        ci <= 0.25 ? COLOR1 :
        ci <= 0.5 ? COLOR2 :
        ci <= 0.75 ? COLOR3 : COLOR4
      );
    }
  }

#ifdef DRAW_BORDER
  if (gv.x > .49) color = vec3(1., 0., 0.);
#endif

  return color;
}

float drawBlob(vec2 uv, vec2 dims) {
  float r = 0.;
  r = 0.07 / length(uv / dims);
  r = smoothstep(0.01, 0.6, r);

  r /= clamp((uScroll - BLOB_FADE_AFTER) * BLOB_FADE_COEFF, 0., BLOB_MAX_FADE) + 1.;

  return r;
}

vec3 drawBlobs(vec2 uv) {
  uv.y += uScroll;

  vec3 color = vec3(0.);
  uv.y -= uScroll;

  color += BLOB1_COLOR * drawBlob(uv + BLOB1_POS, BLOB1_DIMS) * BLOB1_STRENGTH;
  color += BLOB2_COLOR * drawBlob(uv + BLOB2_POS, BLOB2_DIMS) * BLOB2_STRENGTH;
  color += BLOB3_COLOR * drawBlob(uv + BLOB3_POS, BLOB3_DIMS) * BLOB3_STRENGTH;
  color += BLOB4_COLOR * drawBlob(uv + BLOB4_POS, BLOB4_DIMS) * BLOB4_STRENGTH;

  return color;
}

vec3 adjustColor(vec2 uv, vec3 color) {
  return applyNoise(uv, applyACES(applyContrast(color)));
}

void main()
{
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec4 tex = sRGBTransferOETF(texture2D(uScene, uv));

  uv = (gl_FragCoord.xy - .5 * uResolution.xy) / max(uResolution.x, uResolution.y);

  if (tex.a == 1.) {
    gl_FragColor = vec4(adjustColor(uv, tex.rgb) * uOpacity, 1.);
    return;
  }

  vec3 color = COLOR_SCENE;

  color += drawLines(uv);
  color += drawBlobs(uv);

#ifdef VIGNETTE
  color *= (smoothstep(0.3,.99, abs(uv.x) + 1. - VIGNETTE) * 0.6 + 0.4);
#endif

  color = clamp(color, 0.00, 0.9);

  if (tex.a <= 0.01) {
    gl_FragColor = vec4(adjustColor(uv, color) * uOpacity, 1.);
    return;
  }

  vec4 final = vec4(mix(tex.rgb, color, 1. - tex.a), 1.);
  gl_FragColor = vec4(adjustColor(uv, final.rgb) * uOpacity, 1.);
}`;


export default bgShader;
