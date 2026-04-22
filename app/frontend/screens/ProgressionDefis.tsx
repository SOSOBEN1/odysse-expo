
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
// ─── Types ───────────────────────────────────────────────────────────────────
type TabType = "missions" | "activite";

interface Participant {
  id: number;
  name: string;
  minutes: number;
  avatar: string;
}

interface Objective {
  id: number;
  title: string;
  description: string;
  accomplishedBy: string;
  status: "completed" | "in_progress" | "pending";
  progress?: number; // 0-100 for in_progress
  timeInfo?: string; // e.g. "30 min"
}

interface ActivityItem {
  id: number;
  user: string;
  avatar: string;
  action: string;
  time: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PARTICIPANTS: Participant[] = [
  { id: 1, name: "Mélanie", minutes: 45, avatar: "👩‍🦰" },
  { id: 2, name: "Antoine", minutes: 30, avatar: "👦" },
  { id: 3, name: "David",   minutes: 15, avatar: "🧑" },
  { id: 4, name: "Tom",     minutes: 0,  avatar: "👱" },
];

const OBJECTIVES: Objective[] = [
  {
    id: 1,
    title: "Objectif 1",
    description: "Étudier pendant",
    accomplishedBy: "Mélanie",
    status: "completed",
    timeInfo: "30 min",
  },
  {
    id: 2,
    title: "Objectif 2",
    description: "Réviser ses notes",
    accomplishedBy: "Antoine",
    status: "completed",
    timeInfo: "20 min",
  },
  {
    id: 3,
    title: "Objectif 3",
    description: "Terminer l'étude de",
    accomplishedBy: ":",
    status: "in_progress",
    progress: 75,
  },
];

const ACTIVITY: ActivityItem[] = [
  { id: 1, user: "Mélanie", avatar: "👩‍🦰", action: "a complété l'objectif 1",      time: "Il y a 5 min" },
  { id: 2, user: "Antoine", avatar: "👦",   action: "a rejoint le défi",            time: "Il y a 12 min" },
  { id: 3, user: "David",   avatar: "🧑",   action: "a ajouté 15 min d'étude",      time: "Il y a 20 min" },
  { id: 4, user: "Tom",     avatar: "👱",   action: "a complété l'objectif 2",      time: "Il y a 30 min" },
];

const TOTAL_GOAL_MINUTES = 120; // 2h

// ─── Component ───────────────────────────────────────────────────────────────
export default function ProgressionDefiScreen() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("defis");
  const [activeTab, setActiveTab] = useState<TabType>("missions");
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS);
  const [showAddTime, setShowAddTime] = useState(false);
  const [addMinutes, setAddMinutes] = useState("");

  const totalStudied = participants.reduce((sum, p) => sum + p.minutes, 0);
  const progressRatio = Math.min(totalStudied / TOTAL_GOAL_MINUTES, 1);
  const totalHours = Math.floor(totalStudied / 60);
  const totalMins  = totalStudied % 60;
  const goalHours  = Math.floor(TOTAL_GOAL_MINUTES / 60);

  const handleAddTime = () => {
    const mins = parseInt(addMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === 1 ? { ...p, minutes: p.minutes + mins } : p
        )
      );
    }
    setAddMinutes("");
    setShowAddTime(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#D8CCFF", "#E8DFFA", "#EDE8FB"]} style={styles.gradient}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Progression du défi</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <View>
                <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
                <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Challenge Banner ── */}
          <View style={[styles.challengeBanner, SHADOWS.light]}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.sparkleR}>✦</Text>
            <Text style={styles.challengeTitle}>Marathon d'étude 2 heures</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>En cours</Text>
            </View>
          </View>

          {/* ── Progress Card ── */}
          <View style={[styles.progressCard, SHADOWS.light]}>
            <Text style={styles.progressLabel}>
              Temps total étudié :{" "}
              <Text style={styles.progressValue}>
                {totalHours}h{totalMins > 0 ? `${totalMins.toString().padStart(2,"0")}` : ""}
                /{goalHours}h
              </Text>
            </Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={["#664e97", "#906ce6", "#c182de" ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]}
              />
            </View>

            {/* Participant avatars */}
            <View style={styles.participantsRow}>
              {participants.map((p) => (
                <View key={p.id} style={styles.participantItem}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>{p.avatar}</Text>
                  </View>
                  <Text style={styles.participantName}>{p.name}</Text>
                  <Text style={styles.participantTime}>
                    {p.minutes > 0
                      ? p.minutes >= 60
                        ? `${Math.floor(p.minutes/60)}h${p.minutes%60>0?p.minutes%60+"m":""}`
                        : `${p.minutes} min`
                      : "0 m"}
                  </Text>
                </View>
              ))}
            </View>

            {/* Add time button */}
            <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={() => setShowAddTime(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addTimeBtnGrad}
              >
                <Text style={styles.addTimeBtnText}>Ajouter du temps</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "missions" && styles.tabActive]}
              onPress={() => setActiveTab("missions")}
            >
              <Text style={[styles.tabText, activeTab === "missions" && styles.tabTextActive]}>
                Tableau des missions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "activite" && styles.tabActive]}
              onPress={() => setActiveTab("activite")}
            >
              <Text style={[styles.tabText, activeTab === "activite" && styles.tabTextActive]}>
                Fil d'activité
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab Content ── */}
          {activeTab === "missions" ? (
            <View style={styles.objectivesList}>
              {OBJECTIVES.map((obj) => (
                <ObjectiveCard key={obj.id} objective={obj} />
              ))}
            </View>
          ) : (
            <View style={styles.activityList}>
              {ACTIVITY.map((item) => (
                <View key={item.id} style={[styles.activityItem, SHADOWS.light]}>
                  <View style={styles.activityAvatar}>
                    <Text style={styles.activityEmoji}>{item.avatar}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityUser}>{item.user}</Text>
                      {" "}{item.action}
                    </Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── Add Time Modal ── */}
        <Modal visible={showAddTime} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddTime(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ajouter du temps</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="Minutes étudiées..."
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={addMinutes}
              onChangeText={setAddMinutes}
            />
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTime}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalConfirmGrad}
              >
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>

        <Navbar active={activeNav} onChange={setActiveNav} />
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── ObjectiveCard ────────────────────────────────────────────────────────────
function ObjectiveCard({ objective }: { objective: Objective }) {
  const isCompleted  = objective.status === "completed";
  const isInProgress = objective.status === "in_progress";

  return (
    <View style={[styles.objCard, SHADOWS.light]}>
      {/* Status icon */}
      {isCompleted ? (
        <View style={styles.objCheckCircle}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      ) : (
        <View style={styles.objPendingCircle}>
          <Ionicons name="ellipse-outline" size={20} color={COLORS.primaryLight} />
        </View>
      )}

      {/* Info */}
      <View style={styles.objInfo}>
        <Text style={styles.objTitle}>
          <Text style={styles.objTitleBold}>{objective.title}: </Text>
          {objective.description}
        </Text>
        <Text style={styles.objSub}>Accompli par {objective.accomplishedBy}</Text>
      </View>

      {/* Right side */}
      {isCompleted && (
        <View style={styles.objRight}>
          <Text style={styles.objCompleted}>Complété</Text>
          {objective.timeInfo && (
            <Text style={styles.objTime}>{objective.timeInfo}</Text>
          )}
        </View>
      )}
      {isInProgress && objective.progress !== undefined && (
        <View style={styles.progressCircleWrapper}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>{objective.progress}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#D8CCFF" },
  gradient: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingTop: 45,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    ...SHADOWS.light,
  },
  headerTitle: {
    flex: 1, textAlign: "center",
    fontSize: 18, fontWeight: "700", color: COLORS.text,
  },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
    ...SHADOWS.light,
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: COLORS.notifBadge,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  scroll: { paddingHorizontal: SIZES.padding, paddingTop: 8 },

  // Challenge banner
  challengeBanner: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    alignItems: "center",
    position: "relative",
    marginBottom: 12,
    overflow: "hidden",
  },
  sparkle:  { position: "absolute", top: 10, left: 14,  fontSize: 16, color: COLORS.primaryLight },
  sparkleR: { position: "absolute", top: 10, right: 14, fontSize: 12, color: COLORS.primaryLight },
  challengeTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  statusBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  statusText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },

  // Progress card
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
  },
  progressLabel: { fontSize: 14, color: COLORS.textLight, marginBottom: 10 },
  progressValue: { fontWeight: "800", color: COLORS.text, fontSize: 16 },
  progressTrack: {
    height: 12,
    backgroundColor: COLORS.progressBg,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: SIZES.radiusFull,
  },

  participantsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  participantItem: { alignItems: "center", gap: 4 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryPale,
    borderWidth: 2, borderColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarEmoji:      { fontSize: 30 },
  participantName:  { fontSize: 12, fontWeight: "600", color: COLORS.text },
  participantTime:  { fontSize: 11, color: COLORS.textLight },

  addTimeBtn: { borderRadius: SIZES.radiusFull, overflow: "hidden" },
  addTimeBtnGrad: { paddingVertical: 10, alignItems: "center", borderRadius: SIZES.radiusFull },
  addTimeBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 4,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: SIZES.radius,
    alignItems: "center",
  },
  tabActive: { backgroundColor: COLORS.primaryPale },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },

  // Objective cards
  objectivesList: { gap: 10 },
  objCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  objCheckCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.success,
    alignItems: "center", justifyContent: "center",
  },
  objPendingCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primaryPale,
    alignItems: "center", justifyContent: "center",
  },
  objInfo: { flex: 1 },
  objTitle: { fontSize: 14, color: COLORS.text },
  objTitleBold: { fontWeight: "700" },
  objSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  objRight: { alignItems: "flex-end", gap: 2 },
  objCompleted: { fontSize: 13, fontWeight: "700", color: COLORS.success },
  objTime: { fontSize: 12, color: COLORS.textLight },

  progressCircleWrapper: { alignItems: "center", justifyContent: "center" },
  progressCircle: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 3, borderColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primaryPale,
  },
  progressCircleText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  // Activity
  activityList: { gap: 10 },
  activityItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryPale,
    alignItems: "center", justifyContent: "center",
  },
  activityEmoji: { fontSize: 22 },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 13, color: COLORS.text },
  activityUser: { fontWeight: "700" },
  activityTime: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#00000033" },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  timeInput: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalConfirmBtn: { borderRadius: SIZES.radiusFull, overflow: "hidden" },
  modalConfirmGrad: { paddingVertical: 13, alignItems: "center", borderRadius: SIZES.radiusFull },
  modalConfirmText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});