import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import Logo from "../assets/images/logo.svg";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";

const { width, height } = Dimensions.get("screen");

const C = {
  primary:   COLORS.primary,
  secondary: COLORS.secondary,
  light:     "#C4B5E8",
  bg:        "#EDE8F8",
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
const WaveBottom = ({ y2, y3, y4 }: { y2: any; y3: any; y4: any }) => (
  <>
    {/* Vague claire */}
    <Svg width={width} height={210} style={[styles.absolute, { bottom: 0 }]} pointerEvents="none">
      <Path
        d={`M0,210 L${width},210 L${width},65
            Q${width * 0.72},5 ${width * 0.5},50
            Q${width * 0.28},88 0,48 Z`}
        fill={C.secondary}
        opacity={0.55}
      />
    </Svg>

    {/* Icône manette */}
    <Animated.View
      style={{ position: "absolute", bottom: 130, left: width * 0.13 - 24, transform: [{ translateY: y2 }] }}
      pointerEvents="none"
    >
      <Svg width={48} height={50}>
        <G>
          <Path d="M6,10 Q6,2 16,2 L32,2 Q42,2 42,10 L42,26 Q42,34 32,34 L16,34 Q6,34 6,26 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
          <Path d="M14,18 H20 M17,15 V21" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.75}/>
          <Circle cx={32} cy={15} r={3} fill="#fff" opacity={0.6}/>
          <Circle cx={36} cy={20} r={3} fill="#fff" opacity={0.6}/>
          <Path d="M10,32 Q8,42 13,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
          <Path d="M38,32 Q40,42 35,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
        </G>
      </Svg>
    </Animated.View>

    {/* Icône médaille */}
    <Animated.View
      style={{ position: "absolute", bottom: 118, left: width * 0.5 - 22, transform: [{ translateY: y4 }] }}
      pointerEvents="none"
    >
      <Svg width={44} height={50}>
        <G>
          <Path d="M22,0 L42,12 L42,36 L22,48 L2,36 L2,12 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
          <Path d="M22,14 L25,21 L32,21 L27,26 L29,33 L22,29 L15,33 L17,26 L12,21 L19,21 Z" fill="#fff" opacity={0.55}/>
        </G>
      </Svg>
    </Animated.View>

    {/* Icône cloche */}
    <Animated.View
      style={{ position: "absolute", bottom: 122, right: width * 0.15 - 20, transform: [{ translateY: y3 }] }}
      pointerEvents="none"
    >
      <Svg width={40} height={50}>
        <G>
          <Circle cx={20} cy={3} r={3.5} fill="none" stroke="#fff" strokeWidth={2} opacity={0.75}/>
          <Path d="M6,36 L34,36 L32,16 Q30,4 20,6 Q10,4 8,16 Z" fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}/>
          <Path d="M13,36 Q13,44 20,44 Q27,44 27,36" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.75}/>
        </G>
      </Svg>
    </Animated.View>

    {/* Vague foncée */}
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

