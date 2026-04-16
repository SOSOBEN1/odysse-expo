import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import CreateMissionModal from "./CreateMissionModal";
import { useRouter } from "expo-router";

type Mission = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  status: "Terminée" | "En cours" | "En retard";
  date: string;
};

type SuggestedMission = {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "Facile" | "Moyen" | "Difficile";
  xp: number;
  duration: string;
  accentColor: string;
};

type Props = {
  missions: Mission[];
  onAdd: () => void;
};

const statusConfig = {
  Terminée: { color: "#22c55e", bg: "#dcfce7", icon: "✅" },
  "En cours": { color: "#f59e0b", bg: "#fef3c7", icon: "🔄" },
  "En retard": { color: "#ef4444", bg: "#fee2e2", icon: "🔴" },
};

const tagColors: Record<string, string> = {
  "Soutenance PFE": "#ddd6fe",
  "Projet mobile": "#bfdbfe",
};

const difficultyConfig = {
  Facile: { color: "#22c55e", bg: "#dcfce7", stars: "⭐" },
  Moyen: { color: "#f59e0b", bg: "#fef3c7", stars: "⭐⭐" },
  Difficile: { color: "#ef4444", bg: "#fee2e2", stars: "⭐⭐⭐" },
};


const SUGGESTED: SuggestedMission[] = [
  {
    id: "s1", title: "Maîtriser les algorithmes de tri",
    description: "Apprends bubble sort, merge sort et quicksort avec des exercices pratiques.",
    icon: "🧠", difficulty: "Moyen", xp: 150, duration: "2h00", accentColor: "#7c3aed",
  },
  {
    id: "s2", title: "Créer une API REST",
    description: "Construis une API complète avec Node.js et Express en partant de zéro.",
    icon: "⚙️", difficulty: "Difficile", xp: 300, duration: "4h00", accentColor: "#0891b2",
  },
  {
    id: "s3", title: "UI Design avec Figma",
    description: "Conçois des interfaces mobiles modernes et apprends les bases du prototypage.",
    icon: "🎨", difficulty: "Facile", xp: 80, duration: "1h30", accentColor: "#db2777",
  },
  {
    id: "s4", title: "Bases de données SQL",
    description: "Maîtrise les requêtes JOIN, sous-requêtes et optimisation des index.",
    icon: "🗄️", difficulty: "Moyen", xp: 200, duration: "3h00", accentColor: "#059669",
  },
];

// ─── Recent Mission Card ──────────────────────────────────────────────────────
function RecentMissionCard({ mission }: { mission: Mission }) {
  
  const cfg = statusConfig[mission.status];
  return (
    <View style={recentStyles.card}>
      <View style={[recentStyles.statusStrip, { backgroundColor: cfg.color }]} />
      <View style={recentStyles.content}>
        <View style={recentStyles.topRow}>
          <Text style={recentStyles.icon}>{cfg.icon}</Text>
          <View style={recentStyles.info}>
            <Text style={recentStyles.title} numberOfLines={1}>{mission.title}</Text>
            <View style={recentStyles.metaRow}>
              <View style={[recentStyles.tag, { backgroundColor: tagColors[mission.tag] ?? "#e5e7eb" }]}>
                <Text style={recentStyles.tagText}>{mission.tag}</Text>
              </View>
              <Text style={recentStyles.duration}>⏱ {mission.duration}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={recentStyles.right}>
        <View style={[recentStyles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[recentStyles.statusText, { color: cfg.color }]}>{mission.status}</Text>
        </View>
        <Text style={recentStyles.date}>{mission.date}</Text>
      </View>
    </View>
  );
}

const recentStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    flexDirection: "row", alignItems: "center", overflow: "hidden", ...SHADOWS.light,
  },
  statusStrip: { width: 5, alignSelf: "stretch" },
  content: { flex: 1, padding: 12 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700", color: "#1e1b4b", marginBottom: 5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 9, fontWeight: "600", color: "#4c1d95" },
  duration: { fontSize: 11, color: "#9ca3af" },
  right: { paddingRight: 12, alignItems: "flex-end", gap: 5 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  date: { fontSize: 10, color: "#9ca3af" },
});

