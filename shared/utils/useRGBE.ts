import { useLoader } from '@react-three/fiber';
import { type Texture } from 'three';

import { RGBELoader } from './_RGBELoader';

export default function useRGBE<T extends string | string[]>(
  path: T,
): T extends any[] ? (Texture)[] : Texture {
  return useLoader(RGBELoader, path)
}

useRGBE.preload = (
  path: string | string[],
) => useLoader.preload(RGBELoader, path);

useRGBE.clear = (input: string | string[]) => useLoader.clear(RGBELoader, input);
