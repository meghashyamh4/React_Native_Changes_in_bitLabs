import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const BlogOutline = ({ width = 24, height = 24, color = "currentColor" }) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.25C4 4.42157 4.67157 3.75 5.5 3.75H18.5C19.3284 3.75 20 4.42157 20 5.25V18.75C20 19.5784 19.3284 20.25 18.5 20.25H5.5C4.67157 20.25 4 19.5784 4 18.75V5.25ZM8 8.25H16M8 12H16M8 15.75H13"
      />
    </Svg>
  );
};

BlogOutline.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
};

BlogOutline.defaultProps = {
  width: 24,
  height: 24,
  color: "currentColor",
};

export default BlogOutline;
