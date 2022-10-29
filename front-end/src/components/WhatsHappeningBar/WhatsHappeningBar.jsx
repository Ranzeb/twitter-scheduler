import React from "react";
import { Collection, Input } from "usetheform";
import { DraftEditor } from "./DraftEditor";
import { extractPlainText } from "./utils/extractPlainText";
import { limitTo } from "./utils/limitTo";

import "./Styles.css";

export const WhatsHappeningBar = ({ maxChars }) => {
  return (
    <div className="WhatsHappeningBar">
      <Collection
        object
        name="editor"
        validators={[limitTo(maxChars)]}
        reducers={extractPlainText}
      >
        <DraftEditor name="editorState" maxChars={maxChars} />
        <Input type="hidden" name="plainText" />
      </Collection>
    </div>
  );
};
