import * as React from 'react';
import Svg, {
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
} from 'react-native-svg';

const BellsIcon = props => (
  <Svg
    width={25.002}
    height={30.033}
    viewBox="0 0 25.002 30.033"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Defs>
      <ClipPath id="clip-path">
        <Rect width={25.002} height={30.033} fill="none" />
      </ClipPath>
      <ClipPath id="clip-path-2">
        <Path
          d="M330.148,0h-.027a2.871,2.871,0,0,0-2.362,1.4,3.292,3.292,0,0,0-.441,1.222,6.137,6.137,0,0,0-.069.745h5.776a6.125,6.125,0,0,0-.069-.745,3.292,3.292,0,0,0-.441-1.222A2.871,2.871,0,0,0,330.151,0Z"
          transform="translate(-327.248 -0.001)"
          fill="none"
        />
      </ClipPath>
      <LinearGradient
        id="linear-gradient"
        x1="-1.594"
        y1="8.918"
        x2="-1.589"
        y2="8.918"
        gradientUnits="objectBoundingBox">
        <Stop offset="0" stopColor="#f2b446" />
        <Stop offset="0.38" stopColor="#f4b140" />
        <Stop offset="0.855" stopColor="#fca931" />
        <Stop offset="1" stopColor="#ffa62b" />
      </LinearGradient>
      <ClipPath id="clip-path-3">
        <Path
          d="M65.894,88.162a10.533,10.533,0,0,0-1.412,3.909c-.854,5.641,1.136,6.275-1.3,11.407H83.819a17.3,17.3,0,0,1-.718-1.725c-1.268-3.643.164-4.743-.584-9.682a10.533,10.533,0,0,0-1.412-3.909q-.138-.226-.282-.437A9.157,9.157,0,0,0,73.5,83.682h-.043a9.185,9.185,0,0,0-7.563,4.48"
          transform="translate(-63.18 -83.682)"
          fill="none"
        />
      </ClipPath>
      <LinearGradient
        id="linear-gradient-2"
        x1="-0.086"
        y1="1.396"
        x2="-0.085"
        y2="1.396"
        gradientUnits="objectBoundingBox">
        <Stop offset="0" stopColor="#ffa62b" />
        <Stop offset="0.353" stopColor="#ffbb14" />
        <Stop offset="0.713" stopColor="#ffca05" />
        <Stop offset="1" stopColor="#ffd000" />
      </LinearGradient>
      <ClipPath id="clip-path-5">
        <Rect width={8.34} height={19.72} fill="none" />
      </ClipPath>
      <ClipPath id="clip-path-6">
        <Path
          d="M281.372,918.695a4.179,4.179,0,1,0,8.358,0Z"
          transform="translate(-281.372 -918.695)"
          fill="none"
        />
      </ClipPath>
      <LinearGradient
        id="linear-gradient-3"
        x1="-0.947"
        y1="1"
        x2="-0.944"
        y2="1"
        gradientUnits="objectBoundingBox">
        <Stop offset="0" stopColor="#f29550" />
        <Stop offset="0.273" stopColor="#f1924c" />
        <Stop offset="0.482" stopColor="#ee8c43" />
        <Stop offset="0.669" stopColor="#e88032" />
        <Stop offset="0.842" stopColor="#e1701c" />
        <Stop offset="1" stopColor="#d95d00" />
      </LinearGradient>
    </Defs>
    <G clipPath="url(#clip-path)">
      <G transform="translate(9.209 0)">
        <G clipPath="url(#clip-path-2)">
          <Rect
            width={5.776}
            height={3.368}
            transform="translate(0 0)"
            fill="url(#linear-gradient)"
          />
        </G>
      </G>
      <G transform="translate(1.778 2.355)">
        <G clipPath="url(#clip-path-3)">
          <Rect
            width={20.639}
            height={19.923}
            transform="translate(0 -0.126)"
            fill="url(#linear-gradient-2)"
          />
        </G>
      </G>
      <G transform="translate(0 0)">
        <G clipPath="url(#clip-path)">
          <G transform="translate(2.878 2.432)">
            <G>
              <G clipPath="url(#clip-path-5)">
                <Path
                  d="M105.783,94.169a11.909,11.909,0,0,1,1.322-4.1,9.068,9.068,0,0,1,3.508-3.666,8.18,8.18,0,0,0-5.916,4.4,11.362,11.362,0,0,0-1.261,3.909c-.763,5.641,1.015,6.275-1.163,11.407h2.292c2.283-5.379.42-6.043,1.219-11.956"
                  transform="translate(-102.272 -86.405)"
                  fill="#414042"
                />
              </G>
            </G>
          </G>
          <Path
            d="M23.055,790.83H1.14A1.14,1.14,0,0,1,0,789.689v-1.422a1.14,1.14,0,0,1,1.14-1.14H23.055a1.14,1.14,0,0,1,1.14,1.14v1.422a1.14,1.14,0,0,1-1.14,1.14"
            transform="translate(0 -764.975)"
            fill="#f99026"
          />
        </G>
      </G>
      <G transform="translate(7.918 25.854)">
        <G clipPath="url(#clip-path-6)">
          <Rect
            width={8.358}
            height={4.179}
            transform="translate(0 0)"
            fill="url(#linear-gradient-3)"
          />
        </G>
      </G>
    </G>
  </Svg>
);

export default BellsIcon;

