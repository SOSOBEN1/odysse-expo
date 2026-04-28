import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Path, Ellipse, G, Rect, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../assets/images/logo.svg";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";

const { width, height } = Dimensions.get("screen");

const C = {
  primary:   COLORS.primary,    // "#6949a8"
  secondary: COLORS.secondary,  // "#9574e0"
  light:     "#C4B5E8",
  bg:        "#EDE8F8",
};

// ─── Floating Star (animated) ─────────────────────────────────────────────────
type StarProps = {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  delay: number;
  amplitude?: number; // vertical float distance
  spin?: boolean;     // rotate animation
};

const FloatingStar = ({ x, y, size, color, opacity, delay, amplitude = 8, spin = false }: StarProps) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(opacity)).current;

  useEffect(() => {
    // Float up/down loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200 + delay * 300,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200 + delay * 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Opacity pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: opacity * 0.4,
          duration: 1500 + delay * 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: opacity,
          duration: 1500 + delay * 200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Spin loop (optional)
    if (spin) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000 + delay * 500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -amplitude],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // 4-point star path centered at (size/2, size/2)
  const s = size / 2;
  const inner = s * 0.4;
  const starPath = [
    `M${s},0`,
    `L${s + inner * 0.4},${s - inner}`,
    `L${s * 2},${s}`,
    `L${s + inner * 0.4},${s + inner}`,
    `L${s},${s * 2}`,
    `L${s - inner * 0.4},${s + inner}`,
    `L0,${s}`,
    `L${s - inner * 0.4},${s - inner}`,
    "Z",
  ].join(" ");

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: opacityAnim,
        transform: [{ translateY }, ...(spin ? [{ rotate }] : [])],
      }}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path d={starPath} fill={color} />
      </Svg>
    </Animated.View>
  );
};

// ─── Wave Top ─────────────────────────────────────────────────────────────────
const WaveTop = () => (
  <>
    <Svg width={width} height={145} style={[styles.absolute]} pointerEvents="none">
      <Path
        d={`M0,0 L${width},0 L${width},58
            Q${width * 0.76},112 ${width * 0.5},74
            Q${width * 0.26},38 0,82 Z`}
        fill={C.secondary}
        opacity={0.55}
      />
    </Svg>
    <Svg width={width} height={115} style={[styles.absolute, { top: 0 }]} pointerEvents="none">
      <Path
        d={`M0,0 L${width},0 L${width},50
            Q${width * 0.75},94 ${width * 0.5},64
            Q${width * 0.25},38 0,70 Z`}
        fill={C.primary}
      />
    </Svg>
  </>
);

// ─── Wave Bottom ──────────────────────────────────────────────────────────────
const WaveBottom = () => (
  <>
    <Svg width={width} height={210} style={[styles.absolute, { bottom: 0 }]} pointerEvents="none">
      <Path
        d={`M0,210 L${width},210 L${width},65
            Q${width * 0.72},5 ${width * 0.5},50
            Q${width * 0.28},88 0,48 Z`}
        fill={C.secondary}
        opacity={0.55}
      />
      {/* ICÔNE 1 — Manette de jeu (gauche) */}
      <G transform={`translate(${width * 0.13 - 24}, 100)`}>
        <Path d="M6,10 Q6,2 16,2 L32,2 Q42,2 42,10 L42,26 Q42,34 32,34 L16,34 Q6,34 6,26 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
        <Path d="M14,18 H20 M17,15 V21" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.75}/>
        <Circle cx={32} cy={15} r={3} fill="#fff" opacity={0.6}/>
        <Circle cx={36} cy={20} r={3} fill="#fff" opacity={0.6}/>
        <Path d="M10,32 Q8,42 13,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
        <Path d="M38,32 Q40,42 35,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
        <Rect x={19} y={14} width={10} height={5} rx={2.5} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.6}/>
      </G>
      {/* ICÔNE 2 — Hexagone / médaille (centre) */}
      <G transform={`translate(${width * 0.5 - 22}, 82)`}>
        <Path d="M22,0 L42,12 L42,36 L22,48 L2,36 L2,12 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
        <Path d="M22,14 L25,21 L32,21 L27,26 L29,33 L22,29 L15,33 L17,26 L12,21 L19,21 Z" fill="#fff" opacity={0.55}/>
      </G>
      {/* ICÔNE 3 — Cloche (droite) */}
      <G transform={`translate(${width * 0.85 - 20}, 88)`}>
        <Circle cx={20} cy={3} r={3.5} fill="none" stroke="#fff" strokeWidth={2} opacity={0.75}/>
        <Path d="M6,36 L34,36 L32,16 Q30,4 20,6 Q10,4 8,16 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
        <Path d="M13,36 Q13,44 20,44 Q27,44 27,36" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.75}/>
      </G>
    </Svg>
    <Svg width={width} height={150} style={[styles.absolute, { bottom: 0 }]} pointerEvents="none">
      <Path
        d={`M0,150 L${width},150 L${width},50
            Q${width * 0.75},0 ${width * 0.5},36
            Q${width * 0.25},66 0,30 Z`}
        fill={C.primary}
      />
    </Svg>
  </>
);

