import React from "react";
import { Input } from "usetheform";
//import UploadImgSvg from "./../../../../assets/uploadimages.svg";
//import "./Styles.css";
//<img alt="Upload" src={UploadImgSvg} />
export const UploadImgVideo = ( ) => {
  return (

      <Input  type="file" multiple name="media" id="media" />
  );
};
