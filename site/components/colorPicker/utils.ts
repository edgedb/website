export function hsbToHex(hue: number, saturation: number, brightness: number) {
  // Make sure the input values are within valid ranges
  hue = Math.max(0, Math.min(360, hue)); // Hue should be between 0 and 360
  saturation = Math.max(0, Math.min(100, saturation)); // Saturation should be between 0 and 100
  brightness = Math.max(0, Math.min(100, brightness)); // Brightness should be between 0 and 100

  // Convert HSB to RGB
  const chroma = (brightness / 100) * (saturation / 100);
  const huePrime = hue / 60;
  const secondLargestComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const m = brightness / 100 - chroma;

  let R, G, B;

  if (0 <= huePrime && huePrime < 1) {
    R = chroma;
    G = secondLargestComponent;
    B = 0;
  } else if (1 <= huePrime && huePrime < 2) {
    R = secondLargestComponent;
    G = chroma;
    B = 0;
  } else if (2 <= huePrime && huePrime < 3) {
    R = 0;
    G = chroma;
    B = secondLargestComponent;
  } else if (3 <= huePrime && huePrime < 4) {
    R = 0;
    G = secondLargestComponent;
    B = chroma;
  } else if (4 <= huePrime && huePrime < 5) {
    R = secondLargestComponent;
    G = 0;
    B = chroma;
  } else {
    // 5 <= huePrime && huePrime < 6
    R = chroma;
    G = 0;
    B = secondLargestComponent;
  }

  // Adjust RGB values to match the brightness
  R = Math.round((R + m) * 255);
  G = Math.round((G + m) * 255);
  B = Math.round((B + m) * 255);

  // Convert RGB to HEX
  const redHex = R.toString(16).padStart(2, "0");
  const greenHex = G.toString(16).padStart(2, "0");
  const blueHex = B.toString(16).padStart(2, "0");

  return `${redHex}${greenHex}${blueHex}`;
}

export function hexToHSB(hex: string) {
  // Remove the # symbol if it's included in the hex string
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Parse the hex value into its red, green, and blue components
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  // Find the maximum and minimum values among R, G, and B
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h, s, v;

  // Calculate the brightness (value)
  v = max * 100;

  // Calculate the saturation
  s = max === 0 ? 0 : ((max - min) / max) * 100;

  // Calculate the hue
  if (max === min) {
    h = 0; // Achromatic (grayscale)
  } else {
    if (max === r) {
      h = (60 * ((g - b) / (max - min)) + 360) % 360;
    } else if (max === g) {
      h = (60 * ((b - r) / (max - min) + 2)) % 360;
    } else {
      h = (60 * ((r - g) / (max - min) + 4)) % 360;
    }
  }

  return {hue: h, saturation: s, brightness: v};
}

export function isValidHexColor(hex: string) {
  const hexColorRegex = /^([0-9A-Fa-f]{3}){1,2}$/;

  return hexColorRegex.test(hex);
}
