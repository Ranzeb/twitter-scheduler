import React, { useEffect, useState } from "react";
import { useSelector } from "usetheform";
import { readFileAsDataURL } from "./utils/readFileAsDataURL";
import "./Styles.css";

export const PreviewMedia = () => {
  const [previews, setPreviews] = useState(() => []);
  const [media, setMedia] = useSelector((state) => state.media);

  useEffect(() => {
    const mediaPromises = readFileAsDataURL(media);
    Promise.all(mediaPromises).then((media) => setPreviews(media));
  }, [media]);

  const removeMedia = (mediaName) =>
    setMedia((prevMedia) => {
      const nextMedia = prevMedia.filter(({ name }) => name !== mediaName);
      return nextMedia;
    });

  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="PreviewMedia_Grid">
      {previews.map(({ src, idMedia, type }) => (
        <div key={idMedia} className="PreviewMedia__Wrapper">
          <div className="PreviewMedia">
            <button
              className="Preview__CloseBtn"
              type="button"
              onClick={() => removeMedia(idMedia)}
            />
            {type === "video" && <video controls loop playsInline src={src} />}
            {type === "image" && <img alt={idMedia} src={src} />}
          </div>
        </div>
      ))}
    </div>
  );
};
