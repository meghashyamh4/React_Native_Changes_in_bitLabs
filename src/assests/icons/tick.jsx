import * as React from 'react';
import Svg, {G, Path} from 'react-native-svg';
const tick = props => (
  <Svg
    width={17}
    height={16}
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <G id="check 1">
      <Path
        id="Vector"
        d="M13.8333 4L6.49996 11.3333L3.16663 8"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);
export default tick;
