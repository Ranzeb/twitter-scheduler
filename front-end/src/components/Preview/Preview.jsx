import React from "react";
import { useForm } from "usetheform";
import { PreviewURL } from "./components/PreviewURL";
import { PreviewMedia } from "./components/PreviewMedia";
import { PeviewGif } from "./components/PeviewGif";
import "./Styles.css";

export const Preview = () => {
  const { state } = useForm();
  const hidePreviewURL = state?.media !== undefined || state?.gif !== undefined;
  return (
    <div className="Preview__Wrapper">
      {!hidePreviewURL && <PreviewURL />}
      <PreviewMedia />
      <PeviewGif />
    </div>
  );
};
