import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import BadgeUnlockedModal from "../components/BadgeUnlockedModel"; // ← importer le modal
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";

// ── Données ─────────────────────────────────────────────────
const TOTAL_BADGES = 40;
const UNLOCKED_COUNT = 8;

const UNLOCKED_BADGES = [
  { id: 1,  label: "Premiers Pas",     emoji: "👣",  color: "#f9c74f", date: "12 mars 2026",    bg: "#fff8e1" },
  { id: 2,  label: "Serie de 7 jours", emoji: "🔥",  color: "#f8961e", date: "05 janvier 2026", bg: "#fff3e0" },
  { id: 3,  label: "Vision master",    emoji: "👁️",  color: "#4cc9f0", date: "05 janvier 2026", bg: "#e0f7fa" },
  { id: 4,  label: "Missionnaire",     emoji: "🎯",  color: "#f9c74f", date: "12 mars 2026",    bg: "#fff8e1" },
  { id: 5,  label: "organisé(e)",      emoji: "📅",  color: "#90be6d", date: "05 janvier 2026", bg: "#f1f8e9" },
  { id: 6,  label: "Cencentration Pro",emoji: "⚡",  color: "#7c50f0", date: "15 janvier 2026", bg: "#ede7f6" },
];

const LOCKED_BADGES = [
  { id: 7,  label: "Discipline",    emoji: "⭐",  color: "#bdbdbd", condition: "Condition: 90%\nOrganisation",    condColor: "#555" },
  { id: 8,  label: "Stressed?Non!", emoji: "❤️",  color: "#e57373", condition: "Condition: <30%\nStress",          condColor: "#e53935" },
  { id: 9,  label: "Expert",        emoji: "🎓",  color: "#bdbdbd", condition: "Condition:\nNiv.10",               condColor: "#555" },
  { id: 10, label: "Marathonien",   emoji: "🏃",  color: "#bdbdbd", condition: "Condition: 90%\n30 missions",     condColor: "#555" },
  { id: 11, label: "Légende",       emoji: "🏆",  color: "#f9c74f", condition: "Condition: 100%\ncompétences",    condColor: "#555" },
  { id: 12, label: "Zen Attitude",  emoji: "🌸",  color: "#ce93d8", condition: "Condition: 7 jours\n<20% stress", condColor: "#555" },
];

const stars = [
  { top: 10,  left: 10,   size: 20, opacity: 0.6 },
  { top: 10,  right: 10,  size: 12, opacity: 0.4 },
  { bottom: 10, left: 10, size: 15, opacity: 0.5 },
  { bottom: 10, right: 10,size: 10, opacity: 0.35 },
  { top: 30,  left: 50,   size: 8,  opacity: 0.25 },
  { bottom: 40, right: 60,size: 22, opacity: 0.7 },
  { top: 40,  right: 50,  size: 22, opacity: 0.7 },
];

const xpPct = (UNLOCKED_COUNT / TOTAL_BADGES) * 100;