// ─── Decorations (points, +, blobs, étincelles) ───────────────────────────────
const Decorations = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {/* Haut gauche : croix + */}
    <Path d="M38 196 H52 M45 189 V203" stroke={C.secondary} strokeWidth={2.5} strokeLinecap="round"/>
    {/* Haut droit : petit cercle vide */}
    <Circle cx={width - 46} cy={228} r={7} stroke={C.secondary} strokeWidth={2} fill="none"/>
    {/* Haut droit : tout petit point plein */}
    <Circle cx={width - 42} cy={314} r={4} fill={C.light}/>
    {/* Milieu gauche : blob ellipse */}
    <Ellipse cx={20} cy={height * 0.535} rx={15} ry={15} fill={C.light} opacity={0.6}/>
    {/* Bas gauche : croix + */}
    <Path d="M34 676 H48 M41 669 V683" stroke={C.secondary} strokeWidth={2} strokeLinecap="round"/>
    {/* Bas gauche : deux points */}
    <Circle cx={57} cy={682} r={3.5} fill={C.light}/>
    <Circle cx={68} cy={682} r={3.5} fill={C.light}/>

  </Svg>
);

// ─── Floating Stars Layer ─────────────────────────────────────────────────────
const FloatingStars = () => (
  <>
    {/* Grande étoile — haut droit, tourne lentement */}
    <FloatingStar x={width * 0.78} y={height * 0.18} size={18} color={C.secondary} opacity={0.85} delay={0} amplitude={10} spin />

    {/* Étoile moyenne — haut gauche */}
    <FloatingStar x={width * 0.08} y={height * 0.22} size={13} color={C.light} opacity={0.9} delay={1} amplitude={7} />

    {/* Petite étoile — milieu droit */}
    <FloatingStar x={width * 0.85} y={height * 0.42} size={10} color={C.secondary} opacity={0.7} delay={2} amplitude={6} />

    {/* Étoile — sous le logo gauche */}
    <FloatingStar x={width * 0.06} y={height * 0.48} size={14} color={C.light} opacity={0.8} delay={0.5} amplitude={9} spin />

    {/* Petite étoile — sous tagline droite */}
    <FloatingStar x={width * 0.82} y={height * 0.52} size={9} color={C.primary} opacity={0.6} delay={1.5} amplitude={5} />

    {/* Étoile — au-dessus bouton gauche */}
    <FloatingStar x={width * 0.1} y={height * 0.62} size={12} color={C.secondary} opacity={0.75} delay={2.5} amplitude={8} />

    {/* Étoile — au-dessus bouton droite */}
    <FloatingStar x={width * 0.78} y={height * 0.63} size={11} color={C.light} opacity={0.8} delay={0.8} amplitude={7} spin />

    {/* Très petite — milieu gauche */}
    <FloatingStar x={width * 0.04} y={height * 0.35} size={7} color={C.primary} opacity={0.5} delay={3} amplitude={4} />

    {/* Très petite — bas centre-droit */}
    <FloatingStar x={width * 0.65} y={height * 0.57} size={8} color={C.secondary} opacity={0.55} delay={1.8} amplitude={5} />
  </>
);

