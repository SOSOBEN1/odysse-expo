import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Alert, Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import CreateMissionModal from "../components/CreateMissionModal";
import CreateEventModal from "../components/CreateEventModal";
import { supabase } from "../constants/supabase";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

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

const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={COLORS.missionTabActive} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke={COLORS.missionTabActive} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconDelete = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke={COLORS.missionUrgentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const difficultyConfig: Record<Difficulty, any> = {
  Difficile: { label: "🔥 Difficile", badgeBg: COLORS.diffHard,   eventBg: COLORS.diffHardEvent, progressColor: COLORS.diffHard,   iconBg: COLORS.diffHardEvent, flame: "🔥", cardBg: "rgba(255,255,255,0.93)", btnBg: COLORS.diffHardEvent },
  Moyen:     { label: "🔥 Moyen",    badgeBg: COLORS.diffMedium,  eventBg: COLORS.diffMedium,    progressColor: COLORS.diffMedium, iconBg: COLORS.diffMedium,    flame: "🔥", cardBg: "rgba(255,245,225,0.95)", btnBg: COLORS.diffMedium },
  Facile:    { label: "💧 Facile",   badgeBg: COLORS.diffEasy,    eventBg: COLORS.diffEasyEvent, progressColor: COLORS.diffEasy,   iconBg: COLORS.diffEasy,      flame: "💧", cardBg: "rgba(235,245,255,0.93)", btnBg: COLORS.diffEasyEvent },
};

const mapDifficulty = (d: number): Difficulty => {
  if (d === 3) return "Difficile";
  if (d === 2) return "Moyen";
  return "Facile";
};

const parseDurationToMinutes = (duration: string): number | null => {
  if (!duration || duration === "-") return null;
  const match = duration.match(/(\d+)h(\d*)/);
  if (!match) return null;
  const hours = parseInt(match[1]) || 0;
  const mins  = parseInt(match[2]) || 0;
  return hours * 60 + mins;
};

function MissionCard({ mission, onDelete, onEdit }: {
  mission: Mission;
  onDelete: (id: number) => void;
  onEdit: (m: Mission) => void;
}) {
  const cfg = difficultyConfig[mission.difficulty];
  const pct = Math.round(mission.progress * 100);
  const btnLabel = pct === 0 ? "DÉMARRER" : pct === 100 ? "TERMINÉ" : "CONTINUER";

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
            <Text style={styles.continueBtnText}>{btnLabel}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardActionsBottom}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => onEdit(mission)}>
            <IconEdit />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => onDelete(mission.id)}>
            <IconDelete />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MissionsScreen() {
  const [activeTab, setActiveTab]               = useState<Tab>("Tout");
  const [isMissionModalVisible, setMissionModalVisible] = useState(false);
  const [isEventModalVisible,   setEventModalVisible]   = useState(false);
  const [selectedData, setSelectedData]         = useState<any>(null);
  const [missions, setMissions]                 = useState<Mission[]>([]);
  const [loading, setLoading]                   = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMissions();
    }, [])
  );

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mission")
        .select("*")
        .order("id_mission", { ascending: false });

      if (error) throw error;

      const mapped: Mission[] = (data ?? []).map((m: any) => ({
        id:          m.id_mission,
        event:       m.type ?? null,
        title:       m.titre ?? "Sans titre",
        duration:    m.duree_min
          ? `${Math.floor(m.duree_min / 60)}h${String(m.duree_min % 60).padStart(2, "0")}`
          : "-",
        description: m.description ?? "",
        difficulty:  mapDifficulty(m.difficulte ?? 1),
        progress:    0,
        urgent:      (m.priorite ?? 1) >= 4,
        today:       m.created_at
          ? new Date(m.created_at).toDateString() === new Date().toDateString()
          : false,
      }));

      setMissions(mapped);
    } catch (err: any) {
      console.error("❌ Erreur fetch missions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = missions.filter(m => {
    if (activeTab === "Urgent")         return m.urgent;
    if (activeTab === "Aujourd'hui")    return m.today;
    if (activeTab === "Par Événements") return m.event !== null;
    return true;
  });

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("mission")
            .delete()
            .eq("id_mission", id);

          if (error) {
            Alert.alert("Erreur", error.message);
          } else {
            setMissions(prev => prev.filter(m => m.id !== id));
          }
        },
      },
    ]);
  };

  const handleEdit = (mission: Mission) => {
    setSelectedData({
      id_mission:  mission.id,
      titre:       mission.title,
      description: mission.description,
      duree_min:   parseDurationToMinutes(mission.duration),
      difficulte:  mission.difficulty === "Difficile" ? 3
                 : mission.difficulty === "Moyen"     ? 2 : 1,
      priorite:    mission.urgent ? 4 : 2,
    });
    setMissionModalVisible(true);
  };

  const handleSaveData = () => {
    fetchMissions();
    setSelectedData(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👩</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour, <Text style={styles.greetingName}>Sonia!</Text></Text>
            <Text style={styles.subGreeting}>{filteredMissions.length} missions</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Missions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredMissions.length}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <Text style={styles.emptyText}>Chargement...</Text>
        ) : filteredMissions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune mission trouvée</Text>
        ) : (
          filteredMissions.map((m) => (
            <MissionCard key={m.id} mission={m} onDelete={handleDelete} onEdit={handleEdit} />
          ))
        )}

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => { setSelectedData(null); setMissionModalVisible(true); }}
        >
          <Text style={styles.createBtnText}>＋  Créer mission</Text>
        </TouchableOpacity>
      </ScrollView>

      <CreateMissionModal
        visible={isMissionModalVisible}
        onClose={() => { setMissionModalVisible(false); setSelectedData(null); }}
        onSave={() => {
          fetchMissions();
          setSelectedData(null);
          setMissionModalVisible(false);
        }}
        initialData={selectedData}
      />

      <CreateEventModal
        visible={isEventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onCreate={handleSaveData}
        initialData={selectedData}
      />

      <Navbar active="missions" onChange={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.missionBg },
 scrollContent: { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 150 },
  header:            { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  avatarCircle:      { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", ...SHADOWS.medium },
  avatarEmoji:       { fontSize: 36 },
  greeting:          { fontSize: 24, color: COLORS.missionHeading },
  greetingName:      { fontWeight: "800" },
  subGreeting:       { color: COLORS.missionSub, fontWeight: "600" },
  sectionRow:        { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle:      { fontWeight: "800", fontSize: 20, color: COLORS.missionHeading },
  countBadge:        { backgroundColor: COLORS.missionTabActive, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2 },
  countText:         { color: COLORS.background, fontWeight: "800", fontSize: 13 },
  tabsContainer:     { flexDirection: "row", gap: 8, marginBottom: 24 },
  tab:               { borderRadius: 20, borderWidth: 2, borderColor: COLORS.missionTabBorder, paddingVertical: 7, paddingHorizontal: 14 },
  tabActive:         { backgroundColor: COLORS.missionTabActive, borderWidth: 0 },
  tabText:           { color: COLORS.missionTabActive, fontWeight: "700" },
  tabTextActive:     { color: COLORS.background },
  emptyText:         { textAlign: "center", color: COLORS.missionDuration, marginTop: 40 },
  cardWrapper:       { marginBottom: 24 },
  eventBadge:        { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 22, marginLeft: 14, marginBottom: -14, zIndex: 2, ...SHADOWS.light },
  eventBadgeText:    { color: COLORS.background, fontWeight: "700" },
  eventBadgeSpacer:  { height: 0 },
  card:              { borderRadius: 20, paddingTop: 24, paddingBottom: 12, paddingHorizontal: 16, ...SHADOWS.medium },
  cardActionsBottom: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.cardDivider },
  actionIconBtn:     { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.cardActionBg, alignItems: "center", justifyContent: "center" },
  urgentBanner:      { backgroundColor: COLORS.missionUrgentBg, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start", marginBottom: 10 },
  urgentText:        { color: COLORS.missionUrgentText, fontWeight: "700", fontSize: 12 },
  topRow:            { flexDirection: "row", gap: 12 },
  iconBox:           { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText:          { fontSize: 26 },
  infoBox:           { flex: 1 },
  titleRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTitle:      { fontWeight: "800", fontSize: 17, color: COLORS.missionHeading, flex: 1 },
  diffBadge:         { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  diffBadgeText:     { color: COLORS.background, fontWeight: "700", fontSize: 12 },
  duration:          { color: COLORS.missionDuration, marginTop: 3 },
  description:       { color: COLORS.missionDesc, fontSize: 13, marginTop: 4 },
  bottomRow:         { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  progressContainer: { flex: 1 },
  progressTrack:     { height: 8, borderRadius: 8, backgroundColor: COLORS.missionProgress },
  progressFill:      { height: "100%", borderRadius: 8 },
  progressLabel:     { fontSize: 11, fontWeight: "700", marginTop: 4 },
  continueBtn:       { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 18 },
  continueBtnText:   { color: COLORS.background, fontWeight: "800" },
  createBtn:         { backgroundColor: COLORS.missionCreateBtn, borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText:     { color: COLORS.background, fontWeight: "800", fontSize: 17 },
});