// ─── Decorations ──────────────────────────────────────────────────────────────
const Decorations = ({ y1, y2, y3, y4, y5 }: { y1: any; y2: any; y3: any; y4: any; y5: any }) => (
  <>
    {/* Croix haut gauche */}
    <Animated.View style={{ position: "absolute", left: 38, top: 196, transform: [{ translateY: y1 }] }}>
      <Svg width={16} height={16}>
        <Path d="M0 8 H16 M8 0 V16" stroke={C.secondary} strokeWidth={2.5} strokeLinecap="round"/>
      </Svg>
    </Animated.View>

    {/* Cercle haut droit */}
    <Animated.View style={{ position: "absolute", right: 46, top: 228, transform: [{ translateY: y2 }] }}>
      <Svg width={16} height={16}>
        <Circle cx={8} cy={8} r={6} stroke={C.secondary} strokeWidth={2} fill="none"/>
      </Svg>
    </Animated.View>

    {/* Point haut droit */}
    <Animated.View style={{ position: "absolute", right: 42, top: 314, transform: [{ translateY: y3 }] }}>
      <View style={{ width: 8, height: 8, backgroundColor: C.light, borderRadius: 4 }}/>
    </Animated.View>

    {/* Blob milieu gauche */}
    <Animated.View style={{ position: "absolute", left: 5, top: "53.5%", transform: [{ translateY: y4 }] }}>
      <View style={{ width: 30, height: 30, backgroundColor: C.light, borderRadius: 15, opacity: 0.6 }}/>
    </Animated.View>

    {/* Croix bas gauche */}
    <Animated.View style={{ position: "absolute", left: 34, bottom: 210, transform: [{ translateY: y5 }] }}>
      <Svg width={14} height={14}>
        <Path d="M0 7 H14 M7 0 V14" stroke={C.secondary} strokeWidth={2} strokeLinecap="round"/>
      </Svg>
    </Animated.View>

    {/* Deux points bas gauche */}
    <Animated.View style={{ position: "absolute", left: 57, bottom: 200, flexDirection: "row", gap: 10, transform: [{ translateY: y1 }] }}>
      <View style={{ width: 7, height: 7, backgroundColor: C.light, borderRadius: 3.5 }}/>
      <View style={{ width: 7, height: 7, backgroundColor: C.light, borderRadius: 3.5 }}/>
    </Animated.View>

    {/* Étincelle gauche */}
    <Animated.View style={{ position: "absolute", left: 52, bottom: 290, transform: [{ translateY: y3 }] }}>
      <Svg width={14} height={14} fill="none">
        <Path d="M52 556 L57 544 L62 556" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </Animated.View>

    {/* Étincelle droite */}
    <Animated.View style={{ position: "absolute", right: 52, bottom: 280, transform: [{ translateY: y2 }] }}>
      <Svg width={14} height={14} fill="none">
        <Path d="M0 10 L5 0 L10 10" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </Animated.View>
  </>
);

// ─── Arrow Icon ───────────────────────────────────────────────────────────────
const ArrowIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path
      d="M4 11H18M18 11L12 5M18 11L12 17"
      stroke={C.primary}
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── CTA Button ───────────────────────────────────────────────────────────────
const CTAButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[styles.ctaButton, { transform: [{ scale }] }]}>
        <Text style={styles.ctaText}>COMMENCER</Text>
        <View style={styles.ctaArrowWrapper}>
          <ArrowIcon />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── StartScreen ──────────────────────────────────────────────────────────────
const StartScreen = () => {
  const router = useRouter();

  // Animations d'entrée
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const btnAnim  = useRef(new Animated.Value(0)).current;

  // Animations flottantes pour décos et icônes
  const deco1 = useRef(new Animated.Value(0)).current;
  const deco2 = useRef(new Animated.Value(0)).current;
  const deco3 = useRef(new Animated.Value(0)).current;
  const deco4 = useRef(new Animated.Value(0)).current;
  const deco5 = useRef(new Animated.Value(0)).current;

  const floating = (anim: Animated.Value, duration: number, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1, duration, delay,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(anim, {
          toValue: 0, duration,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  };

  useEffect(() => {
    // Animations d'entrée
    Animated.stagger(150, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
      Animated.spring(textAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
      Animated.spring(btnAnim,  { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }),
    ]).start();

    // Animations flottantes
    floating(deco1, 2200, 0);
    floating(deco2, 2800, 400);
    floating(deco3, 1900, 200);
    floating(deco4, 2500, 600);
    floating(deco5, 2100, 300);
  }, []);

  const y1 = deco1.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const y2 = deco2.interpolate({ inputRange: [0, 1], outputRange: [0, -7]  });
  const y3 = deco3.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const y4 = deco4.interpolate({ inputRange: [0, 1], outputRange: [0, -8]  });
  const y5 = deco5.interpolate({ inputRange: [0, 1], outputRange: [0, -6]  });

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

      {/* Fond */}
      <View style={styles.bg} />

      {/* Vague haut */}
      <WaveTop />

      {/* Décorations flottantes */}
      <Decorations y1={y1} y2={y2} y3={y3} y4={y4} y5={y5} />

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

      {/* Vague bas avec icônes flottantes */}
      <WaveBottom y2={y2} y3={y3} y4={y4} />
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
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingLeft: 38,
    paddingRight: 10,
    minWidth: 220,
    shadowColor: "#ffffff",
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    marginRight: 16,
  },
  ctaArrowWrapper: {
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 9,
    ...SHADOWS.light,
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