// ─── CTA Button ───────────────────────────────────────────────────────────────
const CTAButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
      {/* Étincelles gauche \/ */}
      <Svg
        width={28} height={40}
        style={{ position: "absolute", left: -22, top: "50%", marginTop: -20 }}
        pointerEvents="none"
      >
        <Path d="M18,4 L10,18" stroke={C.secondary} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}/>
        <Path d="M10,22 L18,36" stroke={C.secondary} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}/>
      </Svg>
      {/* Étincelles droite \/ */}
      <Svg
        width={28} height={40}
        style={{ position: "absolute", right: -22, top: "50%", marginTop: -20 }}
        pointerEvents="none"
      >
        <Path d="M10,4 L18,18" stroke={C.secondary} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}/>
        <Path d="M18,22 L10,36" stroke={C.secondary} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}/>
      </Svg>

      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        style={styles.ctaOuter}
      >
        <LinearGradient
          colors={["#6949a8", "#9574e0", "#baaae7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>COMMENCER</Text>
          <View style={styles.ctaArrowWrapper}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="#9574e0"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── StartScreen ──────────────────────────────────────────────────────────────
const StartScreen = () => {
  const router = useRouter();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const btnAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
      Animated.spring(textAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
      Animated.spring(btnAnim,  { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
    ]).start();
  }, []);

  const slidePop = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale:      anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 1 — Fond */}
      <View style={styles.bg} />

      {/* 2 — Vague haut */}
      <WaveTop />

      {/* 3 — Décorations statiques */}
      <Decorations />

      {/* 4 — Étoiles flottantes animées ✨ */}
      <FloatingStars />

      {/* 5 — Contenu principal */}

      {/* Logo + Nom */}
      <Animated.View style={[styles.logoContainer, slidePop(logoAnim)]}>
        <Logo width={150} height={150} />
        <Text style={styles.appName}>dyssé</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, slidePop(textAnim)]}>
        <Text style={styles.taglineBold}>Organise,{"  "}</Text>
        <Text style={styles.taglineAccent}>progresse</Text>
        {"  &  "}
        <Text style={styles.taglineAccent}>amuse-toi</Text>
        {" !"}
      </Animated.Text>

      {/* CTA */}
      <Animated.View style={[slidePop(btnAnim), { marginTop: 44 }]}>
        <CTAButton onPress={() => router.push("/frontend/screens/Login")} />
      </Animated.View>

      {/* Sub-link */}
      <Animated.View style={{ opacity: btnAnim }}>
        <TouchableOpacity style={styles.subLinkWrapper} activeOpacity={0.7}>
          <Text style={styles.subLink}>Pret a explorer Odyssee ?</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 6 — Vague bas */}
      <WaveBottom />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,
    alignItems: "center",
    backgroundColor: C.bg,
    overflow: "hidden",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
  },
  absolute: {
    position: "absolute",
    left: 0,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: height * 0.24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  appName: {
    fontFamily: "Georgia",
    fontSize: 40,
    fontWeight: "700",
    color: "#3d2b7a",
    letterSpacing: 1.5,
    marginTop: -28,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D1F5E",
    marginTop: 26,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SIZES.padding,
  },
  taglineBold: {
    fontWeight: "700",
    color: "#2D1F5E",
  },
  taglineAccent: {
    color: C.primary,
    fontWeight: "700",
  },
  ctaOuter: {
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: "#6949a8",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 100,
    paddingVertical: 10,
    paddingLeft: 30,
    paddingRight: 10,
    width: 230,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
  ctaArrowWrapper: {
    backgroundColor: "#fff",
    borderRadius: 100,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  subLinkWrapper: {
    marginTop: 24,
  },
  subLink: {
    color: "#4A3580",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

export default StartScreen;
