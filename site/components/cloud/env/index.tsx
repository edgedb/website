'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { StatsGl } from '@react-three/drei'
import Environment from './env';
import { Settings, Pane, usePaneSetting, readPaneSettings } from '@/components/cloud/settings';

import styles from "./env.module.scss";
import { useWebgl } from '@edgedb-site/shared/utils/hasWebgl';

type ThreeOptions = {
  eventSource?: React.MutableRefObject<HTMLElement>
}

function ThreeCore({eventSource}: ThreeOptions) {
  const [lowPerf, setLowPerf] = useState<boolean>(false);

  const nativeDpr = typeof window == 'undefined' ? 1 : window.devicePixelRatio;

  let [maxDpr, setMaxDpr] = usePaneSetting('scene_max_dpr');
  maxDpr = Math.min(nativeDpr, maxDpr);

  const {debug_show_statsgl: statsgl} = readPaneSettings(['debug_show_statsgl']);

  const [dpr, setDpr] = useState<number>(maxDpr);

  if (dpr != maxDpr) {
    setDpr(maxDpr);
  }

  return <>
    <Canvas
          className={styles.three}
          eventSource={eventSource}
          eventPrefix="client"
          gl={{antialias: false}}
          style={{height: '115vh'}}
          dpr={dpr}>
      {statsgl ? <StatsGl /> : null}
      <Environment lowPerf={lowPerf} />
    </Canvas>
  </>
}

function Three({eventSource}: ThreeOptions) {
  const [showDebug, setShowDebug] = useState(false);
  const hasWebgl = useWebgl();

  useEffect(() => {
    if (typeof window != 'undefined' && window.location.href.match('debug')) {
      setShowDebug(true);
    }
  }, []);

  return <Settings>
    {showDebug ? <Pane /> : null}
    {hasWebgl ? <ThreeCore eventSource={eventSource}/> : null}
  </Settings>
}

export default Three;
