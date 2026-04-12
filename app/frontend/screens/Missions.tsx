import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";

// Import de tes modales
import CreateMissionModal from "../components/CreateMissionModal";
import CreateEventModal from "../components/CreateEventModal";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────
type Difficulty = "Difficile" | "Moyen" | "Facile";

interface Mission {
  id: number;
  event: string | null;
  title: string;
  duration: string;
  description: string;
  difficulty: Difficulty;
  progress: number;
  urgent: boolean;
  today: boolean;
}

const TABS = ["Tout", "Urgent", "Aujourd'hui", "Par Événements"] as const;
type Tab = (typeof TABS)[number];

// ─── NOUVELLES ICÔNES SVG (STYLE DÉFIS) ───────────
const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#6c3fcb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#6c3fcb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconDelete = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#e84393" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ─── Difficulty Config ────────────────────────────
const difficultyConfig: Record<Difficulty, any> = {
  Difficile: { label: "🔥 Difficile", badgeBg: "#e84393", eventBg: "#6c3fcb", progressColor: "#e84393", iconBg: "#6c3fcb", flame: "🔥", cardBg: "rgba(255,255,255,0.93)", btnBg: "#6c3fcb" },
  Moyen: { label: "🔥 Moyen", badgeBg: "#f5a623", eventBg: "#f5a623", progressColor: "#f5a623", iconBg: "#f5a623", flame: "🔥", cardBg: "rgba(255,245,225,0.95)", btnBg: "#f5a623" },
  Facile: { label: "💧 Facile", badgeBg: "#5ab4e5", eventBg: "#7ab8d9", progressColor: "#5ab4e5", iconBg: "#5ab4e5", flame: "💧", cardBg: "rgba(235,245,255,0.93)", btnBg: "#7ab8d9" },
};

// ─── MissionCard Component ────────────────────────
function MissionCard({ mission, onDelete, onEdit }: { mission: Mission; onDelete: (id: number) => void; onEdit: (m: Mission) => void }) {
  const cfg = difficultyConfig[mission.difficulty];
  const pct = Math.round(mission.progress * 100);

  return (
    <View style={styles.cardWrapper}>
      {mission.event ? (
        <View style={[styles.eventBadge, { backgroundColor: cfg.eventBg }]}>
          <Text style={styles.eventBadgeText}>{mission.event}</Text>
        </View>
      ) : <View style={styles.eventBadgeSpacer} />}

      <View style={[styles.card, { backgroundColor: cfg.cardBg }]}>
        {mission.urgent && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentText}>⚡ Urgent</Text>
          </View>
        )}

        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
            <Text style={styles.iconText}>{cfg.flame}</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.titleRow}>
              <Text style={styles.missionTitle} numberOfLines={1}>{mission.title}</Text>
              <View style={[styles.diffBadge, { backgroundColor: cfg.badgeBg }]}>
                <Text style={styles.diffBadgeText}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={styles.duration}>⏱ {mission.duration}</Text>
            <Text style={styles.description} numberOfLines={2}>{mission.description}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.progressColor }]} />
            </View>
            <Text style={[styles.progressLabel, { color: cfg.progressColor }]}>
                {pct === 100 ? "Terminé" : pct === 0 ? "Non commencé" : `${pct}%`}
            </Text>
          </View>
          <TouchableOpacity style={[styles.continueBtn, { backgroundColor: cfg.btnBg }]}>
            <Text style={styles.continueBtnText}>CONTINUER</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ ACTIONS EN BAS AVEC LES ICÔNES SVG DÉFIS */}
        <View style={styles.cardActionsBottom}>
          <TouchableOpacity 
            style={styles.actionIconBtn} 
            onPress={() => onEdit(mission)}
          >
            <IconEdit />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIconBtn} 
            onPress={() => onDelete(mission.id)}
          >
            <IconDelete />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────
