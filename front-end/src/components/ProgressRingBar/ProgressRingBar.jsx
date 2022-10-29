import React from "react";

export const ProgressRingBar = ({
  textLabel,
  colorBar = "#1da1f2",
  radius = 20,
  stroke = 2,
  progress = 0,
  hideRingBar
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const transform = `translate(0 ${radius * 2}) rotate(-90 0 0)`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      {!hideRingBar && (
        <g transform={transform}>
          <circle
            stroke="#ebeef0"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={colorBar}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            r={normalizedRadius}
            style={{ strokeDashoffset }}
            cx={radius}
            cy={radius}
          />
        </g>
      )}
      {textLabel && (
        <text fill={colorBar} x="50%" y="50%" textAnchor="middle" dy=".3em">
          {textLabel}
        </text>
      )}
    </svg>
  );
};
