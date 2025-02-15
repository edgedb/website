import {useState} from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import styles from "./tabs.module.scss";

interface TabsProps {
  className?: string;
  tabs: {
    name: string;
    content: JSX.Element;
  }[];
}

export default function Tabs(props: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <ControlledTabs
      {...props}
      selectedTab={selectedTab}
      onTabSelected={setSelectedTab}
    />
  );
}

export function ControlledTabs({
  className,
  tabs,
  selectedTab,
  onTabSelected,
}: TabsProps & {
  selectedTab: number;
  onTabSelected: (tabIndex: number) => void;
}) {
  return (
    <div className={cn(styles.tabs, className)}>
      <div className={styles.tabHeaders}>
        {tabs.map(({name}, i) => (
          <div
            key={i}
            className={cn(styles.tabHeader, {
              [styles.selected]: selectedTab === i,
            })}
            onClick={() => onTabSelected(i)}
          >
            {name}
          </div>
        ))}
      </div>
      <div className={styles.tabContent}>{tabs[selectedTab].content}</div>
    </div>
  );
}
