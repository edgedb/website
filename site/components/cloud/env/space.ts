import { noiseShader, acesShader, contrastShader } from "@edgedb-site/shared/utils/effects";
import { NoiseOptions, ACESFilmOptions, ContrastOptions } from "@edgedb-site/shared/utils/effects";


type BGOptions = {
  noise: NoiseOptions,
  aces: ACESFilmOptions,
  contrast: ContrastOptions,
};

const bgShader = (options: BGOptions) => /*glsl*/`precision highp float;

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

#if FORMULA == 0
#define F(x)   (clamp(1. - (x), 0., 1.))
#else
#define F(x)   (exp(-(x) * (x) * 2.))
#endif

vec3 line(vec3 rP, vec3 rD, vec3 lS, vec3 lE, float str)
{
  if (str <= 0.) {
    return vec3(0., 0., 0.);
  }

	float bL = length(lE-lS);
	vec3 bD = (lE-lS)/bL;
	vec3 tD = lS-rP;
	float aDb = dot(rD,bD);
	float aDt = dot(rD,tD);
	float bDt = dot(bD,tD);
	float u = (aDt-bDt*aDb)/(1.-aDb*aDb);
	float v = clamp(u*aDb-bDt, .0, bL);
	u = clamp(v*aDb+aDt, 0., 1e6);

  float l = length((rP+rD*u)-(lS+bD*v));
  float grad = F(l);

  float d = dot(tD, cross(bD, rD));

  vec4 color;
  if (d >= 0.0) {
    color = mix(C3, C2, grad);
  } else {
    color = mix(C1, C2, grad);
  }

  return color.rgb * grad * color.a * str;
}


vec3 blob(vec3 ro, vec3 rd, vec3 p, vec4 color, float str) {
  if (str <= 0.) {
    return vec3(0., 0., 0.);
  }
  vec3 diff = p - ro;
  float d = length(cross(diff, rd)) / length(rd);
  d = exp(-d*d * 10.);
  return color.rgb * d * color.a * str;
}

vec3 adjustColor(vec2 uv, vec3 color) {
  return applyNoise(uv, applyACES(applyContrast(color)));
}

void main()
{
  vec2 uv = (gl_FragCoord.xy - .5 * uResolution.xy) / max(uResolution.x, uResolution.y);
  vec2 uv0 = uv;
  vec3 color = COLOR_SCENE;

#ifndef DISABLE_CAM_PARA
  uv += uMouse.xy / CAM_PARA;
#endif
  uv.y -= uScroll * SCROLL_FACTOR;

  vec3 ro = vec3(0., -uScroll, 1.);
  vec3 lookat = vec3(0., -uScroll, 0.);

  vec3 f = normalize(lookat-ro);
  vec3 r = normalize(cross(vec3(0., 1., 0.), f));
  vec3 u = cross(f, r);

  vec3 c = ro + f * CAM_ZOOM;
  vec3 i = c + uv.x*r + uv.y*u;
  vec3 rd = normalize(i - ro);

  color += line(ro, rd, L1P1, L1P2, L1S);
  color += line(ro, rd, L2P1, L2P2, L2S);
  color += line(ro, rd, L3P1, L3P2, L3S);
  color += line(ro, rd, L4P1, L4P2, L4S);
  color += line(ro, rd, L5P1, L5P2, L5S);
  color += line(ro, rd, L6P1, L6P2, L6S);
  color += line(ro, rd, L7P1, L7P2, L7S);

  color += blob(ro, rd, B1P + vec3(0., -uScroll, .0), B1C, B1S);
  color += blob(ro, rd, B2P + vec3(0., -uScroll, .0), B2C, B2S);
  color += blob(ro, rd, B3P + vec3(0., -uScroll, .0), B3C, B3S);

  color = clamp(color, 0., 1.);

  color /= clamp((uScroll - FADE_AFTER) * FADE_COEFF, 0., MAX_FADE) + 1.;

  gl_FragColor = vec4(adjustColor(uv0, color.rgb) * uOpacity, 1.0);
}`;


export default bgShader;
