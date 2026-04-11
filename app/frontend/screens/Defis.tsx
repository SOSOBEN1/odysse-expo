// screens/DefiScreen.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import Navbar from "../components/Navbar";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "mes_defis" | "en_attente" | "termine";

interface Defi {
  id: number;
  title: string;
  subtitle: string;
  xp: number;
  duration: string;
  participants: number;
  icon: "book" | "sport" | "rocket";
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEFIS: Defi[] = [
  {
    id: 1,
    title: "Marathon d'étude 2 heures",
    subtitle: "Fin: 15 mars · Révise 2h avec tes amis",
    xp: 400,
    duration: "1h30/3h",
    participants: 3,
    icon: "book",
  },
  {
    id: 2,
    title: "Programme sportif week-end",
    subtitle: "Fin: 20avr · Fais 30 min de sport chaque week-end",
    xp: 400,
    duration: "5h/24h",
    participants: 3,
    icon: "sport",
  },
  {
    id: 3,
    title: "Préparer le projet odyssée",
    subtitle: "Fin: 16 mai · Travaille chaque jour pour compléter le projet",
    xp: 400,
    duration: "30jours/51jours",
    participants: 3,
    icon: "rocket",
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "mes_defis",  label: "Mes défis"  },
  { key: "en_attente", label: "en attente" },
  { key: "termine",    label: "terminé"    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconBook = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const IconSport = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#fff" strokeWidth={2} />
    <Path d="M12 3C8 7 8 17 12 21M12 3C16 7 16 17 12 21M3 12h18" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const IconRocket = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 7 6 7 13H17C17 6 12 2 12 2Z" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <Path d="M7 13L5 20H19L17 13" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={10} r={2} fill="#fff" />
  </Svg>
);

const ICONS = { book: IconBook, sport: IconSport, rocket: IconRocket };

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AvatarCircle = ({ color, offset }: { color: string; offset: number }) => (
  <View
    style={[
      styles.avatar,
      { backgroundColor: color, marginLeft: offset === 0 ? 0 : -10, zIndex: 10 - offset },
    ]}
  >
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

const AVATAR_COLORS = ["#E8A4C8", "#B39DDB", "#F48FB1"];

// ─── XP Badge ─────────────────────────────────────────────────────────────────
const XPBadge = ({ xp }: { xp: number }) => (
  <View style={styles.xpBadge}>
    <Text style={styles.xpText}>+ {xp} XP</Text>
  </View>
);

// ─── En cours pill ────────────────────────────────────────────────────────────
const EnCoursPill = () => (
  <View style={styles.enCoursPill}>
    <Text style={styles.enCoursText}>En cours</Text>
  </View>
);

// ─── Search bar ───────────────────────────────────────────────────────────────
const SearchBar = () => (
  <View style={styles.searchWrapper}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
      <Circle cx={11} cy={11} r={8} stroke={COLORS.textLight} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={COLORS.textLight} strokeWidth={2} strokeLinecap="round" />
    </Svg>
    <TextInput
      placeholder="Recherche"
      placeholderTextColor={COLORS.textLight}
      style={styles.searchInput}
    />
  </View>
);

// ─── Defi Card ────────────────────────────────────────────────────────────────
const DefiCard = ({ defi, index }: { defi: Defi; index: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const IconComp = ICONS[defi.icon];

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 120,
      useNativeDriver: true,
      tension: 58,
      friction: 9,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale:      anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.cardTagRow}>
        <EnCoursPill />
      </View>

      <View style={styles.cardInner}>
        <View style={styles.cardIconWrapper}>
          <View style={styles.cardIconCircle}>
            <IconComp />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{defi.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{defi.subtitle}</Text>
          <View style={styles.avatarRow}>
            {Array.from({ length: defi.participants }).map((_, i) => (
              <AvatarCircle key={i} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} offset={i} />
            ))}
          </View>
        </View>

        <View style={styles.cardRight}>
          <XPBadge xp={defi.xp} />
          <Text style={styles.cardDuration}>{defi.duration}</Text>
        </View>
      </View>

      <View style={styles.cardProgressTrack}>
        <View style={[styles.cardProgressFill, { width: `${35 + index * 12}%` }]} />
      </View>
    </Animated.View>
  );
};

// ─── Sparkles ─────────────────────────────────────────────────────────────────
const Sparkles = () => (
  <Svg width={width} height={80} style={styles.sparklesSvg} pointerEvents="none">
    {[
      { x: 18,       y: 18, r: 2.5 },
      { x: width-22, y: 12, r: 2   },
      { x: width-40, y: 38, r: 1.5 },
      { x: 35,       y: 55, r: 1.8 },
      { x: width/2,  y: 8,  r: 2   },
    ].map((s, i) => (
      <React.Fragment key={i}>
        <Circle cx={s.x} cy={s.y} r={s.r}   fill="#fff" opacity={0.7} />
        <Circle cx={s.x} cy={s.y} r={s.r*2} fill="#fff" opacity={0.15} />
      </React.Fragment>
    ))}
  </Svg>
);

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) => (
  <View style={styles.tabBar}>
    {TABS.map((t) => {
      const isActive = t.key === active;
      return (
        <TouchableOpacity
          key={t.key}
          style={[styles.tabItem, isActive && styles.tabItemActive]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── DefiScreen ───────────────────────────────────────────────────────────────
export default function DefiScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("mes_defis");

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 55, friction: 9,
    }).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Top icons ── */}
      <Animated.View
        style={[
          styles.topIcons,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange:[0,1], outputRange:[-16,0] }) }],
          },
        ]}
      >
        <TouchableOpacity style={styles.topIconBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
              stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            />
            <Circle cx={18} cy={6} r={4} fill="#FF5252" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topIconBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke={COLORS.primary} strokeWidth={2} />
            <Path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>

      <Sparkles />

      {/* ── Search bar ── */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange:[0,1], outputRange:[-10,0] }) }],
          },
        ]}
      >
        <SearchBar />
      </Animated.View>

      {/* ── Tab bar ── */}
      <TabBar active={activeTab} onSelect={setActiveTab} />

      {/* ── Scroll content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Tes défis actuels</Text>
        <Text style={styles.sectionSubtitle}>
          Accomplis tes défis avec tes amis pour gagner des récompenses !
        </Text>

        {DEFIS.map((d, i) => (
          <DefiCard key={d.id} defi={d} index={i} />
        ))}

        {/* ✅ Bouton placé directement après les cartes dans le scroll */}
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/frontend/screens/AmisDefis")}
        >
          <Text style={styles.ctaBtnText}>Lancer un défi</Text>
        </TouchableOpacity>

        {/* Spacer pour la navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Navbar ── */}
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

  topIcons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding,
    gap: 8,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },

  sparklesSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  searchContainer: {
    paddingHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusFull,
    padding: 4,
    ...SHADOWS.light,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: SIZES.radiusFull,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.purple,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: "700",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 18,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    marginBottom: 14,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  cardTagRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 10,
  },
  cardIconWrapper: {
    marginTop: 2,
  },
  cardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.purple,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 15,
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.card,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  avatarHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginBottom: 1,
  },
  avatarBody: {
    width: 20,
    height: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 2,
  },
  xpBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  enCoursPill: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  enCoursText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardProgressTrack: {
    height: 5,
    backgroundColor: COLORS.progressBg,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 3,
    overflow: "hidden",
  },
  cardProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  // ✅ Bouton sans position absolute
  ctaBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    ...SHADOWS.purple,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
