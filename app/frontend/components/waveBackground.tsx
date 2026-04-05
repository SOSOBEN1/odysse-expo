
import { Dimensions } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function WaveBackground({ height = 250 }: { height?: number }) {
  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0 }}>
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#d0d6fc" />
          <Stop offset="100%" stopColor="#ece6fb" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#bgGrad)" />
      <Path
        d={`
          M0,${height - 90}
          C120,${height - 170} 240,${height + 10} 360,${height - 90}
          C480,${height - 170} 600,${height + 10} ${width},${height - 90}
          L${width},${height}
          L0,${height}
          Z
        `}
        fill="#ffffff"
        opacity={0.6}
      />
    </Svg>
  );
}