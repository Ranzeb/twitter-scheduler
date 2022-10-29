import React, { useEffect, useState } from "react";
import { useSelector } from "usetheform";
import AnchorSVG from "./../../../assets/anchor.svg";
import { getPreview } from "./utils/getPreview";
import "./Styles.css";

export const PreviewURL = () => {
  const [previewCard, setPreview] = useState(() => null);
  const [enablePreview, setEnablePreview] = useState(() => true);
  const [plainText = ""] = useSelector((state) => state.editor.plainText);

  useEffect(() => {
    let cancel = false;
    getPreview(plainText).then((card) => {
      !cancel && setPreview(card);
    });
    return () => {
      cancel = true;
    };
  }, [plainText]);

  if (!enablePreview || !previewCard) {
    return null;
  }

  const disablePreview = () => setEnablePreview(false);
  const { binding_values = {} } = previewCard;
  const { title, description, vanity_url, player_image } = binding_values;

  return (
    <div className="PreviewURL">
      <div className="PreviewURL__Img">
        <button
          className="Preview__CloseBtn"
          type="button"
          onClick={disablePreview}
        />
        <img alt={title.string_value} src={player_image.image_value.url} />
      </div>
      <div className="PreviewURL__Content">
        <div className="PreviewURL__Title">{title.string_value}</div>
        <div className="PreviewURL__Desc">{description.string_value}</div>
        <div className="PreviewURL__Footer">
          <img alt={vanity_url.string_value} src={AnchorSVG} />
          <span>{vanity_url.string_value}</span>
        </div>
      </div>
    </div>
  );
};
