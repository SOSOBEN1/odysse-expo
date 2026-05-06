import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeDropShadow,
  Filter,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import BackButton from "../components/BackButton";
import BadgeUnlockedModal from "../components/BadgeUnlockedModel";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS } from "../styles/theme";
import { useBadgesViewModel } from "../../../backend/viewmodels/useBadgesViewModel";

// ── Interfaces ───────────────────────────────────────────────
interface UnlockedBadgeProps {
  id: number;
  emoji: string;
  label: string;
  date: string;
  bg: string;
  color: string;
  onPress: () => void;
}

interface LockedBadgeProps {
  id: number;
  emoji: string;
  label: string;
  condition: string;
}

interface StarItem {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
}

// ── Étoiles décoratives ──────────────────────────────────────
const stars: StarItem[] = [
  { top: 10,    left: 10,   size: 20, opacity: 0.6  },
  { top: 10,    right: 10,  size: 12, opacity: 0.4  },
  { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
  { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
  { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
  { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
  { top: 40,    right: 50,  size: 22, opacity: 0.7  },
];

// ── Mapping badge id → couleur & emoji ───────────────────────
const BADGE_META: Record<number, { emoji: string; color: string; bg: string }> = {
  1:  { emoji: "👣", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg   },
  2:  { emoji: "🔥", color: COLORS.badgeOrange, bg: COLORS.badgeOrangeBg },
  3:  { emoji: "👁️", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg   },
  4:  { emoji: "🎯", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg   },
  5:  { emoji: "📅", color: COLORS.badgeGreen,  bg: COLORS.badgeGreenBg  },
  6:  { emoji: "⚡", color: COLORS.badgePurple, bg: COLORS.badgePurpleBg },
  7:  { emoji: "⭐", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg   },
  8:  { emoji: "❤️", color: COLORS.badgePink,   bg: COLORS.badgePinkBg   },
  9:  { emoji: "🎓", color: COLORS.badgeIndigo, bg: COLORS.badgeIndigoBg },
  10: { emoji: "🏃", color: COLORS.badgeSky,    bg: COLORS.badgeSkyBg    },
  11: { emoji: "🏆", color: COLORS.badgeAmber,  bg: COLORS.badgeAmberBg  },
  12: { emoji: "🌸", color: COLORS.badgeRose,   bg: COLORS.badgeRoseBg   },
};

const DEFAULT_META = {
  emoji: "🏅",
  color: COLORS.badgeDefault,
  bg:    COLORS.badgeDefaultBg,
};

function getBadgeMeta(id: number) {
  return BADGE_META[id] ?? DEFAULT_META;
}

// ── Helper : assombrir une couleur hex ───────────────────────
function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace("#", "");
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ── Badge 3D SVG — débloqué ──────────────────────────────────
function Badge3DUnlocked({ emoji, color, uid }: { emoji: string; color: string; uid: string }) {
  const dark     = darkenHex(color, 0.65);
  const gradId   = `grad_${uid}`;
  const shadowId = `sh_${uid}`;
  const filterId = `f_${uid}`;

  return (
    <Svg width={72} height={76} viewBox="0 0 72 76">
      <Defs>
        <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <FeDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.4" />
        </Filter>
      </Defs>
      <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />
      <Circle cx="36" cy="40" r="30" fill={dark} filter={`url(#${filterId})`} />
      <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} />
      <Circle cx="36" cy="36" r="23" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.45" />
      <Ellipse cx="26" cy="23" rx="10" ry="5" fill="white" opacity="0.28" rotation="-30" originX="26" originY="23" />
      <SvgText x="36" y="47" textAnchor="middle" fontSize="26">{emoji}</SvgText>
    </Svg>
  );
}

// ── Badge 3D SVG — verrouillé ────────────────────────────────
function Badge3DLocked({ emoji, uid }: { emoji: string; uid: string }) {
  const gradId   = `gradL_${uid}`;
  const shadowId = `shL_${uid}`;
  const filterId = `fL_${uid}`;

  return (
    <Svg width={72} height={76} viewBox="0 0 72 76">
      <Defs>
        <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
          <Stop offset="0%" stopColor={COLORS.iconBg} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={COLORS.badgeLockedBase} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={COLORS.badgeLockedBase} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={COLORS.badgeLockedBase} stopOpacity="0" />
        </RadialGradient>
        <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <FeDropShadow dx="0" dy="3" stdDeviation="3" floodColor={COLORS.badgeLockedBase} floodOpacity="0.18" />
        </Filter>
      </Defs>
      <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />
      <Circle cx="36" cy="40" r="30" fill={COLORS.badgeLockedDark} filter={`url(#${filterId})`} />
      <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} opacity={0.7} />
      <Circle cx="36" cy="36" r="23" fill="none" stroke={COLORS.badgeLockedRing} strokeWidth="1.5" opacity="0.5" />
      <Ellipse cx="26" cy="23" rx="10" ry="5" fill="white" opacity="0.12" rotation="-30" originX="26" originY="23" />
      <SvgText x="36" y="47" textAnchor="middle" fontSize="23" opacity="0.45">{emoji}</SvgText>
      <Circle cx="57" cy="57" r="11" fill={COLORS.badgeLockedPin} stroke="white" strokeWidth="1.5" />
      <SvgText x="57" y="61" textAnchor="middle" fontSize="11">🔒</SvgText>
    </Svg>
  );
}

// ── Carte badge débloqué ─────────────────────────────────────
function UnlockedBadge({ id, emoji, label, date, bg, color, onPress }: UnlockedBadgeProps) {
  return (
    <TouchableOpacity
      style={[unlockedStyles.card, { backgroundColor: bg }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={unlockedStyles.label} numberOfLines={1}>{label}</Text>
      <Badge3DUnlocked emoji={emoji} color={color} uid={`u${id}`} />
      <Text style={unlockedStyles.obtained}>Obtenu le</Text>
      <Text style={unlockedStyles.date}>
        {new Date(date).toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        })}
      </Text>
    </TouchableOpacity>
  );
}

const unlockedStyles = StyleSheet.create({
  card:     { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10 },
  label:    { fontSize: 11, fontWeight: "800", color: COLORS.badgeHeading, marginBottom: 4, textAlign: "center" },
  obtained: { fontSize: 9, color: COLORS.badgeMuted, fontWeight: "500", marginTop: 4 },
  date:     { fontSize: 9, color: COLORS.badgeSubHeading, fontWeight: "700", textAlign: "center" },
});

// ── Carte badge verrouillé ───────────────────────────────────
function LockedBadge({ id, emoji, label, condition }: LockedBadgeProps) {
  return (
    <View style={lockedStyles.card}>
      <Text style={lockedStyles.label} numberOfLines={1}>{label}</Text>
      <Badge3DLocked emoji={emoji} uid={`l${id}`} />
      <Text style={lockedStyles.condition}>{condition}</Text>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  card:      { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10, backgroundColor: COLORS.badgeCardBg },
  label:     { fontSize: 11, fontWeight: "800", color: COLORS.badgeHeading, marginBottom: 4, textAlign: "center" },
  condition: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 13, marginTop: 4, color: COLORS.badgeCondition },
});

// ── Écran principal ──────────────────────────────────────────
export default function BadgesScreen() {

  // ⚠️ Remplace par ton vrai userId depuis le contexte auth
  const USER_ID = 1;

  const {
    unlocked,
    locked,
    total,
    newlyUnlocked,
    loading,
    error,
    loadBadges,
    clearNewlyUnlocked,
  } = useBadgesViewModel(USER_ID);

  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<{
    id: number;
    label: string;
    emoji: string;
  }>({ id: 0, label: "", emoji: "" });

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      const first = newlyUnlocked[0];
      const meta  = getBadgeMeta(first.id);
      setSelectedBadge({ id: first.id, label: first.label, emoji: meta.emoji });
      setModalVisible(true);
    }
  }, [newlyUnlocked]);

  const openModal = (id: number, label: string, emoji: string) => {
    setSelectedBadge({ id, label, emoji });
    setModalVisible(true);
  };

  const xpPct: DimensionValue =
    total > 0 ? `${Math.round((unlocked.length / total) * 100)}%` : "0%";

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.badgeGradStart]}
      style={styles.container}
    >
      <WaveBackground />

      {/* Étoiles décoratives */}
      <View style={styles.stars} pointerEvents="none">
        {stars.map((s, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={s.size}
            color="#fff"
            style={{
              position: "absolute",
              ...(s.top    !== undefined ? { top: s.top }       : {}),
              ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
              ...(s.left   !== undefined ? { left: s.left }     : {}),
              ...(s.right  !== undefined ? { right: s.right }   : {}),
              opacity: s.opacity,
            }}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Mes Badges</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={loadBadges}>
          <Text style={styles.helpText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Loader */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Carte progression */}
        <View style={styles.card}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.xpLabel}>
            {unlocked.length}/{total} badges débloqués
          </Text>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={[COLORS.badgeXpGradStart, COLORS.badgeXpGradEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: xpPct }]}
            />
          </View>
        </View>

        {/* ── Badges débloqués ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>Badges débloqués</Text>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginLeft: 6 }} />
          </View>
        </View>

        <View style={styles.badgesGrid}>
          {unlocked.length === 0 && !loading && (
            <Text style={styles.emptyText}>Aucun badge débloqué pour l'instant.</Text>
          )}
          {unlocked.map((b) => {
            const meta = getBadgeMeta(b.id);
            return (
              <UnlockedBadge
                key={b.id}
                id={b.id}
                label={b.label}
                emoji={meta.emoji}
                color={meta.color}
                bg={meta.bg}
                date={b.dateObtention ?? new Date().toISOString()}
                onPress={() => openModal(b.id, b.label, meta.emoji)}
              />
            );
          })}
        </View>

        {/* ── Badges verrouillés ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Ionicons name="lock-closed" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Badges à débloquer</Text>
          </View>
        </View>

        <View style={styles.badgesGrid}>
          {locked.length === 0 && !loading && (
            <Text style={styles.emptyText}>Tous les badges sont débloqués ! 🎉</Text>
          )}
          {locked.map((b) => {
            const meta = getBadgeMeta(b.id);
            return (
              <LockedBadge
                key={b.id}
                id={b.id}
                label={b.label}
                emoji={meta.emoji}
                condition={b.condition ?? "Condition non définie"}
              />
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navbar active="badges" onChange={() => {}} />

      <BadgeUnlockedModal
        visible={modalVisible}
        badgeId={selectedBadge.id}
        badgeName={selectedBadge.label}
        badgeEmoji={selectedBadge.emoji}
        onClose={() => {
          setModalVisible(false);
          clearNewlyUnlocked();
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  stars:           { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
  title:           { fontSize: 22, fontWeight: "900", color: COLORS.badgeHeading, letterSpacing: 0.5 },
  helpBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.badgeHelpBtnBg, justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  helpText:        { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  loaderContainer: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 20 },
  errorContainer:  { marginHorizontal: 20, marginTop: 8, padding: 10, backgroundColor: COLORS.badgeErrorBg, borderRadius: 10 },
  errorText:       { color: COLORS.badgeErrorText, fontSize: 12, textAlign: "center" },
  scroll:          { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  card:            { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  trophyEmoji:     { fontSize: 44, marginBottom: 6 },
  xpLabel:         { fontSize: 13, color: COLORS.badgeMuted, fontWeight: "600", marginBottom: 10 },
  xpTrack:         { width: "100%", height: 8, backgroundColor: COLORS.badgeXpTrack, borderRadius: 8, overflow: "hidden" },
  xpFill:          { height: "100%", borderRadius: 8 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLeft:     { flexDirection: "row", alignItems: "center" },
  sectionTitle:    { fontSize: 15, fontWeight: "800", color: COLORS.badgeHeading },
  badgesGrid:      { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  emptyText:       { fontSize: 12, color: COLORS.badgeMuted, fontStyle: "italic", textAlign: "center", width: "100%", paddingVertical: 10 },
});