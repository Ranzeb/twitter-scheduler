export const limitTo = (limit) => (editorState) => {
  const { length = 0 } = editorState?.plainText || "";
  return length <= 0 || length > limit ? "out of limits" : undefined;
};
