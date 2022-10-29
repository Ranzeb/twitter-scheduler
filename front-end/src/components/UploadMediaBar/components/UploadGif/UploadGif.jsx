import React, { useEffect, useState } from "react";
import { useField } from "usetheform";
import UpladGifSVG from "./../../../../assets/gifupload.svg";
import ArrowBackSVG from "./../../../../assets/arrowback.svg";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import "./Styles.css";

export const UploadGif = ({ disabled }) => {
  const { setValue } = useField({ type: "custom", name: "gif" });
  const [showGrid, toggleGrid] = useState(() => false);
  const toggleGifGrid = () => toggleGrid((prev) => !prev);
  const onGifClick = (gif, e) => {
    e.preventDefault();
    setValue(gif);
    toggleGifGrid();
  };
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        className="UploadGif__Btn"
        onClick={toggleGifGrid}
      >
        <img alt="Upload GIF" src={UpladGifSVG} />
      </button>
      {showGrid && (
        <GifGrid onCloseGifGrid={toggleGifGrid} onGifClick={onGifClick} />
      )}
    </div>
  );
};

const fetchGifs = (offset) => giphyFetch.trending({ offset, limit: 10 });
const giphyFetch = new GiphyFetch("sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh");
const maxWidth = 600;
function GifGrid({ onGifClick, onCloseGifGrid }) {
  const [width, setWidth] = useState(window.innerWidth - 20);

  useEffect(() => {
    const resize = ({ target }) => {
      const { innerWidth } = target;
      const newWidth = innerWidth <= maxWidth ? innerWidth : maxWidth;
      setWidth(newWidth - 28);
    };

    resize({ target: window });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="GifGrid">
      <div className="GifGrid__Wrapper">
        <div className="GifGrid__Header">
          <button className="GifGrid__BackBtn">
            <img onClick={onCloseGifGrid} alt="Go back" src={ArrowBackSVG} />
          </button>
        </div>
        <div className="GifGrid__Content">
          <Grid
            onGifClick={onGifClick}
            fetchGifs={fetchGifs}
            width={width}
            columns={3}
            gutter={6}
          />
        </div>
      </div>
    </div>
  );
}
