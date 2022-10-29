import React from "react";
import { useForm } from "usetheform";
import "./Styles.css";

export const Submit = () => {
  const { isValid, pristine, state } = useForm();
  const isEmpty = !state.editor?.plainText && !state.media && !state.gif;
  return (
    <button
      disabled={!isValid || pristine || isEmpty}
      type="submit"
      className="Submit"
    >
      <span>Tweet</span>
    </button>
  );
};
