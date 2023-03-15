import dynamic from "next/dynamic";

export const BarLatencyChart = dynamic(
  () => import("./charts").then((module) => module.BarLatencyChart as any),
  {ssr: false}
);

export const BoxLatencyChart = dynamic(
  () => import("./charts").then((module) => module.BoxLatencyChart as any),
  {ssr: false}
);

export const BarBoxLatencyChart = dynamic(
  () => import("./charts").then((module) => module.BarBoxLatencyChart as any),
  {ssr: false}
);
