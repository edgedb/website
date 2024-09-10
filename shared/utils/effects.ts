export type NoiseOptions = {
  enabled?: boolean
  speed?: number
  intensity?: number
  mean?: number
  variance?: number
}

export const noiseShader = (options: NoiseOptions) => {
  const
    enabled = options.enabled ?? false,
    speed = options.speed ?? .3,
    intensity = options.intensity ?? .1,
    mean = options.mean ?? .0,
    variance = options.variance ?? .44;

  return (
    enabled ?
      /*glsl*/`
      #define SPEED ${speed.toFixed(2)}
      #define INTENSITY ${intensity.toFixed(2)}
      // What gray level noise should tend to.
      #define MEAN ${mean.toFixed(2)}
      // Controls the contrast/variance of noise.
      #define VARIANCE ${variance.toFixed(2)}

      vec3 channel_mix(vec3 a, vec3 b, vec3 w) {
        return vec3(mix(a.r, b.r, w.r), mix(a.g, b.g, w.g), mix(a.b, b.b, w.b));
      }

      float gaussian(float z, float u, float o) {
        return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
      }

      vec3 overlay(vec3 a, vec3 b, float w) {
        return mix(a, channel_mix(
            2.0 * a * b,
            vec3(1.0) - 2.0 * (vec3(1.0) - a) * (vec3(1.0) - b),
            step(vec3(0.5), a)
        ), w);
      }

      float erand(vec2 co)
      {
        // https://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
        float a = 12.9898;
        float b = 78.233;
        float c = 43758.5453;
        float dt= dot(co.xy, vec2(a,b));
        float sn= mod(dt, 3.14);
        return fract(sin(sn) * c);
      }

      vec3 applyNoise(in vec2 uv, in vec3 color) {
        float w = float(INTENSITY);
        float t = mod(uTime * float(SPEED), 65536.);
        float seed = erand(uv);
        float noise = fract(sin(seed) * 43758.5453 + t);
        noise = gaussian(noise, float(MEAN), float(VARIANCE) * float(VARIANCE));
        vec3 grain = vec3(noise) * (1.0 - color.rgb);
        return overlay(color.rgb, grain, w);
      }
      `
    :
    /*glsl*/`
      vec3 applyNoise(in vec2 uv, in vec3 color) {
        return color;
      }
    `
  );
}


export type ACESFilmOptions = {
  enabled?: boolean
}

export const acesShader = (options: ACESFilmOptions) => {
  return (
    options.enabled ?
    /*glsl*/`
      vec3 applyACES(vec3 x) {
        float a = 2.41;
        float b = 0.03;
        float c = 2.43;
        float d = 0.59;
        float e = 0.14;
        return (x*(a*x+b))/(x*(c*x+d)+e);
      }
    ` :
    /*glsl*/`
    vec3 applyACES(vec3 x) {
      return x;
    }
    `
  );
};


export type ContrastOptions = {
  enabled?: boolean
  r?: {amount: number, correction: number}
  g?: {amount: number, correction: number}
  b?: {amount: number, correction: number}
}

export const contrastShader = (options: ContrastOptions) => {
  const
    r = options.r ?? {amount: 1, correction: 1},
    g = options.g ?? {amount: 2, correction: 0.7},
    b = options.b ?? {amount: 2.6, correction: 0.6};

  return (
    options.enabled ?
    /*glsl*/`
      float SCurve(float value, float amount, float correction) {
        float curve = 1.0;

        if (value < 0.5) {
          curve = pow(value, amount) * pow(2.0, amount) * 0.5;
        }
        else {
          curve = 1.0 - pow(1.0 - value, amount) * pow(2.0, amount) * 0.5;
        }

        return pow(curve, correction);
      }

      vec3 applyContrast(vec3 color) {
        return vec3(
          SCurve(color.r, ${r.amount.toFixed(2)}, ${r.correction.toFixed(2)}),
          SCurve(color.g, ${g.amount.toFixed(2)}, ${g.correction.toFixed(2)}),
          SCurve(color.b, ${b.amount.toFixed(2)}, ${b.correction.toFixed(2)})
        );
      }
    ` :
    /*glsl*/`
      #define applyContrast(color) (color)
  `
  );
}
