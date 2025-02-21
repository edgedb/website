export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function ordinalSuffix(num: number): string {
  const numStr = num.toString();
  if (numStr.endsWith("1") && !numStr.endsWith("11")) {
    return "st";
  }
  if (numStr.endsWith("2") && !numStr.endsWith("12")) {
    return "nd";
  }
  if (numStr.endsWith("3") && !numStr.endsWith("13")) {
    return "rd";
  }
  return "th";
}
