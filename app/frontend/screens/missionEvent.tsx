// screens/MissionMapScreen.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop } from "react-native-svg";
import { useRouter, useLocalSearchParams } from "expo-router";
import HibouGuide from "../components/ui/Hibou";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";

const { width, height } = Dimensions.get("window");



// ─── Types ────────────────────────────────────────────────────────────────────
type StepState = "done" | "active" | "locked";

interface MissionStep {
  id: number;
  label: string;
  state: StepState;
  side: "left" | "right";
  /** vertical offset from top of the map content (px) */
  top: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PROJECT_TITLE   = "Projet Mobile";
const DAYS_LEFT       = 5;
const PROGRESS        = 0.2; // 20 %

const STEPS: MissionStep[] = [
  { id: 1, label: "Définir algorithme",        state: "done",   side: "left",  top: 60  },
  { id: 2, label: "Réaliser design UI",        state: "active", side: "right", top: 180 },
  { id: 3, label: "Implémenter fonctionnalités", state: "locked", side: "right", top: 290 },
  { id: 4, label: "Réaliser design UI",        state: "active", side: "left",  top: 400 },
  { id: 5, label: "Tester / organiser",        state: "locked", side: "right", top: 510 },
  { id: 6, label: "Finaliser projet",          state: "locked", side: "right", top: 620 },
];

const MAP_HEIGHT = 760; // total height of the scrollable map zone

// ─── Sparkle dots (decorative) ────────────────────────────────────────────────
const SPARKLES = [
  { x: 30,        y: 140 },
  { x: width - 28,y: 220 },
  { x: 18,        y: 350 },
  { x: width - 22,y: 400 },
  { x: 50,        y: 480 },
  { x: width - 40,y: 560 },
  { x: 70,        y: 670 },
];

// ─── SVG path that snakes between steps ───────────────────────────────────────
const TrailPath = () => {
  const cx = width / 2;
  const d = `
    M ${cx * 0.45} 90
    C ${cx * 0.1} 150,  ${cx * 1.6} 200,  ${cx * 1.55} 260
    S ${cx * 0.2} 340,  ${cx * 0.45} 400
    S ${cx * 1.6} 470,  ${cx * 1.5} 530
    S ${cx * 0.9} 600,  ${cx} 650
  `;
  return (
    <Svg
      width={width}
      height={MAP_HEIGHT}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {/* Shadow trail */}
      <Path d={d} stroke="#C4B5E8" strokeWidth={20} strokeLinecap="round" fill="none" opacity={0.45} />
      {/* Main trail */}
      <Path d={d} stroke="#D8CEFF" strokeWidth={14} strokeLinecap="round" fill="none"
        strokeDasharray="1 18" strokeDashoffset={0}
      />
      {/* Sparkle dots along path */}
      {SPARKLES.map((s, i) => (
        <React.Fragment key={i}>
          <Circle cx={s.x} cy={s.y} r={3.5} fill="#fff" opacity={0.7} />
          <Circle cx={s.x} cy={s.y} r={6}   fill="#fff" opacity={0.15} />
        </React.Fragment>
      ))}
    </Svg>
  );
};

// ─── Step Node ────────────────────────────────────────────────────────────────
interface StepNodeProps {
  step: MissionStep;
  delay: number;
}

const StepNode = ({ step, delay }: StepNodeProps) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, useNativeDriver: true, tension: 60, friction: 8,
    }).start();

    if (step.state === "active") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const isLeft   = step.side === "left";
  const isDone   = step.state === "done";
  const isActive = step.state === "active";
  const isLocked = step.state === "locked";

  // ── Locked: padlock ──────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <Animated.View
        style={[
          styles.stepRow,
          isLeft ? styles.stepLeft : styles.stepRight,
          { top: step.top, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.7,1] }) }] },
        ]}
      >
        {/* Padlock icon */}
        <View style={styles.lockNode}>
          <Svg width={42} height={50} viewBox="0 0 42 50">
            <Ellipse cx={21} cy={18} rx={10} ry={10} stroke={COLORS.primaryLight} strokeWidth={5} fill="none" />
            <Path
              d="M8 24 Q8 44 21 44 Q34 44 34 24 Z"
              fill={COLORS.primaryLight}
            />
            <Circle cx={21} cy={34} r={4} fill="#fff" opacity={0.8} />
            <Path d="M21 34 V39" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={[styles.stepLabel, { color: COLORS.textLight, marginLeft: isLeft ? 8 : 0, marginRight: isLeft ? 0 : 8 }]}>
          {step.label}
        </Text>
      </Animated.View>
    );
  }

  // ── Done / Active: avatar placeholder ────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.stepRow,
        isLeft ? styles.stepLeft : styles.stepRight,
        { top: step.top, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[0.7,1] }) }] },
      ]}
    >
      <Animated.View
        style={[
          styles.avatarWrapper,
          isActive && { transform: [{ scale: pulse }] },
        ]}
      >
        {/* Avatar circle */}
        <View style={[styles.avatarCircle, isDone && styles.avatarDone, isActive && styles.avatarActive]}>
          {/* Inner glow */}
          <View style={styles.avatarInner} />
          {/* Checkmark if done */}
          {isDone && (
            <Svg width={22} height={22} viewBox="0 0 22 22" style={styles.checkmark}>
              <Circle cx={11} cy={11} r={10} fill={COLORS.success} />
              <Path d="M6 11 L9.5 14.5 L16 8" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          )}
        </View>
        {/* Coin above active node */}
        {isActive && (
          <View style={styles.coinBadge}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={11} fill={COLORS.goldDark} />
              <Circle cx={12} cy={12} r={8}  fill={COLORS.gold} />
              <Circle cx={12} cy={12} r={5}  fill={COLORS.coinYellow} opacity={0.6} />
            </Svg>
          </View>
        )}
      </Animated.View>

      <Text style={[
        styles.stepLabel,
        isDone   && styles.stepLabelDone,
        isActive && styles.stepLabelActive,
        { marginLeft: isLeft ? 0 : 8, marginRight: isLeft ? 8 : 0 },
      ]}>
        {step.label}
      </Text>
    </Animated.View>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ progress }: { progress: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 900, useNativeDriver: false }).start();
  }, []);
  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: barWidth }]} />
    </View>
  );
};

