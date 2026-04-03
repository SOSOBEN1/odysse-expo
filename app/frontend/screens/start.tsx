import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Ellipse,
} from "react-native-svg";
import Logo from "../assets/images/logo.svg";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";


const { width, height } = Dimensions.get("window");






// ─── Wave Top ─────────────────────────────────────────────────────────────────
const WaveTop = () => (
  <>
    <Svg width={width} height={90} style={[styles.waveTop, { top: 0 }]}>
      <Path
        d={`M0,0 L${width},0 L${width},50 Q${width * 0.75},90 ${width * 0.5},65 Q${width * 0.25},40 0,70 Z`}
        fill="#7C5CBF"
      />
    </Svg>


    <Svg width={width} height={90} style={[styles.waveTop, { top: 30, opacity: 0.5 }]}>
      <Path
        d={`M0,0 L${width},0 L${width},50 Q${width * 0.75},90 ${width * 0.5},65 Q${width * 0.25},40 0,70 Z`}
        fill="#9B7DD4"
      />
    </Svg>
  </>
);


// ─── Wave Bottom ──────────────────────────────────────────────────────────────
const WaveBottom = () => (
  <>
    <Svg width={width} height={100} style={[styles.waveBottom, { bottom: 0 }]}>
      <Path
        d={`M0,100 L${width},100 L${width},40 Q${width * 0.75},0 ${width * 0.5},30 Q${width * 0.25},60 0,25 Z`}
        fill="#7C5CBF"
      />
    </Svg>


    <Svg width={width} height={100} style={[styles.waveBottom, { bottom: -20, opacity: 0.5 }]}>
      <Path
        d={`M0,100 L${width},100 L${width},40 Q${width * 0.75},0 ${width * 0.5},30 Q${width * 0.25},60 0,25 Z`}
        fill="#9B7DD4"
      />
    </Svg>
  </>
);


// ─── Arrow Icon (bouton) ───────────────────────────────────────────────────────
const ArrowIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path
      d="M4 11H18M18 11L12 5M18 11L12 17"
       stroke="#7C5CBF"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


// ─── Decorative dots / shapes ─────────────────────────────────────────────────
const Decorations = () => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {/* Top-left plus */}
    <Path d="M38 195 H46 M42 191 V199" stroke="#9B7DD4" strokeWidth={2.2} strokeLinecap="round" />
    {/* Small dot near logo */}
    <Circle cx={width - 55} cy={230} r={5} stroke="#9B7DD4" strokeWidth={2} fill="none" />
    <Circle cx={width - 52} cy={310} r={3} fill="#C4B5E8" />
    {/* Bottom-left plus group */}
    <Path d="M35 680 H43 M39 676 V684" stroke="#9B7DD4" strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={55} cy={685} r={2.5} fill="#C4B5E8" />
    <Circle cx={63} cy={685} r={2.5} fill="#C4B5E8" />
    {/* Left blob */}
    <Ellipse cx={22} cy={480} rx={14} ry={14} fill="#C4B5E8" opacity={0.6} />
    {/* Bottom-right spark left of button */}
    <Path d="M52 560 L55 553 L58 560" stroke="#7C5CBF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Bottom-right spark right of button */}
    <Path d={`M${width - 58} 570 L${width - 55} 563 L${width - 52} 570`} stroke="#7C5CBF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);


// ─── CTA Button ───────────────────────────────────────────────────────────────
interface CTAButtonProps {
  onPress: () => void;
}


const CTAButton = ({ onPress }: CTAButtonProps) => (
  <TouchableOpacity
    style={styles.ctaButton}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={styles.ctaText}>COMMENCER</Text>
    <View style={styles.ctaArrowWrapper}>
      <ArrowIcon />
    </View>
  </TouchableOpacity>
);


// ─── StartScreen ──────────────────────────────────────────────────────────────
interface StartScreenProps {
  onStart?: () => void;
}


const StartScreen = ({ onStart }: StartScreenProps) => {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />


      {/* Background gradient (simulated with view) */}
      <View style={styles.background} />


      {/* Top wave */}
      <WaveTop />


      {/* Decorative floating shapes */}
      <Decorations />


      {/* Logo */}
      <View style={styles.logoContainer}>
 <Logo width={140} height={140} />
  <Text style={styles.appName}>dyssé</Text>
</View>


      {/* Tagline */}
      <Text style={styles.tagline}>
        Organise,{" "}
        <Text style={styles.taglineAccent}>progresse</Text>
        {" "}& <Text style={styles.taglineAccent}>amuse-toi</Text> !
      </Text>


      {/* CTA */}
      <CTAButton onPress={() => router.push("/frontend/screens/Login")} />


      {/* Sub-link */}
      <TouchableOpacity style={styles.subLinkWrapper} activeOpacity={0.7}>
        <Text style={styles.subLink}>Pret a explorer Odyssee ?</Text>
      </TouchableOpacity>


      {/* Bottom wave */}
      <WaveBottom />
    </View>
  );
};


// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
  flex: 1,
  alignItems: "center",
  backgroundColor: "#EDE8F8",
  overflow: "hidden",
  paddingBottom: 0,
},


  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EDE8F8",
  },
  waveTop: {
    position: "absolute",
    top: 0,
    left: 0,
  },
 waveBottom: {
  position: "absolute",
  bottom: 0,
  left: 0,
 
},
  logoContainer: {
    alignItems: "center",
     marginTop: height * 0.20, // un peu remonté
  },
  appName: {
    fontFamily: "Georgia", // remplacer par une police custom si dispo
    fontSize: 36,
    fontWeight: "700",
    color: "#4D417C",
    letterSpacing: 1,
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D1F5E",
    marginTop: 24,
    textAlign: "center",
  },
  taglineAccent: {
    color: "#7C5CBF",
  },
 ctaButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#7C5CBF",
  borderRadius: 50,
  paddingVertical: 16,
  paddingLeft: 36,
  paddingRight: 12,
  marginTop: 40,
  minWidth: 210,


  // 💡 effet glow blanc
  shadowColor: "#FFFFFF",
  shadowOpacity: 0.8,
  shadowRadius: 15,
  shadowOffset: { width: 0, height: 0 },


  elevation: 10,
},
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginRight: 14,
  },
  ctaArrowWrapper: {
  backgroundColor: "#FFFFFF",
  borderRadius: 50,
  padding: 8,
},
  subLinkWrapper: {
    marginTop: 22,
  },
  subLink: {
    color: "#4A3580",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "none",
  },
});


export default StartScreen;



