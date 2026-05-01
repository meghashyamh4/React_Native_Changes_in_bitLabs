import * as React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop} from 'react-native-svg';

const ArenaSolid = props => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Defs>
      <LinearGradient
        id="arenaGradient"
        x1="0"
        y1="24"
        x2="24"
        y2="0"
        gradientUnits="userSpaceOnUse">
        <Stop offset="0.25" stopColor="#F97316" />
        <Stop offset="1" stopColor="#FAA729" />
      </LinearGradient>
    </Defs>
    {/* Trophy/Shield icon */}
    <Path
      d="M12 2L15 5H18C18.5523 5 19 5.44772 19 6V8C19 10.7614 16.7614 13 14 13H10C7.23858 13 5 10.7614 5 8V6C5 5.44772 5.44772 5 6 5H9L12 2Z"
      fill="url(#arenaGradient)"
    />
    <Path
      d="M8 13V15C8 17.2091 9.79086 19 12 19C14.2091 19 16 17.2091 16 15V13"
      stroke="url(#arenaGradient)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M12 19V22"
      stroke="url(#arenaGradient)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

export default ArenaSolid;

