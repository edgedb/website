'use client';

import {useState, useEffect} from 'react';

import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, StatsGl } from '@react-three/drei'
import { Settings, Pane, usePaneSetting, readPaneSettings, setInfo } from '@/components/index/settings';
import Environment from "./env";
import {PatchedView} from "@edgedb-site/shared/utils/view";
import {useWebgl} from "@edgedb-site/shared/utils/hasWebgl";
import styles from "./env.module.scss";

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

  const latestStats =
    `DPR=${dpr} / native=${nativeDpr} | ${lowPerf ? 'Low Settings' : 'High Settings'}`;
  setInfo(latestStats);

  return <>
    <Canvas
          className={styles.three}
          eventSource={eventSource}
          eventPrefix="client"
          gl={{antialias: false}}
          style={{height: '115vh'}}
          dpr={dpr}>

      <Environment lowPerf={lowPerf} />
      <PatchedView.Port />

      {statsgl ? <StatsGl /> : null}

      <PerformanceMonitor
        flipflops={0}
        bounds={(refreshrate) => (refreshrate > 90 ? [50, 90] : [50, 60])}
        onDecline={
          () => {
            setDpr(1);
            setMaxDpr(1);
            setLowPerf(true);
          }
        }
      />
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
    {hasWebgl ? <ThreeCore eventSource={eventSource} /> : null}
  </Settings>
}

export default Three;
