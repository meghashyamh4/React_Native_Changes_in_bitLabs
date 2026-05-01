import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';
import PropTypes from 'prop-types';

const MentorSphereOutline = ({width = 24, height = 24, color = 'currentColor'}) => {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke={color}>
      {/* Person/Mentor icon */}
      <Circle cx="12" cy="8" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Connection lines */}
      <Path
        d="M2 12L6 8M18 8L22 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

MentorSphereOutline.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
};

MentorSphereOutline.defaultProps = {
  width: 24,
  height: 24,
  color: 'currentColor',
};

export default MentorSphereOutline;

