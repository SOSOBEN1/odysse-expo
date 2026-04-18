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
import Svg, { Circle, Path, Ellipse, G, Rect } from "react-native-svg";
import Logo from "../assets/images/logo.svg";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";

// FIX 1 : "screen" au lieu de "window" pour couvrir toute la hauteur physique
const { width, height } = Dimensions.get("screen");

const C = {
  primary:   COLORS.primary,    // "#6949a8"
  secondary: COLORS.secondary,  // "#9574e0"
  light:     "#C4B5E8",
  bg:        "#EDE8F8",
};

// ─── Wave Top ─────────────────────────────────────────────────────────────────
const WaveTop = () => (
  <>
    {/* Couche arrière – claire */}
    <Svg
      width={width} height={145}
      style={[styles.absolute]}
      pointerEvents="none"
    >
      <Path
        d={`M0,0 L${width},0 L${width},58
            Q${width * 0.76},112 ${width * 0.5},74
            Q${width * 0.26},38 0,82 Z`}
        fill={C.secondary}
        opacity={0.55}
      />
    </Svg>
    {/* Couche avant – foncée */}
    <Svg
      width={width} height={115}
      style={[styles.absolute, { top: 0 }]}
      pointerEvents="none"
    >
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
// FIX 2 : icônes intégrées dans la vague CLAIRE (couche arrière)
// FIX 3 : bottom: 0 sur les deux couches pour couvrir tout le bas
const WaveBottom = () => (
  <>
    {/* ── Couche claire (derrière) — contient les icônes ── */}
    <Svg
      width={width}
      height={210}
      style={[styles.absolute, { bottom: 0 }]}
      pointerEvents="none"
    >
      {/* Vague claire */}
      <Path
        d={`M0,210 L${width},210 L${width},65
            Q${width * 0.72},5 ${width * 0.5},50
            Q${width * 0.28},88 0,48 Z`}
        fill={C.secondary}
        opacity={0.55}
      />

      {/* ══ ICÔNE 1 — Manette de jeu (gauche) ══ */}
      <G transform={`translate(${width * 0.13 - 24}, 100)`}>
        {/* Corps */}
        <Path
          d="M6,10 Q6,2 16,2 L32,2 Q42,2 42,10 L42,26 Q42,34 32,34 L16,34 Q6,34 6,26 Z"
          fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}
        />
        {/* Croix directionnelle */}
        <Path d="M14,18 H20 M17,15 V21" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.75}/>
        {/* Boutons ABXY */}
        <Circle cx={32} cy={15} r={3} fill="#fff" opacity={0.6}/>
        <Circle cx={36} cy={20} r={3} fill="#fff" opacity={0.6}/>
        {/* Poignées gauche */}
        <Path d="M10,32 Q8,42 13,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
        {/* Poignées droite */}
        <Path d="M38,32 Q40,42 35,46" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75}/>
        {/* Bouton start */}
        <Rect x={19} y={14} width={10} height={5} rx={2.5} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.6}/>
      </G>

      {/* ══ ICÔNE 2 — Hexagone / médaille (centre) ══ */}
      <G transform={`translate(${width * 0.5 - 22}, 82)`}>
        {/* Hexagone */}
        <Path
          d="M22,0 L42,12 L42,36 L22,48 L2,36 L2,12 Z"
          fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}
        />
        {/* Étoile intérieure */}
        <Path
          d="M22,14 L25,21 L32,21 L27,26 L29,33 L22,29 L15,33 L17,26 L12,21 L19,21 Z"
          fill="#fff" opacity={0.55}
        />
      </G>

      {/* ══ ICÔNE 3 — Cloche de notification (droite) ══ */}
      <G transform={`translate(${width * 0.85 - 20}, 88)`}>
        {/* Anneau supérieur */}
        <Circle cx={20} cy={3} r={3.5} fill="none" stroke="#fff" strokeWidth={2} opacity={0.75}/>
        {/* Corps de la cloche */}
        <Path
          d="M6,36 L34,36 L32,16 Q30,4 20,6 Q10,4 8,16 Z"
          fill="none" stroke="#fff" strokeWidth={2.2} opacity={0.75}
        />
        {/* Battant */}
        <Path
          d="M13,36 Q13,44 20,44 Q27,44 27,36"
          fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.75}
        />
      </G>
    </Svg>

    {/* ── Couche foncée (devant) ── */}
    <Svg
      width={width}
      height={150}
      style={[styles.absolute, { bottom: 0 }]}
      pointerEvents="none"
    >
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
// FIX 4 : icônes fantômes retirées d'ici (elles sont maintenant dans WaveBottom)
const Decorations = () => (
  <Svg
    width={width} height={height}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {/* ── Haut gauche : croix + ── */}
    <Path
      d="M38 196 H52 M45 189 V203"
      stroke={C.secondary} strokeWidth={2.5} strokeLinecap="round"
    />

    {/* ── Haut droit : petit cercle vide ── */}
    <Circle cx={width - 46} cy={228} r={7} stroke={C.secondary} strokeWidth={2} fill="none" />

    {/* ── Haut droit : tout petit point plein ── */}
    <Circle cx={width - 42} cy={314} r={4} fill={C.light} />

    {/* ── Milieu gauche : blob ellipse ── */}
    <Ellipse cx={20} cy={height * 0.535} rx={15} ry={15} fill={C.light} opacity={0.6} />

    {/* ── Bas gauche : croix + ── */}
    <Path
      d="M34 676 H48 M41 669 V683"
      stroke={C.secondary} strokeWidth={2} strokeLinecap="round"
    />

    {/* ── Bas gauche : deux points ── */}
    <Circle cx={57} cy={682} r={3.5} fill={C.light} />
    <Circle cx={68} cy={682} r={3.5} fill={C.light} />

    {/* ── Étincelles autour du bouton CTA ── */}
    <Path
      d="M52 556 L57 544 L62 556"
      stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
    <Path
      d={`M${width - 62} 566 L${width - 57} 554 L${width - 52} 566`}
      stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
  </Svg>
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
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }
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

      {/* 2 — Vague haut (derrière le contenu) */}
      <WaveTop />

      {/* 3 — Décorations flottantes */}
      <Decorations />

      {/* 4 — Contenu principal */}

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

      {/* 5 — Vague bas (par-dessus le contenu) */}
      <WaveBottom />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,      // FIX : garantit la hauteur physique complète
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
