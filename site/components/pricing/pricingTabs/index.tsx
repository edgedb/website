import {useState} from "react";
import cn from "@edgedb/common/utils/classNames";
import {ProSubscriptionIcon} from "../../icons";
import {Tiers} from "@edgedb-site/shared/utils/getLoginUrl";
import styles from "./pricingTabs.module.scss";

interface PricingTabsProps {
  nav: Tiers[];
  tabs: JSX.Element[];
}

const PricingTabs = ({nav, tabs}: PricingTabsProps) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div className={styles.container}>
      <ul className={styles.nav}>
        {nav.map((title, index) => (
          <li
            key={title}
            className={cn(styles.item, {
              [styles.active]: activeTabIndex === index,
            })}
            onClick={() => setActiveTabIndex(index)}
          >
            {title === Tiers.pro && <ProSubscriptionIcon />}
            {title}
          </li>
        ))}
      </ul>
      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={cn(styles.tab, {
              [styles.active]: index === activeTabIndex,
            })}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingTabs;
