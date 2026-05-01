import * as React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const BlogSolid = (props: React.ComponentProps<typeof Svg>) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Defs>
      <LinearGradient
        id="blogGradient"
        x1="0"
        y1="24"
        x2="24"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0.25" stopColor="#F97316" />
        <Stop offset="1" stopColor="#FAA729" />
      </LinearGradient>
    </Defs>

    {/* Outer box */}
    <Path
      d="M5.25 3.75h13.5c.828 0 1.5.672 1.5 1.5v13.5c0 .828-.672 1.5-1.5 1.5H5.25c-.828 0-1.5-.672-1.5-1.5V5.25c0-.828.672-1.5 1.5-1.5Z"
      fill="url(#blogGradient)"
    />

    {/* Inner lines */}
    <Path
      d="M7.5 8.25h9M7.5 12h9M7.5 15.75h6"
      stroke="white"   // ✅ keep text lines visible
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export default BlogSolid;
