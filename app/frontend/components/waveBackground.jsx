
import React from "react";
import { Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function WaveBackground() {
  return (
    <Svg width={width} height={250} style={{ position: "absolute", top: 0 }}>
      {/* Fond circulaire / dégradé */}
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#d0d6fc" />
          <Stop offset="100%" stopColor="#ece6fb" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={250} fill="url(#bgGrad)" />

      {/* Vague avec deux bosses resserrées */}
      <Path
        d={`
          M0,130
          C120,50 240,210 360,130
          C480,50 600,210 ${width},130
          L${width},250
          L0,250
          Z
        `}
        fill="#ffffff"
        opacity={0.6}  // légère transparence
      />
    </Svg>
  );
}