import React from "react";

export const createHighlightDecorator = (regex) => {
  function hashTagStrategy(contentBlock, callback) {
    const text = contentBlock.getText();
    let matchArr, start;
    while ((matchArr = regex.exec(text)) !== null) {
      start = matchArr.index;
      callback(start, start + matchArr[0].length);
    }
  }

  return {
    strategy: hashTagStrategy,
    component: HashTag
  };
};

function HashTag({ children }) {
  return <span className="Editor__Highlight">{children}</span>;
}