export default function MissionsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("Tout");
  const [isMissionModalVisible, setMissionModalVisible] = useState(false);
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<Mission | null>(null);

  const [missions, setMissions] = useState<Mission[]>([
    { id: 1, event: "Soutenance PFE", title: "Réviser algorithme", duration: "1h30", description: "Reviser les deux premiers chapitres", difficulty: "Difficile", progress: 0.55, urgent: true, today: true },
    { id: 2, event: "Soutenance PFE", title: "Préparer slides", duration: "2h", description: "Créer les diapositives", difficulty: "Moyen", progress: 0.72, urgent: false, today: true },
    { id: 3, event: null, title: "Lire article", duration: "45min", description: "Lire l'article recommandé", difficulty: "Facile", progress: 0.38, urgent: false, today: false },
    { id: 4, event: "Examen Réseau", title: "Réviser protocoles", duration: "2h", description: "Revoir TCP/IP et OSI", difficulty: "Difficile", progress: 0.2, urgent: true, today: true },
  ]);

  const filteredMissions = missions.filter(m => {
    if (activeTab === "Urgent") return m.urgent;
    if (activeTab === "Aujourd'hui") return m.today;
    if (activeTab === "Par Événements") return m.event !== null;
    return true;
  });

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => setMissions(prev => prev.filter(m => m.id !== id)) },
    ]);
  };

  const handleEdit = (mission: Mission) => {
    setSelectedData(mission);
    mission.event ? setEventModalVisible(true) : setMissionModalVisible(true);
  };

  const handleSaveData = (updatedData: any) => {
    setMissions(prev => prev.map(m => m.id === updatedData.id ? { ...m, ...updatedData } : m));
    setSelectedData(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>👩</Text></View>
          <View>
            <Text style={styles.greeting}>Bonjour, <Text style={styles.greetingName}>Sonia!</Text></Text>
            <Text style={styles.subGreeting}>{filteredMissions.length} missions</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Missions</Text>
          <View style={styles.countBadge}><Text style={styles.countText}>{filteredMissions.length}</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredMissions.map((m) => (
          <MissionCard key={m.id} mission={m} onDelete={handleDelete} onEdit={handleEdit} />
        ))}

        <TouchableOpacity style={styles.createBtn} onPress={() => { setSelectedData(null); setMissionModalVisible(true); }}>
          <Text style={styles.createBtnText}>＋  Créer mission</Text>
        </TouchableOpacity>
      </ScrollView>

      <CreateMissionModal visible={isMissionModalVisible} onClose={() => setMissionModalVisible(false)} onSave={handleSaveData} initialData={selectedData} />
      <CreateEventModal visible={isEventModalVisible} onClose={() => setEventModalVisible(false)} onCreate={handleSaveData} initialData={selectedData} />

      <Navbar active="missions" onChange={() => {}} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  scrollContent: { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.medium },
  avatarEmoji: { fontSize: 36 },
  greeting: { fontSize: 24, color: "#2d1a5e" },
  greetingName: { fontWeight: "800" },
  subGreeting: { color: "#7a5bbf", fontWeight: "600" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle: { fontWeight: "800", fontSize: 20, color: "#2d1a5e" },
  countBadge: { backgroundColor: "#6c3fcb", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2 },
  countText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tabsContainer: { flexDirection: "row", gap: 8, marginBottom: 24 },
  tab: { borderRadius: 20, borderWidth: 2, borderColor: "#c0a8f0", paddingVertical: 7, paddingHorizontal: 14 },
  tabActive: { backgroundColor: "#6c3fcb", borderWidth: 0 },
  tabText: { color: "#6c3fcb", fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  cardWrapper: { marginBottom: 24 },
  eventBadge: { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 22, marginLeft: 14, marginBottom: -14, zIndex: 2, ...SHADOWS.light },
  eventBadgeText: { color: "#fff", fontWeight: "700" },
  eventBadgeSpacer: { height: 0 },
  card: { borderRadius: 20, paddingTop: 24, paddingBottom: 12, paddingHorizontal: 16, ...SHADOWS.medium },
  
  // ✅ STYLES ACTIONS BAS (STYLE DÉFIS)
  cardActionsBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(120, 90, 180, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  urgentBanner: { backgroundColor: "#fff0f7", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start", marginBottom: 10 },
  urgentText: { color: "#e84393", fontWeight: "700", fontSize: 12 },
  topRow: { flexDirection: "row", gap: 12 },
  iconBox: { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText: { fontSize: 26 },
  infoBox: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTitle: { fontWeight: "800", fontSize: 17, color: "#2d1a5e", flex: 1 },
  diffBadge: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  diffBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  duration: { color: "#9b8bbf", marginTop: 3 },
  description: { color: "#5a5080", fontSize: 13, marginTop: 4 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  progressContainer: { flex: 1 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: "rgba(180,160,220,0.25)" },
  progressFill: { height: "100%", borderRadius: 8 },
  progressLabel: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  continueBtn: { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 18 },
  continueBtnText: { color: "#fff", fontWeight: "800" },
  createBtn: { backgroundColor: "#4b2fa0", borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});