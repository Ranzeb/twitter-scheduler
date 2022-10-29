export const extractPlainText = (editor) => {
  const editorState = editor?.editorState;
  const currentContent = editorState?.getCurrentContent?.();
  const plainText = currentContent?.getPlainText?.("") || "";
  const nextEditorState = { ...editor, plainText };
  return nextEditorState;
};
