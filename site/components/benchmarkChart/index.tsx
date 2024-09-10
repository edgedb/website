import {useState} from "react";
import cn from "@edgedb/common/utils/classNames";

import styles from "./benchmarkChart.module.scss";

export type BenchmarkChartData = {
  [group: string]: {label: string; value: number; highlighted?: boolean}[];
};

export interface BenchmarkChartProps {
  className?: string;
  data: BenchmarkChartData;
  groupLabel: string;
  sortData?: boolean;
  axisTickSize: number;
  axisLabel: string;
  defaultSelected?: string;
}

export default function BenchmarkChart({
  className,
  data,
  groupLabel,
  sortData,
  axisTickSize,
  axisLabel,
  defaultSelected,
}: BenchmarkChartProps) {
  const [selectedGroup, setSelectedGroup] = useState(
    () => defaultSelected ?? Object.keys(data)[0]
  );

  let selectedData = data[selectedGroup];
  if (sortData) {
    selectedData = [...selectedData].sort((a, b) => b.value - a.value);
  }

  const maxValue =
    Math.ceil(Math.max(...selectedData.map((d) => d.value)) / axisTickSize) *
    axisTickSize;
  const tickCount = maxValue / axisTickSize;
  const tickPercent = 100 / tickCount;

  return (
    <div className={cn(styles.benchmarkChart, className)}>
      <div className={styles.groupSelector}>
        <span>{groupLabel}</span>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          {Object.keys(data).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.chart}>
        {selectedData.map((item) => (
          <div
            className={cn(styles.chartRow, {
              [styles.highlighted]: !!item.highlighted,
            })}
            key={item.label}
          >
            <div className={styles.rowLabel}>{item.label}</div>
            <div
              className={styles.dataLine}
              style={{
                maskImage: `repeating-linear-gradient(90deg, black,
                    black calc(${tickPercent}% - 2px),
                    transparent calc(${tickPercent}% - 2px),
                    transparent ${tickPercent}%),
                    linear-gradient(90deg, black 2px, transparent 2px)`,
              }}
            >
              <div
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
        <div className={styles.axis}>
          {Array(tickCount + 1)
            .fill(0)
            .map((_, i) => (
              <div
                className={styles.tick}
                style={{left: `${(100 / tickCount) * i}%`}}
                key={i}
              >
                <span>{formatAxisNumber(i * axisTickSize)}</span>
              </div>
            ))}
        </div>
      </div>
      <div className={styles.axisLabel}>{axisLabel}</div>
    </div>
  );
}

const sizeSuffixes = ["", "k", "m"];
function formatAxisNumber(n: number) {
  if (n === 0) return "0";
  const mag = Math.floor(Math.log10(n) / 3);
  return `${n / Math.pow(1000, mag)}${sizeSuffixes[mag]}`;
}
