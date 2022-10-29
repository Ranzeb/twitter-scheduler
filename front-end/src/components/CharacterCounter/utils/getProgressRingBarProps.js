import { getColors } from "./getColors";

const WARNING_AFTER = 10; // percentage to show the warning
export const getProgressRingBarProps = (
  plainText = "",
  maxChars,
  warningLimit = WARNING_AFTER
) => {
  const { length = 0 } = plainText;
  const progress = Math.min((100 * length) / maxChars, 100);

  const warningRange = (maxChars * warningLimit) / 100;
  const colorBar = getColors(length, maxChars, warningRange);

  const uiStatus = length >= maxChars - warningRange ? "bigRing" : "smallRing";
  const textLabel = uiStatus === "bigRing" && `${maxChars - length}`;
  const hideRingBar = length - maxChars > warningLimit;

  return { progress, textLabel, hideRingBar, colorBar, uiStatus };
};
