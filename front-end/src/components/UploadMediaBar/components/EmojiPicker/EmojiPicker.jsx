import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "usetheform";
import { EditorState, Modifier } from "draft-js";
import EmojiSVG from "./../../../../assets/emojipicker.svg";
import Picker from "emoji-picker-react";
import "./Styles.css";

export const EmojiPicker = ({ disabled }) => {
  const [showEmojiPicker, togglePicker] = useState(() => false);
  const [editor, setEditor] = useSelector((state) => state.editor);

  const toggleEmojiPicker = () => togglePicker((prev) => !prev);
  const onEmojiClick = (e, emojiObject) => {
    e.preventDefault();
    const { editorState, refEditor } = editor;
    const contentState = editorState?.getCurrentContent();
    const targetRange = editorState?.getSelection();
    const modifierAPI = targetRange.isCollapsed()
      ? Modifier.insertText
      : Modifier.replaceText;
    const newContentState = modifierAPI(
      contentState,
      targetRange,
      emojiObject.emoji
    );
    const newEditorState = EditorState.push(editorState, newContentState);
    setEditor((prev) => ({ ...prev, editorState: newEditorState }));
    toggleEmojiPicker();
    setTimeout(() => refEditor.current.focus(), 100);
  };

  const refPicker = useClickOutPicker(() => {
    showEmojiPicker && togglePicker(false);
  });

  return (
    <div ref={refPicker} className="EmojiPicker">
      <button
        disabled={disabled}
        type="button"
        className="EmojiPicker__Btn"
        onClick={toggleEmojiPicker}
      >
        <img alt="Add Emoji" src={EmojiSVG} />
      </button>
      {showEmojiPicker && (
        <div className="EmojiPicker__Wrapper">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
};

const useClickOutPicker = (cb) => {
  const ref = useRef(null);
  useEffect(() => {
    const clickOut = (e) => {
      if (!ref.current.contains(e.target)) {
        cb(e);
      }
    };
    window.addEventListener("click", clickOut);
    return () => {
      window.removeEventListener("click", clickOut);
    };
  }, [cb]);
  return ref;
};
