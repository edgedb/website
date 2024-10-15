import {useState, useEffect} from 'react';

export function hasWebgl() {
  // @ts-ignore
  const cached = window['_edgedb_haswebgl'];
  if (typeof cached !== 'undefined') {
    return cached;
  }
  try {
    const canvas = document.createElement('canvas');
    const has = !!(
      window.WebGLRenderingContext &&
      // threejs needs webgl2, specifically
      canvas.getContext('webgl2')
    );
    // @ts-ignore
    window['_edgedb_haswebgl'] = has;
    return has;
  } catch (e) {
    // @ts-ignore
    window['_edgedb_haswebgl'] = false;
    return false;
  }
}

export function useWebgl() {
  const [has, setHas] = useState(false);

  useEffect(() => {
    if (hasWebgl()) {
      setHas(true);
    }
  }, []);

  return has;
}
