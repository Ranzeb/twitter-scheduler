import "./sidebarLink.css";
import React from "react";

function SidebarLink({ text, Icon }) {
    return(
      <div className="link">
          <Icon />
          <h2>{text}</h2>
      </div>
    );
  }
export default SidebarLink;