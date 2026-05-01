import * as React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle} from 'react-native-svg';

const MentorSphereSolid = props => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Defs>
      <LinearGradient
        id="mentorGradient"
        x1="0"
        y1="24"
        x2="24"
        y2="0"
        gradientUnits="userSpaceOnUse">
        <Stop offset="0.25" stopColor="#F97316" />
        <Stop offset="1" stopColor="#FAA729" />
      </LinearGradient>
    </Defs>
    {/* Person/Mentor icon */}
    <Circle cx="12" cy="8" r="3.5" fill="url(#mentorGradient)" />
    <Path
      d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20"
      fill="url(#mentorGradient)"
    />
    {/* Connection lines */}
    <Path
      d="M2 12L6 8M18 8L22 12"
      stroke="url(#mentorGradient)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

export default MentorSphereSolid;

