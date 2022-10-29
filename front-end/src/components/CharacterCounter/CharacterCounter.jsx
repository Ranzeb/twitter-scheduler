import React from "react";
import { useSelector } from "usetheform";
import { ProgressRingBar } from "./../ProgressRingBar/ProgressRingBar";
import { getProgressRingBarProps } from "./utils/getProgressRingBarProps";
import "./Styles.css";

export const CharacterCounter = ({ maxChars }) => {
  const [plainText] = useSelector((state) => state.editor.plainText);

  const { uiStatus, ...propsRingBar } = getProgressRingBarProps(
    plainText,
    maxChars
  );

  return (
    <div data-ui={uiStatus} className="ProgressRingBar">
      <ProgressRingBar {...propsRingBar} />
    </div>
  );
};
