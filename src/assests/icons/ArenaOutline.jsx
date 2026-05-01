import React from 'react';
import Svg, {Path} from 'react-native-svg';
import PropTypes from 'prop-types';

const ArenaOutline = ({width = 24, height = 24, color = 'currentColor'}) => {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke={color}>
      {/* Trophy/Shield icon */}
      <Path
        d="M12 2L15 5H18C18.5523 5 19 5.44772 19 6V8C19 10.7614 16.7614 13 14 13H10C7.23858 13 5 10.7614 5 8V6C5 5.44772 5.44772 5 6 5H9L12 2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 13V15C8 17.2091 9.79086 19 12 19C14.2091 19 16 17.2091 16 15V13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19V22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

ArenaOutline.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
};

ArenaOutline.defaultProps = {
  width: 24,
  height: 24,
  color: 'currentColor',
};

export default ArenaOutline;

