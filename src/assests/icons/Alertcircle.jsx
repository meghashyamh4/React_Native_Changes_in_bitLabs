import * as React from 'react';
import Svg, {G, Path, Defs, ClipPath, Rect} from 'react-native-svg';
const Alertcircle = props => (
  <Svg
    width={13}
    height={13}
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <G id="alert-circle 1" clipPath="url(#clip0_4240_11837)">
      <Path
        id="Vector"
        d="M6.49992 11.9163C9.49146 11.9163 11.9166 9.49118 11.9166 6.49964C11.9166 3.50809 9.49146 1.08297 6.49992 1.08297C3.50838 1.08297 1.08325 3.50809 1.08325 6.49964C1.08325 9.49118 3.50838 11.9163 6.49992 11.9163Z"
        stroke="white"
        strokeWidth={1.2168}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        id="Vector_2"
        d="M6.50012 4.33258V6.49925"
        stroke="white"
        strokeWidth={1.2168}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        id="Vector_3"
        d="M6.49988 8.66695H6.50554"
        stroke="white"
        strokeWidth={1.2168}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_4240_11837">
        <Rect width={13} height={13} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default Alertcircle;
