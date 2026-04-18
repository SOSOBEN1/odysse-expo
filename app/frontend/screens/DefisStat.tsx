// screens/DefisStat.tsx
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
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  id: number;
  key: string;
  label: string;
  description: string;
  color: string;
  iconType: "energy" | "stress" | "knowledge" | "organisation";
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatCard[] = [
  {
    id: 1,
    key: "energie",
    label: "Énergie",
    description: "Augmente ton énergie et ta motivation au quotidien",
    color: "#FFF3C4",
    iconType: "energy",
  },
  {
    id: 2,
    key: "stress",
    label: "Stress",
    description: "Diminue ton stress et retrouve apaisement et sérénité",
    color: "#FFD6D6",
    iconType: "stress",
  },
  {
    id: 3,
    key: "connaissance",
    label: "Connaissance",
    description: "Acquiers de nouvelles compétences et connaissances",
    color: "#D6F0FF",
    iconType: "knowledge",
  },
  {
    id: 4,
    key: "organisation",
    label: "Organisation",
    description: "Améliore ta planification et la gestion du quotidien",
    color: "#D6FFE4",
    iconType: "organisation",
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const StatIcon = ({ type, size = 20 }: { type: StatCard["iconType"]; size?: number }) => {
  switch (type) {
    case "energy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
            fill="#F5A623"
            stroke="#F5A623"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "stress":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#E57373"
          />
          <Path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#fff" />
        </Svg>
      );
    case "knowledge":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L2 7l10 5 10-5-10-5z"
            fill="#5B8DEF"
            stroke="#5B8DEF"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#5B8DEF"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "organisation":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#4CAF50" strokeWidth={1.8} fill="none" />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke="#4CAF50" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 14h4M8 18h8" stroke="#4CAF50" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
};

// ─── Checkmark badge ──────────────────────────────────────────────────────────
const CheckBadge = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <View style={styles.checkBadge}>
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <Path
          d="M3 7L6 10L11 4"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ─── Background sparkles ──────────────────────────────────────────────────────
const BgSparkles = () => (
  <Svg
    width={width}
    height={height}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Path d="M28 90 H40 M34 84 V96" stroke="#c4aaff" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <Path d={`M${width - 36} 140 H${width - 24} M${width - 30} 134 V146`} stroke="#c4aaff" strokeWidth={2} strokeLinecap="round" opacity={0.4} />
    <Circle cx={width - 20} cy={190} r={3} fill="#d4bbff" opacity={0.5} />
    <Circle cx={20} cy={280} r={2.5} fill="#d4bbff" opacity={0.4} />
    <Circle cx={width - 30} cy={370} r={2} fill="#d4bbff" opacity={0.45} />
    <Circle cx={45} cy={440} r={3} fill="#d4bbff" opacity={0.35} />
    <Circle cx={width - 15} cy={510} r={2} fill="#d4bbff" opacity={0.4} />
    <Path
      d={`M${width - 55} 110 L${width - 52} 102 L${width - 49} 110 L${width - 57} 106 L${width - 47} 106 Z`}
      fill="#d4bbff" opacity={0.4}
    />
    <Path d="M55 360 L58 352 L61 360 L53 356 L63 356 Z" fill="#d4bbff" opacity={0.35} />
  </Svg>
);

// ─── Header icons ─────────────────────────────────────────────────────────────
const HeaderIcons = () => (
  <View style={styles.headerIcons}>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
          stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
        <Circle cx={18} cy={6} r={4} fill="#FF5252" />
      </Svg>
    </TouchableOpacity>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3} stroke={COLORS.primary} strokeWidth={2} />
        <Path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round"
        />
      </Svg>
    </TouchableOpacity>
  </View>
);

// ─── Stat Card Item ───────────────────────────────────────────────────────────
interface StatCardProps {
  stat: StatCard;
  selected: boolean;
  onToggle: () => void;
  delay: number;
}

const StatCardItem = ({ stat, selected, onToggle, delay }: StatCardProps) => {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: stat.color }, selected && styles.cardSelected]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Top row: icon + label + check */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconRow}>
            <StatIcon type={stat.iconType} size={20} />
            <Text style={styles.cardLabel}>{stat.label}</Text>
          </View>
          <CheckBadge visible={selected} />
        </View>

        {/* Description */}
        <Text style={styles.cardDescription}>{stat.description}</Text>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.chooseBtn, selected && styles.chooseBtnSelected]}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={[styles.chooseBtnText, selected && styles.chooseBtnTextSelected]}>
            {selected ? "Sélectionné ✓" : "Choisir >"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── DefisStat Screen ─────────────────────────────────────────────────────────
export default function DefisStatScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 55,
      friction: 9,
    }).start();
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canContinue = selected.length > 0;

  const rows: [StatCard, StatCard | null][] = [];
  for (let i = 0; i < STATS.length; i += 2) {
    rows.push([STATS[i], STATS[i + 1] ?? null]);
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <BgSparkles />

      {/* Top bar */}
      <View style={styles.topBar}>
        <BackButton onPress={() => router.push("/frontend/screens/AmisDefis")} />
        <HeaderIcons />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [
              { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            ],
          }}
        >
          <Text style={styles.pageTitle}>
            Choisie les statistiques{"\n"}que tu veux améliorer{"\n"}pour créer ton défi :
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((stat, colIdx) =>
                stat ? (
                  <StatCardItem
                    key={stat.id}
                    stat={stat}
                    selected={selected.includes(stat.id)}
                    onToggle={() => toggle(stat.id)}
                    delay={(rowIdx * 2 + colIdx) * 80}
                  />
                ) : (
                  <View key="empty" style={styles.cardWrapper} />
                )
              )}
            </View>
          ))}
        </View>

        {/* padding bottom pour que le contenu ne soit pas caché derrière le CTA */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── CTA dans le flux normal, entre ScrollView et Navbar ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
          activeOpacity={canContinue ? 0.85 : 1}
          disabled={!canContinue}
        >
          <Text style={styles.ctaBtnText}>Poursuivre</Text>
        </TouchableOpacity>
      </View>

      <Navbar active="defis" onChange={() => {}} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },

  // ── Header icons ──
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 22,
    paddingBottom: 16,
  },

  // ── Title ──
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 30,
    marginBottom: 24,
    fontFamily: "Georgia",
  },

  // ── Grid ──
  grid: { gap: 12 },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },

  // ── Card ──
  cardWrapper: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: SIZES.radius,
    padding: 14,
    minHeight: 155,
    justifyContent: "space-between",
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
  },
  cardDescription: {
    fontSize: 12,
    color: "#444",
    lineHeight: 16,
    flex: 1,
    marginBottom: 10,
  },

  // ── Choose button ──
  chooseBtn: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...SHADOWS.light,
  },
  chooseBtnSelected: {
    backgroundColor: COLORS.primary,
  },
  chooseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  chooseBtnTextSelected: {
    color: COLORS.white,
  },

  // ── Check badge ──
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── CTA — flux normal, plus de position absolute ──
  ctaBar: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  ctaBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 16,
    alignItems: "center",
    ...SHADOWS.purple,
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
