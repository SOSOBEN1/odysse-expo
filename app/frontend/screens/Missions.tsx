import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Mission, MissionTimer } from "../../../backend/models/mission.types";
import {
  computeProgressPercent,
  formatDateLimite,
  formatElapsed,
  getDeadlineColor,
} from "../../../backend/models/mission.utils";
import { useMissions } from "../../../backend/viewmodels/useMissions";
import AvatarCrd from "../components/AvatarCrd";
import CreateEventModal from "../components/CreateEventModal";
import CreateMissionModal from "../components/CreateMissionModal";
import ExitMissionModal from "../components/ExitMissionModal";
import MissionStatusModal from "../components/MissionStatusModals";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import { useSounds } from "../hooks/useSounds";

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────

type Difficulty = "Difficile" | "Moyen" | "Facile";

const TABS = ["Tout", "Urgent", "Aujourd'hui", "Défis", "Par Événements"] as const;
type Tab = (typeof TABS)[number];

// ─────────────────────────────────────────────────────────────
//  Icons
// ─────────────────────────────────────────────────────────────

const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={COLORS.missionTabActive} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke={COLORS.missionTabActive} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconDelete = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke={COLORS.missionUrgentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
//  Config difficulté
// ─────────────────────────────────────────────────────────────

const difficultyConfig: Record<Difficulty, any> = {
  Difficile: { label: "🔥 Difficile", badgeBg: COLORS.diffHard,   eventBg: COLORS.diffHardEvent,  progressColor: COLORS.diffHard,   iconBg: COLORS.diffHardEvent,  flame: "🔥", cardBg: "rgba(255,255,255,0.93)", btnBg: COLORS.diffHardEvent },
  Moyen:     { label: "🔥 Moyen",    badgeBg: COLORS.diffMedium, eventBg: COLORS.diffMedium,     progressColor: COLORS.diffMedium, iconBg: COLORS.diffMedium,     flame: "🔥", cardBg: "rgba(255,245,225,0.95)", btnBg: COLORS.diffMedium },
  Facile:    { label: "💧 Facile",   badgeBg: COLORS.diffEasy,   eventBg: COLORS.diffEasyEvent,  progressColor: COLORS.diffEasy,   iconBg: COLORS.diffEasy,       flame: "💧", cardBg: "rgba(235,245,255,0.93)", btnBg: COLORS.diffEasyEvent },
};

// ─────────────────────────────────────────────────────────────
//  MissionCard
// ─────────────────────────────────────────────────────────────

function MissionCard({
  mission, timer, onDelete, onEdit, onStart, onPause, onFinish,
}: {
  mission: Mission;
  timer: MissionTimer;
  onDelete: (id: number) => void;
  onEdit: (m: Mission) => void;
  onStart: (id: number) => void;
  onPause: (id: number) => void;
  onFinish: (id: number) => void;
}) {
  const cfg       = difficultyConfig[mission.difficulty];
  const isDone    = timer.state === "done";
  const isFail    = timer.state === "fail";
  const isRunning = timer.state === "running";
  const isPaused  = timer.state === "paused";
  const isActive  = isRunning || isPaused;
  const isOver    = isDone || isFail;

  const pct = computeProgressPercent(timer.elapsed, mission.duration, timer.state);

  const getBtnLabel = () => {
    if (isDone)    return "✅ TERMINÉ";
    if (isFail)    return "❌ ÉCHOUÉ";
    if (isRunning) return "⏸ PAUSE";
    if (isPaused)  return "▶ CONTINUER";
    return "▶ DÉMARRER";
  };

  const handleBtnPress = () => {
    if (isOver) return;
    if (isRunning) onPause(mission.id);
    else onStart(mission.id);
  };

  return (
    <View style={styles.cardWrapper}>
      {mission.event ? (
        <View style={[styles.eventBadge, { backgroundColor: cfg.eventBg }]}>
          <Text style={styles.eventBadgeText}>{mission.event}</Text>
        </View>
      ) : <View style={styles.eventBadgeSpacer} />}

      <View style={[styles.card, { backgroundColor: isFail ? "rgba(255,235,235,0.95)" : cfg.cardBg }]}>

        {/* ── Banners urgent + défi ── */}
        <View style={styles.bannersRow}>
          {mission.urgent && (
            <View style={styles.urgentBanner}>
              <Text style={styles.urgentText}>⚡ Urgent</Text>
            </View>
          )}
          {mission.idDefi !== null && (
            <View style={styles.defiBanner}>
              <Text style={styles.defiText}>⚔️ Défi</Text>
            </View>
          )}
        </View>

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
            {mission.dateLimite && (
              <Text style={[styles.deadlineText, { color: getDeadlineColor(mission.dateLimite) }]}>
                🗓 Limite : {formatDateLimite(mission.dateLimite)}
              </Text>
            )}
          </View>
        </View>

        {(isActive || isOver) && (
          <View style={[
            styles.chronoBox,
            isDone    ? styles.chronoDone    :
            isFail    ? styles.chronoFail    :
            isRunning ? styles.chronoRunning :
                        styles.chronoPaused,
          ]}>
            <Text style={[
              styles.chronoText,
              isDone    ? { color: "#2e7d32" } :
              isFail    ? { color: "#c62828" } :
              isRunning ? { color: "#e65100" } :
                          { color: "#6b7280" },
            ]}>
              {isDone ? "✅ Mission terminée !" : isFail ? "❌ Mission échouée" : `⏱ ${formatElapsed(timer.elapsed)}`}
            </Text>
            {isActive && (
              <View style={[styles.chronoPulse, { backgroundColor: isRunning ? "#e65100" : "#9ca3af" }]} />
            )}
          </View>
        )}

        <View style={styles.bottomRow}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${pct}%` as any,
                backgroundColor: isDone ? "#4caf50" : isFail ? "#e53e3e" : cfg.progressColor,
              }]} />
            </View>
            <Text style={[styles.progressLabel, {
              color: isDone ? "#4caf50" : isFail ? "#e53e3e" : cfg.progressColor,
            }]}>
              {isDone ? "Terminé ✓" : isFail ? "Échoué ✗" : timer.state === "idle" ? "Non commencé" : `${pct}%`}
            </Text>
          </View>

          <View style={styles.btnGroup}>
            {isActive && (
              <TouchableOpacity style={styles.finishBtn} onPress={() => onFinish(mission.id)}>
                <Text style={styles.finishBtnText}>🏁</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.continueBtn, {
                backgroundColor: isDone ? "#4caf50" : isFail ? "#e53e3e" : cfg.btnBg,
              }]}
              onPress={handleBtnPress}
              disabled={isOver}
            >
              <Text style={styles.continueBtnText}>{getBtnLabel()}</Text>
            </TouchableOpacity>
          </View>
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

// ─────────────────────────────────────────────────────────────
//  MissionsScreen
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  SuggestedMissionBanner — carte de mission suggérée avec chrono
// ─────────────────────────────────────────────────────────────

type SuggestedTimerState = "running" | "paused" | "done";

function SuggestedMissionBanner({
  mission,
  onDismiss,
  onComplete,
}: {
  mission: MissionSuggestion;
  onDismiss: () => void;
  onComplete: (xp: number, coins: number, title: string) => void;
}) {
  const [elapsed, setElapsed]     = useState(0);
  const [state, setState]         = useState<SuggestedTimerState>("running");
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // Démarrer le chrono dès le montage
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePause = () => {
    if (state === "running") {
      setState("paused");
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (state === "paused") {
      setState("running");
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
  };

  const finish = () => {
    setState("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
    onComplete(mission.xpReward, mission.coinReward, mission.title);
  };

  const formatElapsedLocal = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isDone    = state === "done";
  const isRunning = state === "running";

  return (
    <View style={sugStyles.wrapper}>
      {/* Badge suggérée */}
      <View style={sugStyles.badge}>
        <Text style={sugStyles.badgeText}>✨ Mission suggérée</Text>
      </View>

      {/* Dismiss */}
      <TouchableOpacity style={sugStyles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={sugStyles.dismissText}>✕</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={sugStyles.header}>
        <View style={[sugStyles.iconBox, { backgroundColor: mission.color + "22" }]}>
          <Text style={sugStyles.icon}>{mission.emoji}</Text>
        </View>
        <View style={sugStyles.infoBox}>
          <Text style={sugStyles.title}>{mission.title}</Text>
          <Text style={sugStyles.description} numberOfLines={2}>{mission.description}</Text>
          <Text style={sugStyles.duration}>⏱ Durée estimée : {mission.duration}</Text>
        </View>
      </View>

      {/* Chrono */}
      <View style={[sugStyles.chronoBox, isDone ? sugStyles.chronoDone : isRunning ? sugStyles.chronoRunning : sugStyles.chronoPaused]}>
        <Text style={[sugStyles.chronoText, { color: isDone ? "#2e7d32" : isRunning ? "#e65100" : "#6b7280" }]}>
          {isDone ? "✅ Mission terminée !" : `⏱ ${formatElapsedLocal(elapsed)}`}
        </Text>
        {!isDone && (
          <View style={[sugStyles.pulse, { backgroundColor: isRunning ? "#e65100" : "#9ca3af" }]} />
        )}
      </View>

      {/* Boutons */}
      <View style={sugStyles.btnRow}>
        {!isDone && (
          <TouchableOpacity style={[sugStyles.finishBtn]} onPress={finish}>
            <Text style={sugStyles.finishBtnText}>🏁 Terminer</Text>
          </TouchableOpacity>
        )}
        {!isDone && (
          <TouchableOpacity
            style={[sugStyles.pauseBtn, { backgroundColor: isRunning ? "#f59e0b" : mission.color }]}
            onPress={togglePause}
          >
            <Text style={sugStyles.pauseBtnText}>{isRunning ? "⏸ Pause" : "▶ Continuer"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Récompenses */}
      <View style={sugStyles.rewardsRow}>
        <Text style={[sugStyles.xpChip, { color: mission.color }]}>+{mission.xpReward} XP</Text>
        <Text style={sugStyles.coinChip}>🪙 +{mission.coinReward}</Text>
        <Text style={sugStyles.impactChip}>📈 {mission.impact}</Text>
      </View>
    </View>
  );
}

const sugStyles = StyleSheet.create({
  wrapper:       { borderRadius: 20, backgroundColor: "#fff", padding: 16, marginBottom: 20, borderTopWidth: 4, borderTopColor: "#6d28d9", ...SHADOWS.medium, position: "relative" },
  badge:         { alignSelf: "flex-start", backgroundColor: "#ede9fe", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText:     { color: "#6d28d9", fontWeight: "700", fontSize: 11 },
  dismissBtn:    { position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", zIndex: 10 },
  dismissText:   { fontSize: 11, color: "#6b7280", fontWeight: "700" },
  header:        { flexDirection: "row", gap: 12, marginBottom: 12 },
  iconBox:       { width: 54, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  icon:          { fontSize: 26 },
  infoBox:       { flex: 1 },
  title:         { fontWeight: "800", fontSize: 16, color: "#1e1b4b", marginBottom: 4 },
  description:   { fontSize: 12, color: "#6b7280", lineHeight: 17, marginBottom: 4 },
  duration:      { fontSize: 11, color: "#9ca3af" },
  chronoBox:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  chronoRunning: { backgroundColor: "#fff8e1" },
  chronoPaused:  { backgroundColor: "#f3f4f6" },
  chronoDone:    { backgroundColor: "#e8f5e9" },
  chronoText:    { fontWeight: "700", fontSize: 14 },
  pulse:         { width: 8, height: 8, borderRadius: 4 },
  btnRow:        { flexDirection: "row", gap: 10, marginBottom: 10 },
  finishBtn:     { flex: 1, borderRadius: 14, paddingVertical: 9, backgroundColor: "#e8f5e9", alignItems: "center" },
  finishBtnText: { color: "#2e7d32", fontWeight: "700", fontSize: 13 },
  pauseBtn:      { flex: 1, borderRadius: 14, paddingVertical: 9, alignItems: "center" },
  pauseBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  rewardsRow:    { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  xpChip:        { fontSize: 11, fontWeight: "800", backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  coinChip:      { fontSize: 11, fontWeight: "700", backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  impactChip:    { fontSize: 11, fontWeight: "700", backgroundColor: "#dcfce7", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
});

// ─────────────────────────────────────────────────────────────
//  MissionsScreen
// ─────────────────────────────────────────────────────────────

export default function MissionsScreen() {
  const [activeTab, setActiveTab]                       = useState<Tab>("Tout");
  const [isMissionModalVisible, setMissionModalVisible] = useState(false);
  const [isEventModalVisible, setEventModalVisible]     = useState(false);
  const [selectedData, setSelectedData]                 = useState<any>(null);
  const { openCreate, suggestedMission: suggestedMissionParam } = useLocalSearchParams<{
    openCreate?: string;
    suggestedMission?: string;
  }>();

  // Mission suggérée reçue depuis le Dashboard/Homescreen
  const [activeSuggestedMission, setActiveSuggestedMission] = useState<MissionSuggestion | null>(null);
  const [suggestedStatusModal, setSuggestedStatusModal] = useState<{
    visible: boolean; xp: number; coins: number; title: string;
  }>({ visible: false, xp: 0, coins: 0, title: "" });

  const [searchQuery, setSearchQuery] = useState("");

  const { selectedModel, setSelectedModel } = useAvatar();
  const { userId, username: ctxUsername }   = useUser();

  const [displayName, setDisplayName] = useState<string>(ctxUsername || "...");

  useEffect(() => {
    if (openCreate === "true") {
      setSelectedData(null);
      setMissionModalVisible(true);
    }
  }, [openCreate]);

  // Lire et parser la mission suggérée depuis les params de navigation
  useEffect(() => {
    if (!suggestedMissionParam) return;
    try {
      // expo-router décode déjà les params — JSON.parse directement
      const parsed = JSON.parse(suggestedMissionParam) as MissionSuggestion;
      setActiveSuggestedMission(parsed);
    } catch (e) {
      console.error("Erreur parsing mission suggérée:", e);
    }
  }, [suggestedMissionParam]);

  useEffect(() => {
    if (!userId) return;
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, prenom, nom, avatar_url")
        .eq("id_user", userId)
        .single();

      if (error || !data) return;

      const name = data.username ?? data.prenom ?? data.nom ?? ctxUsername ?? "Joueur";
      setDisplayName(name);
      if (data.avatar_url) setSelectedModel(data.avatar_url);
    };
    fetchUserProfile();
  }, [userId, ctxUsername]);

  const {
    missions,
    loading,
    statusModal,
    exitModal,
    getTimer,
    handleStart,
    handlePause,
    handleFinish,
    handleDelete,
    buildEditPayload,
    loadMissions,
    reloadMissionsOnly,
    closeStatusModal,
    requestExit,
    handlePauseAndLeave,
    handleLeaveRunning,
    handleCancelExit,
  } = useMissions(userId !== null ? String(userId) : null);

  useFocusEffect(
    useCallback(() => {
      reloadMissionsOnly();
    }, [reloadMissionsOnly])
  );

  const filteredMissions = missions.filter((m) => {
    if (activeTab === "Urgent")         return m.urgent;
    if (activeTab === "Aujourd'hui")    return m.today;
    if (activeTab === "Défis")          return m.idDefi !== null;
    if (activeTab === "Par Événements") return m.event !== null;
    return true;
  }).filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  });

  const handleEdit = (mission: Mission) => {
    setSelectedData(buildEditPayload(mission));
    setMissionModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Missions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredMissions.length}</Text>
          </View>
        </View>

        {/* ── Barre de recherche ── */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une mission..."
            placeholderTextColor={COLORS.missionDuration}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
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

        {/* ── Mission suggérée avec chrono auto-démarré ── */}
        {activeSuggestedMission && (
          <SuggestedMissionBanner
            mission={activeSuggestedMission}
            onDismiss={() => setActiveSuggestedMission(null)}
            onComplete={(xp, coins, title) => {
              setActiveSuggestedMission(null);
              setSuggestedStatusModal({ visible: true, xp, coins, title });
            }}
          />
        )}

        {loading ? (
          <Text style={styles.emptyText}>Chargement...</Text>
        ) : filteredMissions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune mission trouvée</Text>
        ) : filteredMissions.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            timer={getTimer(m.id)}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onStart={handleStart}
            onPause={handlePause}
            onFinish={handleFinish}
          />
        ))}

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => { setSelectedData(null); setMissionModalVisible(true); }}
        >
          <Text style={styles.createBtnText}>＋  Créer mission</Text>
        </TouchableOpacity>
      </ScrollView>

      <MissionStatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        missionTitle={statusModal.missionTitle}
        dateLimit={statusModal.dateLimit}
        xp={statusModal.xp}
        coins={statusModal.coins}
        onClose={closeStatusModal}
      />

      {/* ── Modal réussite mission suggérée ── */}
      <MissionStatusModal
        visible={suggestedStatusModal.visible}
        type="success"
        missionTitle={suggestedStatusModal.title}
        dateLimit={undefined}
        xp={suggestedStatusModal.xp}
        coins={suggestedStatusModal.coins}
        onClose={() => setSuggestedStatusModal({ visible: false, xp: 0, coins: 0, title: "" })}
      />

      <CreateMissionModal
        visible={isMissionModalVisible}
        onClose={() => { setMissionModalVisible(false); setSelectedData(null); }}
        onSave={() => { loadMissions(); setSelectedData(null); setMissionModalVisible(false); }}
        initialData={selectedData}
      />

      <CreateEventModal
        visible={isEventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onCreate={() => { loadMissions(); setSelectedData(null); }}
        initialData={selectedData}
      />

      <ExitMissionModal
        visible={exitModal.visible}
        onPauseAndLeave={handlePauseAndLeave}
        onLeaveRunning={handleLeaveRunning}
        onCancel={handleCancelExit}
      />

      <Navbar
        active="missions"
        onChange={() => {}}
        onBeforeNavigate={requestExit}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.missionBg },
  scrollContent:     { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 150 },
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
  // ── Banners ──
  bannersRow:        { flexDirection: "row", gap: 8, marginBottom: 10 },
  urgentBanner:      { backgroundColor: COLORS.missionUrgentBg, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start" },
  urgentText:        { color: COLORS.missionUrgentText, fontWeight: "700", fontSize: 12 },
  defiBanner:        { backgroundColor: "#ede9fe", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start" },
  defiText:          { color: "#6d28d9", fontWeight: "700", fontSize: 12 },
  // ── Card content ──
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
  deadlineText:      { fontSize: 11, fontWeight: "700", marginTop: 4 },
  chronoBox:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  chronoRunning:     { backgroundColor: "#fff8e1" },
  chronoPaused:      { backgroundColor: "#f3f4f6" },
  chronoDone:        { backgroundColor: "#e8f5e9" },
  chronoFail:        { backgroundColor: "#fee2e2" },
  chronoText:        { fontWeight: "700", fontSize: 14 },
  chronoPulse:       { width: 8, height: 8, borderRadius: 4 },
  bottomRow:         { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  progressContainer: { flex: 1 },
  progressTrack:     { height: 8, borderRadius: 8, backgroundColor: COLORS.missionProgress },
  progressFill:      { height: "100%", borderRadius: 8 },
  progressLabel:     { fontSize: 11, fontWeight: "700", marginTop: 4 },
  btnGroup:          { flexDirection: "row", alignItems: "center", gap: 8 },
  finishBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center" },
  finishBtnText:     { fontSize: 18 },
  continueBtn:       { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 14 },
  continueBtnText:   { color: COLORS.background, fontWeight: "800", fontSize: 12 },
  createBtn:         { backgroundColor: COLORS.missionCreateBtn, borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText:     { color: COLORS.background, fontWeight: "800", fontSize: 17 },
  // ── Barre de recherche ──
  searchWrapper:     { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, ...SHADOWS.light },
  searchIcon:        { fontSize: 16, marginRight: 8 },
  searchInput:       { flex: 1, fontSize: 14, color: COLORS.missionHeading, padding: 0 },
  searchClear:       { fontSize: 13, color: COLORS.missionDuration, fontWeight: "700", marginLeft: 8 },
});