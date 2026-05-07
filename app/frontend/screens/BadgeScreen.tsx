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

// ── Filtres par module ───────────────────────────────────────
type ModuleFilter = "tous" | "bien-etre" | "apprentissage" | "organisation" | "global";

const MODULES: { key: ModuleFilter; label: string; emoji: string }[] = [
  { key: "tous",           label: "Tous",      emoji: "🏅" },
  { key: "bien-etre",      label: "Bien-être", emoji: "🌿" },
  { key: "apprentissage",  label: "Apprendre", emoji: "📚" },
  { key: "organisation",   label: "Organiser", emoji: "📅" },
  { key: "global",         label: "Global",    emoji: "⭐" },
];

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

// ── Mapping badge id → couleur, emoji, module ────────────────
const BADGE_META: Record<number, { emoji: string; color: string; bg: string; module: ModuleFilter }> = {
  1:  { emoji: "👣", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "global"        },
  2:  { emoji: "🔥", color: COLORS.badgeOrange, bg: COLORS.badgeOrangeBg, module: "global"        },
  3:  { emoji: "👁️", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg,   module: "global"        },
  4:  { emoji: "🎯", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "global"        },
  5:  { emoji: "📅", color: COLORS.badgeGreen,  bg: COLORS.badgeGreenBg,  module: "organisation"  },
  6:  { emoji: "⚡", color: COLORS.badgePurple, bg: COLORS.badgePurpleBg, module: "global"        },
  7:  { emoji: "⭐", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "global"        },
  8:  { emoji: "❤️", color: COLORS.badgePink,   bg: COLORS.badgePinkBg,   module: "bien-etre"     },
  9:  { emoji: "🎓", color: COLORS.badgeIndigo, bg: COLORS.badgeIndigoBg, module: "global"        },
  10: { emoji: "🏃", color: COLORS.badgeSky,    bg: COLORS.badgeSkyBg,    module: "global"        },
  11: { emoji: "🏆", color: COLORS.badgeAmber,  bg: COLORS.badgeAmberBg,  module: "global"        },
  12: { emoji: "🌸", color: COLORS.badgeRose,   bg: COLORS.badgeRoseBg,   module: "bien-etre"     },
  // Bien-être
  13: { emoji: "🌬️", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg,   module: "bien-etre"     },
  14: { emoji: "🧘", color: COLORS.badgePurple, bg: COLORS.badgePurpleBg, module: "bien-etre"     },
  15: { emoji: "💚", color: COLORS.badgeGreen,  bg: COLORS.badgeGreenBg,  module: "bien-etre"     },
  16: { emoji: "😴", color: COLORS.badgeIndigo, bg: COLORS.badgeIndigoBg, module: "bien-etre"     },
  17: { emoji: "🏋️", color: COLORS.badgeOrange, bg: COLORS.badgeOrangeBg, module: "bien-etre"     },
  18: { emoji: "🥗", color: COLORS.badgeGreen,  bg: COLORS.badgeGreenBg,  module: "bien-etre"     },
  19: { emoji: "🌿", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg,   module: "bien-etre"     },
  // Apprentissage
  20: { emoji: "📖", color: COLORS.badgeSky,    bg: COLORS.badgeSkyBg,    module: "apprentissage" },
  21: { emoji: "🧠", color: COLORS.badgePurple, bg: COLORS.badgePurpleBg, module: "apprentissage" },
  22: { emoji: "💡", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "apprentissage" },
  23: { emoji: "🗺️", color: COLORS.badgeAmber,  bg: COLORS.badgeAmberBg,  module: "apprentissage" },
  24: { emoji: "📚", color: COLORS.badgeIndigo, bg: COLORS.badgeIndigoBg, module: "apprentissage" },
  // Organisation
  25: { emoji: "🗓️", color: COLORS.badgeGreen,  bg: COLORS.badgeGreenBg,  module: "organisation"  },
  26: { emoji: "🍅", color: COLORS.badgeOrange, bg: COLORS.badgeOrangeBg, module: "organisation"  },
  27: { emoji: "♟️", color: COLORS.badgePink,   bg: COLORS.badgePinkBg,   module: "organisation"  },
  28: { emoji: "🚀", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg,   module: "organisation"  },
  29: { emoji: "📐", color: COLORS.badgeSky,    bg: COLORS.badgeSkyBg,    module: "organisation"  },
  // Global / Niveau
  30: { emoji: "🌟", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "global"        },
  31: { emoji: "💪", color: COLORS.badgeOrange, bg: COLORS.badgeOrangeBg, module: "global"        },
  32: { emoji: "🛡️", color: COLORS.badgeSky,    bg: COLORS.badgeSkyBg,    module: "global"        },
  33: { emoji: "👑", color: COLORS.badgeAmber,  bg: COLORS.badgeAmberBg,  module: "global"        },
  34: { emoji: "🦁", color: COLORS.badgeGold,   bg: COLORS.badgeGoldBg,   module: "global"        },
  // Global / XP
  35: { emoji: "🔍", color: COLORS.badgeCyan,   bg: COLORS.badgeCyanBg,   module: "global"        },
  36: { emoji: "⚔️", color: COLORS.badgePurple, bg: COLORS.badgePurpleBg, module: "global"        },
  37: { emoji: "💎", color: COLORS.badgeIndigo, bg: COLORS.badgeIndigoBg, module: "global"        },
};

