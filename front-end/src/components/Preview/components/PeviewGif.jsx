import React from "react";
import { useSelector } from "usetheform";

import "./Styles.css";

export const PeviewGif = () => {
  const [gif, setGif] = useSelector((state) => state.gif);

  const removeGif = () => setGif(null);

  if (!gif?.images) {
    return null;
  }

  return (
    <div className="PreviewMedia_Grid">
      <div className="PreviewMedia__Wrapper">
        <div className="PreviewMedia">
          <button
            className="Preview__CloseBtn"
            type="button"
            onClick={removeGif}
          />
          <img alt="GIF" src={gif.images.original.url} />
        </div>
      </div>
    </div>
  );
};