// ─── Header background wave ───────────────────────────────────────────────────
const HeaderWave = () => (
  <Svg width={width} height={80} style={styles.headerWave} pointerEvents="none">
    <Path
      d={`M0,0 L${width},0 L${width},52 Q${width*0.75},80 ${width*0.5},60 Q${width*0.25},40 0,65 Z`}
      fill={COLORS.primary}
      opacity={0.12}
    />
  </Svg>
);

// ─── Speech Bubble (au-dessus de l'hibou) ────────────────────────────────────
const SpeechBubble = ({ message }: { message: string }) => (
  <View style={styles.bubbleWrapper}>
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{message}</Text>
    </View>
    {/* Flèche pointant vers le bas (vers la tête de l'hibou) */}
    <View style={styles.bubbleArrow} />
  </View>
);

// ─── MissionMapScreen ─────────────────────────────────────────────────────────
export default function MissionMapScreen() {
  const { eventId, eventTitle } = useLocalSearchParams();
  const router  = useRouter();
  const [hibouMsg] = useState("Tu dois d'abord\ntrouver\nl'algorithme.");

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── HEADER ── */}
      <Animated.View style={[
        styles.header,
        { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange:[0,1], outputRange:[-20,0] }) }] }
      ]}>
        {/* Back arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 19L8 12L15 5" stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.headerCenter}>
          <Text style={styles.projectTitle}>{PROJECT_TITLE}</Text>
          <ProgressBar progress={PROGRESS} />
          <Text style={styles.daysLeft}>{DAYS_LEFT} jours restants</Text>
        </View>

        {/* Right icons */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={3} stroke={COLORS.primary} strokeWidth={2} />
              <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <HeaderWave />
      </Animated.View>

      {/* ── MAP ── */}
      <ScrollView
        style={styles.mapScroll}
        contentContainerStyle={{ height: MAP_HEIGHT + 120, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: MAP_HEIGHT, width }}>
          {/* Background sparkles */}
          <Svg width={width} height={MAP_HEIGHT} style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {[...Array(18)].map((_, i) => {
              const sx = 20 + Math.abs(Math.sin(i * 47.3) * (width - 40));
              const sy = 30 + Math.abs(Math.sin(i * 31.7) * (MAP_HEIGHT - 60));
              const sr = 1.5 + Math.abs(Math.sin(i * 13)) * 2;
              return (
                <Circle key={i} cx={sx} cy={sy} r={sr} fill="#fff" opacity={0.5 + Math.sin(i)*0.3} />
              );
            })}
          </Svg>

          {/* Treasure chest (start) */}
          <View style={styles.chestWrapper}>
            <View style={styles.chest}>
              <Svg width={52} height={46} viewBox="0 0 52 46">
                {/* Lid */}
                <Path d="M4 4 Q26 0 48 4 L48 20 Q26 16 4 20 Z" fill={COLORS.goldDark} />
                <Path d="M4 4 Q26 0 48 4 L48 10 Q26 6 4 10 Z" fill={COLORS.gold} opacity={0.7} />
                {/* Body */}
                <Path d="M4 20 L4 44 Q26 48 48 44 L48 20 Q26 24 4 20 Z" fill={COLORS.goldDark} />
                <Path d="M4 20 L4 30 Q26 34 48 30 L48 20 Q26 24 4 20 Z" fill={COLORS.gold} opacity={0.5} />
                {/* Lock */}
                <Circle cx={26} cy={32} r={5} fill="#fff" opacity={0.8} />
                <Circle cx={26} cy={32} r={3} fill={COLORS.goldDark} />
              </Svg>
            </View>
          </View>

          {/* Snaking trail */}
          <TrailPath />

          {/* Steps */}
          {STEPS.map((step, i) => (
            <StepNode key={step.id} step={step} delay={i * 120} />
          ))}

          {/* Hibou + bulle AU-DESSUS (bottom-left) */}
          <View style={styles.hibouArea}>
            {/* Bulle de dialogue positionnée au-dessus de l'hibou */}
            <SpeechBubble message={hibouMsg} />
            {/* HibouGuide sans message, on gère la bulle nous-mêmes */}
            <HibouGuide
              emotion="confused"
              message=""
              size={110}
            />
          </View>

          {/* "troll" vertical label */}
          <View style={styles.trollLabel}>
            <Text style={styles.trollText}>t r o l l</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── BOTTOM CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path d="M11 4V18M4 11H18" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
          <Text style={styles.ctaBtnText}>Créer mission</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: Platform.OS === "android" ? 42 : 56,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 14,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
    overflow: "hidden",
    ...SHADOWS.medium,
    zIndex: 10,
  },
  headerWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  projectTitle: {
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.progressBg,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  daysLeft: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 5,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Map ──
  mapScroll: {
    flex: 1,
  },
  chestWrapper: {
    position: "absolute",
    top: 10,
    left: 18,
    zIndex: 5,
  },
  chest: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 6,
    ...SHADOWS.light,
  },

  // ── Steps ──
  stepRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 4,
  },
  stepLeft: {
    left: 14,
    flexDirection: "row",
  },
  stepRight: {
    right: 14,
    flexDirection: "row-reverse",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#D8CEFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "visible",
    ...SHADOWS.purple,
  },
  avatarDone: {
    backgroundColor: "#C8F0CB",
    borderColor: COLORS.success,
  },
  avatarActive: {
    backgroundColor: "#EDE0FF",
    borderColor: COLORS.secondary,
  },
  avatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  checkmark: {
    position: "absolute",
  },
  coinBadge: {
    position: "absolute",
    top: -14,
    right: -4,
  },
  lockNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lockedBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    ...SHADOWS.light,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    maxWidth: 110,
    textAlign: "center",
    flexShrink: 1,
  },
  stepLabelDone: {
    color: COLORS.success,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  // ── Hibou ──
  hibouArea: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 170,
    zIndex: 6,
    alignItems: "flex-start",  // bulle alignée à gauche comme l'hibou
  },

  // ── Speech Bubble ──
  bubbleWrapper: {
    alignItems: "center",
    marginLeft: 10,             // léger décalage pour pointer vers la tête
    marginBottom: 0,
  },
  bubble: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 150,
    ...SHADOWS.light,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 18,
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -1,
    // Petite ombre pour la flèche
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },

  // ── Troll label ──
  trollLabel: {
    position: "absolute",
    right: -22,
    top: 440,
    transform: [{ rotate: "90deg" }],
    zIndex: 3,
  },
  trollText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 3,
    opacity: 0.55,
  },

  // ── CTA ──
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    paddingTop: 14,
    paddingHorizontal: SIZES.padding,
    backgroundColor: "rgba(237,232,248,0.96)",
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: SIZES.radiusFull,
    gap: 10,
    ...SHADOWS.purple,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});