// ─── Suggested Mission Card ───────────────────────────────────────────────────
function SuggestedMissionCard({ mission }: { mission: SuggestedMission }) {
  const diff = difficultyConfig[mission.difficulty];
  return (
    <TouchableOpacity style={[suggestedStyles.card, { borderTopColor: mission.accentColor }]} activeOpacity={0.85}>
      <View style={suggestedStyles.header}>
        <View style={[suggestedStyles.iconWrapper, { backgroundColor: mission.accentColor + "22" }]}>
          <Text style={suggestedStyles.icon}>{mission.icon}</Text>
        </View>
        <View style={suggestedStyles.headerRight}>
          <View style={[suggestedStyles.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[suggestedStyles.diffText, { color: diff.color }]}>{diff.stars} {mission.difficulty}</Text>
          </View>
          <View style={[suggestedStyles.xpBadge, { backgroundColor: mission.accentColor + "15" }]}>
            <Text style={[suggestedStyles.xpText, { color: mission.accentColor }]}>+{mission.xp} XP</Text>
          </View>
        </View>
      </View>
      <Text style={suggestedStyles.title}>{mission.title}</Text>
      <Text style={suggestedStyles.description} numberOfLines={2}>{mission.description}</Text>
      <View style={suggestedStyles.footer}>
        <Text style={suggestedStyles.duration}>⏱ {mission.duration}</Text>
        <TouchableOpacity style={[suggestedStyles.startBtn, { backgroundColor: mission.accentColor }]}>
          <Text style={suggestedStyles.startBtnText}>Commencer →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const suggestedStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    borderTopWidth: 4, ...SHADOWS.medium,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  iconWrapper: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 24 },
  headerRight: { alignItems: "flex-end", gap: 6 },
  diffBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 10, fontWeight: "700" },
  xpBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  xpText: { fontSize: 11, fontWeight: "800" },
  title: { fontSize: 14, fontWeight: "800", color: "#1e1b4b", marginBottom: 6 },
  description: { fontSize: 12, color: "#6b7280", lineHeight: 18, marginBottom: 14 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duration: { fontSize: 12, color: "#9ca3af" },
  startBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  startBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

// ─── Main MissionsList ────────────────────────────────────────────────────────
export default function MissionsList({ missions, onAdd }: Props) {
  const router = useRouter(); // ✅
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.container}>

      {/* ── Missions récentes ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Missions récentes</Text>

        {/* ✅ "Voir tout" → navigue vers MissionsScreen */}
        <TouchableOpacity onPress={() => router.push("/frontend/screens/Missions")}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {missions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune mission pour l'instant</Text>
        ) : (
          missions.map((m) => <RecentMissionCard key={m.id} mission={m} />)
        )}
      </View>

      {/* ── Bouton créer mission ── */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.addBtnText}>+ Créer une mission</Text>
      </TouchableOpacity>

      {/* ── Missions suggérées ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Missions suggérées ✨</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>Basées sur ton profil et tes objectifs</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestedScroll}
      >
        {SUGGESTED.map((m) => (
          <View key={m.id} style={styles.suggestedCardWrapper}>
            <SuggestedMissionCard mission={m} />
          </View>
        ))}
      </ScrollView>

      {/* ── Astuce ── */}
      <View style={styles.tipCard}>
        <View style={styles.tipLeft}>
          <Text style={styles.tipTitle}>⭐ Astuce</Text>
          <Text style={styles.tipText}>
            Essaie de garder une série active chaque jour pour booster ta progression !
          </Text>
        </View>
        <Text style={styles.tipEmoji}>🚀</Text>
      </View>

      {/* ── Modal ── */}
      <CreateMissionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(mission) => {
          setShowModal(false);
          onAdd(); // ✅ notifie HomeScreen de recharger les missions
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 22, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1e1b4b" },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  sectionSubtitle: { fontSize: 12, color: "#9ca3af", marginBottom: 12, marginTop: -6 },
  list: { gap: 10 },
  emptyText: {
    textAlign: "center", color: "#9ca3af",
    fontSize: 13, paddingVertical: 20,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  suggestedScroll: { paddingRight: 16, gap: 12 },
  suggestedCardWrapper: { width: 260 },
  tipCard: {
    backgroundColor: "#f5f3ff", borderRadius: 16, padding: 16, marginTop: 24,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#ddd6fe",
  },
  tipLeft: { flex: 1 },
  tipTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  tipText: { fontSize: 12, color: "#6b7280", lineHeight: 18 },
  tipEmoji: { fontSize: 36 },
});