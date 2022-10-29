import React, { useState, useEffect, useRef } from "react";
import { Input, useSelector } from "usetheform";

import WorlSVG from "./../../assets/world.svg";
import PrivacySVG_0 from "./../../assets/privacy-world.svg";
import PrivacySVG_1 from "./../../assets/privacy-following.svg";
import PrivacySVG_2 from "./../../assets/privacy-mentioned.svg";

import "./Styles.css";

const labels = {
  0: "Everyone",
  1: "People you follow",
  2: "Only people you mention"
};

export const PrivacyPicker = () => {
  const [visible, setVisibility] = useState(() => false);
  const [postPrivacy] = useSelector((state) => state.postPrivacy);

  const label = labels[postPrivacy] || labels[0];
  const bntLabel = `${label} can reply`;

  const refPicker = useClickOutPicker(() => {
    visible && setVisibility(false);
  });

  const toggle = (e) => {
    e.stopPropagation();
    setVisibility((prev) => !prev);
  };

  // for each value change it closes the Picker
  useEffect(() => {
    if (postPrivacy !== undefined) {
      setVisibility(false);
    }
  }, [postPrivacy]);

  return (
    <div className="PrivacyPicker">
      <button type="button" className="PrivacyPicker_Btn" onClick={toggle}>
        <img alt={bntLabel} src={WorlSVG} />
        <span>{bntLabel}</span>
      </button>
      <div ref={refPicker} data-visible={visible} className="PrivacySelection">
        <div className="PrivacySelection__Header">Who can reply?</div>
        <div className="PrivacySelection__Hint">
          Choose who can reply to this Tweet. Anyone mentioned can always reply.
        </div>
        <div className="PrivacySelection__Radios">
          <RadioWithLabel img={PrivacySVG_0} id="everyone" value="0" checked>
            {labels[0]}
          </RadioWithLabel>
          <RadioWithLabel img={PrivacySVG_1} id="onlyfollower" value="1">
            {labels[1]}
          </RadioWithLabel>
          <RadioWithLabel img={PrivacySVG_2} id="onlymentioned" value="2">
            {labels[2]}
          </RadioWithLabel>
        </div>
      </div>
    </div>
  );
};

function RadioWithLabel({
  id,
  img,
  name = "postPrivacy",
  children,
  value,
  checked
}) {
  return (
    <div className="RadioWithLabel">
      <Input type="radio" id={id} name={name} value={value} checked={checked} />
      <label className="RadioWithLabel__Label" htmlFor={id}>
        <img alt="privacy" src={img} />
        <span>{children}</span>
      </label>
    </div>
  );
}

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
