import {useState, useRef} from "react";

import cn from "@edgedb-site/shared/utils/classNames";
import styles from "./tabs.module.scss";

interface TabsProps {
  tabs: any[];
  className?: string;
}

export default function Tabs({tabs, className}: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const tabsRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.tabs} ref={tabsRef}>
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={cn(styles.tab, {
              [styles.active]: activeTab === i,
            })}
            onClick={() => setActiveTab(i)}
          >
            <span>{tab.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.tabImgs}>
        {tabs.map((tab, i) => (
          <img
            src={tab.url}
            alt={tab.alt || tab.name}
            className={cn({[styles.active]: activeTab === i})}
            width="2892"
            height="2100"
          ></img>
        ))}
      </div>
    </div>
  );
}