const DEFAULT_META = {
  emoji: "🏅",
  color: COLORS.badgeDefault,
  bg:    COLORS.badgeDefaultBg,
  module: "global" as ModuleFilter,
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

  const [activeModule, setActiveModule] = useState<ModuleFilter>("tous");
  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<{
    id: number; label: string; emoji: string;
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

  // Filtrer par module
  const filteredUnlocked = activeModule === "tous"
    ? unlocked
    : unlocked.filter((b) => getBadgeMeta(b.id).module === activeModule);

  const filteredLocked = activeModule === "tous"
    ? locked
    : locked.filter((b) => getBadgeMeta(b.id).module === activeModule);

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

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

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

        {/* ── Filtres par module ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {MODULES.map((m) => {
            const isActive = activeModule === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveModule(m.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterEmoji}>{m.emoji}</Text>
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Badges débloqués ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>Badges débloqués</Text>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginLeft: 6 }} />
          </View>
          <Text style={styles.sectionCount}>{filteredUnlocked.length}</Text>
        </View>

        <View style={styles.badgesGrid}>
          {filteredUnlocked.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              {activeModule === "tous"
                ? "Aucun badge débloqué pour l'instant."
                : `Aucun badge "${MODULES.find(m => m.key === activeModule)?.label}" débloqué.`}
            </Text>
          )}
          {filteredUnlocked.map((b) => {
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
          <Text style={styles.sectionCount}>{filteredLocked.length}</Text>
        </View>

        <View style={styles.badgesGrid}>
          {filteredLocked.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              {activeModule === "tous"
                ? "Tous les badges sont débloqués ! 🎉"
                : `Tous les badges "${MODULES.find(m => m.key === activeModule)?.label}" sont débloqués ! 🎉`}
            </Text>
          )}
          {filteredLocked.map((b) => {
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
  container:         { flex: 1 },
  stars:             { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  header:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
  title:             { fontSize: 22, fontWeight: "900", color: COLORS.badgeHeading, letterSpacing: 0.5 },
  helpBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.badgeHelpBtnBg, justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  helpText:          { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  loaderContainer:   { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 20 },
  errorContainer:    { marginHorizontal: 20, marginTop: 8, padding: 10, backgroundColor: COLORS.badgeErrorBg, borderRadius: 10 },
  errorText:         { color: COLORS.badgeErrorText, fontSize: 12, textAlign: "center" },
  scroll:            { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  card:              { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  trophyEmoji:       { fontSize: 44, marginBottom: 6 },
  xpLabel:           { fontSize: 13, color: COLORS.badgeMuted, fontWeight: "600", marginBottom: 10 },
  xpTrack:           { width: "100%", height: 8, backgroundColor: COLORS.badgeXpTrack, borderRadius: 8, overflow: "hidden" },
  xpFill:            { height: "100%", borderRadius: 8 },
  filterScroll:      { marginBottom: 16 },
  filterContent:     { paddingRight: 8, gap: 8, flexDirection: "row" },
  filterChip:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.badgeCardBg, borderWidth: 1.5, borderColor: "transparent", gap: 4 },
  filterChipActive:  { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary },
  filterEmoji:       { fontSize: 14 },
  filterLabel:       { fontSize: 12, fontWeight: "600", color: COLORS.badgeMuted },
  filterLabelActive: { color: COLORS.primary, fontWeight: "800" },
  sectionHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLeft:       { flexDirection: "row", alignItems: "center" },
  sectionTitle:      { fontSize: 15, fontWeight: "800", color: COLORS.badgeHeading },
  sectionCount:      { fontSize: 13, fontWeight: "700", color: COLORS.badgeMuted },
  badgesGrid:        { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  emptyText:         { fontSize: 12, color: COLORS.badgeMuted, fontStyle: "italic", textAlign: "center", width: "100%", paddingVertical: 10 },
});
