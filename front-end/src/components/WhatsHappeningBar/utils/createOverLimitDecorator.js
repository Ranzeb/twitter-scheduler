import React from "react";

export const createOverLimitDecorator = (maxChars) => {
  function overLimitStrategy(contentBlock, callback) {
    const text = contentBlock.getText();
    const { length } = text;
    if (length >= maxChars) {
      callback(maxChars, length);
    }
  }

  return {
    strategy: overLimitStrategy,
    component: OverLimit
  };
};

function OverLimit({ children }) {
  return <span className="Editor__OverLimit">{children}</span>;
}