// ── Badge débloqué ──────────────────────────────────────────
function UnlockedBadge({ emoji, label, date, bg, color, onPress }) {
  return (
    // ← onPress pour ouvrir le modal
    <TouchableOpacity
      style={[unlockedStyles.card, { backgroundColor: bg }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={unlockedStyles.label} numberOfLines={1}>{label}</Text>
      <View style={[unlockedStyles.iconBox, { borderColor: color + "66" }]}>
        <Text style={unlockedStyles.emoji}>{emoji}</Text>
      </View>
      <Text style={unlockedStyles.obtained}>Obetenu le</Text>
      <Text style={unlockedStyles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

const unlockedStyles = StyleSheet.create({
  card: {
    width: "30%",
    borderRadius: 16,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  label:    { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 6, textAlign: "center" },
  iconBox:  { width: 60, height: 60, borderRadius: 30, borderWidth: 2, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  emoji:    { fontSize: 28 },
  obtained: { fontSize: 9, color: "#9b87c9", fontWeight: "500" },
  date:     { fontSize: 9, color: "#5c3ca8", fontWeight: "700", textAlign: "center" },
});

// ── Badge verrouillé ────────────────────────────────────────
function LockedBadge({ emoji, label, condition, condColor }) {
  return (
    <View style={lockedStyles.card}>
      <Text style={lockedStyles.label} numberOfLines={1}>{label}</Text>
      <View style={lockedStyles.iconBox}>
        <Text style={lockedStyles.emoji}>{emoji}</Text>
        <View style={lockedStyles.lockOverlay}>
          <Ionicons name="lock-closed" size={14} color="#fff" />
        </View>
      </View>
      <Text style={[lockedStyles.condition, { color: condColor }]}>
        {condition}
      </Text>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  card:      { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10, backgroundColor: "#f0ecff" },
  label:     { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 6, textAlign: "center" },
  iconBox:   { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#d4c9ff", backgroundColor: "#e8e4f8", justifyContent: "center", alignItems: "center", marginBottom: 6, position: "relative" },
  emoji:     { fontSize: 24, opacity: 0.5 },
  lockOverlay: { position: "absolute", bottom: -4, right: -4, backgroundColor: "#7f5af0", borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#fff" },
  condition: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 13 },
});

// ── Écran principal ─────────────────────────────────────────
export default function BadgesScreen() {
  const router = useRouter();

  // ── État du modal ──────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState({ label: "", emoji: "" });

  // Ouvrir le modal avec le badge cliqué
  const openModal = (label, emoji) => {
    setSelectedBadge({ label, emoji });
    setModalVisible(true);
  };

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
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
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Carte trophée */}
        <View style={styles.card}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.xpLabel}>{UNLOCKED_COUNT}/{TOTAL_BADGES} badges débloqués</Text>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={["#7f5af0", "#bbaaff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: xpPct + "%" }]}
            />
          </View>
        </View>

        {/* Badges débloqués */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>Badges débloqués</Text>
            <Ionicons name="checkmark-circle" size={18} color="#7f5af0" style={{ marginLeft: 6 }} />
          </View>
          <TouchableOpacity style={styles.voirTout}>
            <Text style={styles.voirToutText}>Voir tout</Text>
            <Ionicons name="chevron-forward" size={14} color="#7f5af0" />
          </TouchableOpacity>
        </View>

        <View style={styles.badgesGrid}>
          {UNLOCKED_BADGES.map((b) => (
            <UnlockedBadge
              key={b.id}
              {...b}
              onPress={() => openModal(b.label, b.emoji)} // ← ouvre le modal
            />
          ))}
        </View>

        {/* Badges à débloquer */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Ionicons name="lock-closed" size={15} color="#7f5af0" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Badges a debloquer</Text>
          </View>
          <TouchableOpacity style={styles.voirTout}>
            <Text style={styles.voirToutText}>Voir tout</Text>
            <Ionicons name="chevron-forward" size={14} color="#7f5af0" />
          </TouchableOpacity>
        </View>

        <View style={styles.badgesGrid}>
          {LOCKED_BADGES.map((b) => (
            <LockedBadge key={b.id} {...b} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navbar */}
      <Navbar active="badges" onChange={() => {}} />

      {/* ── Modal badge débloqué ── */}
      <BadgeUnlockedModal
        visible={modalVisible}
        badgeName={selectedBadge.label}
        badgeEmoji={selectedBadge.emoji}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stars: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
  title:  { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.5 },
  helpBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0ecff", justifyContent: "center", alignItems: "center", shadowColor: "#7f5af0", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  helpText: { fontSize: 16, fontWeight: "800", color: "#7f5af0" },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  trophyEmoji: { fontSize: 44, marginBottom: 6 },
  xpLabel: { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginBottom: 10 },
  xpTrack: { width: "100%", height: 8, backgroundColor: "#e0d9ff", borderRadius: 8, overflow: "hidden" },
  xpFill:  { height: "100%", borderRadius: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLeft:   { flexDirection: "row", alignItems: "center" },
  sectionTitle:  { fontSize: 15, fontWeight: "800", color: "#2d1a6e" },
  voirTout:      { flexDirection: "row", alignItems: "center" },
  voirToutText:  { fontSize: 12, color: "#7f5af0", fontWeight: "700", marginRight: 2 },
  badgesGrid:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
});