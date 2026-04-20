import { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Alert,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import CreateMissionModal from "../components/CreateMissionModal";
import CreateEventModal from "../components/CreateEventModal";
import MissionStatusModal from "../components/MissionStatusModals";
import { supabase } from "../constants/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useUser } from "../constants/UserContext";

type Difficulty = "Difficile" | "Moyen" | "Facile";
type TimerState = "idle" | "running" | "paused" | "done" | "fail";

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
  dateLimite: Date | null;
}

interface MissionTimer {
  state: TimerState;
  elapsed: number;
  validationId: number | null;
  startedAt: Date | null;
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
  return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
};

const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
};

const formatDateLimite = (date: Date): string =>
  date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ✅ Helper : met à jour le statut dans Supabase
const updateStatut = async (missionId: number, statut: TimerState) => {
  await supabase
    .from("mission")
    .update({ statut })
    .eq("id_mission", missionId);
};

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
  const cfg = difficultyConfig[mission.difficulty];
  const isDone    = timer.state === "done";
  const isFail    = timer.state === "fail";
  const isRunning = timer.state === "running";
  const isPaused  = timer.state === "paused";
  const isActive  = isRunning || isPaused;
  const isOver    = isDone || isFail;

  const estimatedSec = (parseDurationToMinutes(mission.duration) ?? 30) * 60;
  const pct = isOver ? 100 : Math.min(Math.round((timer.elapsed / estimatedSec) * 100), 99);

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

  const getDeadlineColor = () => {
    if (!mission.dateLimite) return "#6b7280";
    const diff = mission.dateLimite.getTime() - Date.now();
    if (diff < 0)                   return "#e53e3e";
    if (diff < 3600 * 1000)         return "#f97316";
    if (diff < 24 * 3600 * 1000)    return "#eab308";
    return "#16a34a";
  };

  return (
    <View style={styles.cardWrapper}>
      {mission.event ? (
        <View style={[styles.eventBadge, { backgroundColor: cfg.eventBg }]}>
          <Text style={styles.eventBadgeText}>{mission.event}</Text>
        </View>
      ) : <View style={styles.eventBadgeSpacer} />}

      <View style={[styles.card, { backgroundColor: isFail ? "rgba(255,235,235,0.95)" : cfg.cardBg }]}>
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
            {mission.dateLimite && (
              <Text style={[styles.deadlineText, { color: getDeadlineColor() }]}>
                🗓 Limite : {formatDateLimite(mission.dateLimite)}
              </Text>
            )}
          </View>
        </View>

        {(isActive || isOver) && (
          <View style={[
            styles.chronoBox,
            isDone    ? styles.chronoDone :
            isFail    ? styles.chronoFail :
            isRunning ? styles.chronoRunning :
                        styles.chronoPaused
          ]}>
            <Text style={[
              styles.chronoText,
              isDone    ? { color: "#2e7d32" } :
              isFail    ? { color: "#c62828" } :
              isRunning ? { color: "#e65100" } :
                          { color: "#6b7280" }
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

export default function MissionsScreen() {
  const { userId } = useUser();
  const [activeTab, setActiveTab]               = useState<Tab>("Tout");
  const [isMissionModalVisible, setMissionModalVisible] = useState(false);
  const [isEventModalVisible,   setEventModalVisible]   = useState(false);
  const [selectedData, setSelectedData]         = useState<any>(null);
  const [missions, setMissions]                 = useState<Mission[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [timers, setTimers]                     = useState<Record<number, MissionTimer>>({});
  const intervalRefs                            = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const missionsRef = useRef<Mission[]>([]);
  useEffect(() => { missionsRef.current = missions; }, [missions]);

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    type: "success" | "fail";
    missionTitle: string;
    dateLimit?: string;
  }>({ visible: false, type: "success", missionTitle: "" });

  // ✅ Vérification deadlines toutes les minutes
  useEffect(() => {
    const deadlineInterval = setInterval(() => {
      setTimers(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;

        missionsRef.current.forEach(mission => {
          if (!mission.dateLimite) return;
          const t = prev[mission.id];
          if (mission.dateLimite.getTime() < now && (!t || (t.state !== "done" && t.state !== "fail"))) {
            if (intervalRefs.current[mission.id]) clearInterval(intervalRefs.current[mission.id]);
            updated[mission.id] = {
              ...(t ?? { elapsed: 0, validationId: null, startedAt: null }),
              state: "fail",
            };
            changed = true;

            // ✅ Sync Supabase statut = "fail"
            updateStatut(mission.id, "fail");

            setStatusModal({
              visible: true,
              type: "fail",
              missionTitle: mission.title,
              dateLimit: formatDateLimite(mission.dateLimite),
            });
          }
        });

        return changed ? updated : prev;
      });
    }, 60_000);

    return () => clearInterval(deadlineInterval);
  }, []);

  useEffect(() => {
    return () => { Object.values(intervalRefs.current).forEach(clearInterval); };
  }, []);

  useFocusEffect(useCallback(() => { fetchMissions(); }, []));

  const getTimer = (id: number): MissionTimer =>
    timers[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null };

  const setTimer = (id: number, update: Partial<MissionTimer>) =>
    setTimers(prev => ({ ...prev, [id]: { ...(prev[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null }), ...update } }));

  // ── FINISH → success ──
  const handleFinish = async (missionId: number) => {
    const t = getTimer(missionId);
    clearInterval(intervalRefs.current[missionId]);

    const now = new Date();
    const xp  = Math.max(10, Math.round(t.elapsed / 60) * 2);

    if (t.validationId) {
      const { error } = await supabase
        .from("mission_validation")
        .update({ date_fin: now.toISOString(), xp_obtenu: xp })
        .eq("id_validation", t.validationId);
      if (error) { Alert.alert("Erreur", error.message); return; }
    }

    // ✅ Sync Supabase statut = "done"
    await updateStatut(missionId, "done");
    setTimer(missionId, { state: "done" });

    const mission = missionsRef.current.find(m => m.id === missionId);
    setStatusModal({ visible: true, type: "success", missionTitle: mission?.title ?? "" });
  };

  // ── START / RESUME ──
  const handleStart = async (missionId: number) => {
    const t = getTimer(missionId);

    if (t.state === "idle") {
      const now = new Date();
      const { data, error } = await supabase
        .from("mission_validation")
        .insert({ id_user: userId, id_mission: missionId, date_debut: now.toISOString() })
        .select("id_validation")
        .single();

      if (error) { Alert.alert("Erreur", error.message); return; }

      setTimer(missionId, { state: "running", elapsed: 0, validationId: data.id_validation, startedAt: now });
    } else {
      setTimer(missionId, { state: "running" });
    }

    // ✅ Sync Supabase statut = "running"
    await updateStatut(missionId, "running");

    if (intervalRefs.current[missionId]) clearInterval(intervalRefs.current[missionId]);

    intervalRefs.current[missionId] = setInterval(() => {
      setTimers(prev => {
        const cur = prev[missionId];
        if (!cur || cur.state !== "running") return prev;

        const newElapsed = cur.elapsed + 1;
        const mission = missionsRef.current.find(m => m.id === missionId);
        const estimatedSec = (parseDurationToMinutes(mission?.duration ?? "0h30") ?? 30) * 60;

        if (newElapsed >= estimatedSec) {
          clearInterval(intervalRefs.current[missionId]);
          setTimeout(() => handleFinish(missionId), 0);
        }

        return { ...prev, [missionId]: { ...cur, elapsed: newElapsed } };
      });
    }, 1000);
  };

  // ── PAUSE ──
  const handlePause = async (missionId: number) => {
    clearInterval(intervalRefs.current[missionId]);
    // ✅ Sync Supabase statut = "paused"
    await updateStatut(missionId, "paused");
    setTimer(missionId, { state: "paused" });
  };

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mission")
        .select(`id_mission, titre, description, duree_min, difficulte, priorite, id_boss, date_limite, statut, boss_events ( nom )`)
        .order("id_mission", { ascending: false });

      if (error) throw error;

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const { data: validations } = await supabase
        .from("mission_validation")
        .select("id_mission")
        .gte("date_debut", todayStart.toISOString())
        .lte("date_debut", todayEnd.toISOString());

      const todayIds = new Set((validations ?? []).map((v: any) => v.id_mission));

      const mapped: Mission[] = (data ?? []).map((m: any) => ({
        id:          m.id_mission,
        event:       m.id_boss != null ? (m.boss_events?.nom ?? "Événement") : null,
        title:       m.titre ?? "Sans titre",
        duration:    m.duree_min ? `${Math.floor(m.duree_min / 60)}h${String(m.duree_min % 60).padStart(2, "0")}` : "-",
        description: m.description ?? "",
        difficulty:  mapDifficulty(m.difficulte ?? 1),
        progress:    0,
        urgent:      (m.priorite ?? 1) >= 4,
        today:       todayIds.has(m.id_mission),
        dateLimite:  m.date_limite ? new Date(m.date_limite) : null,
      }));

      setMissions(mapped);

      // ✅ Restaurer les timers depuis le statut Supabase + vérifier deadlines
      const now = Date.now();
      setTimers(prev => {
        const updated = { ...prev };

        (data ?? []).forEach((m: any) => {
          const existingTimer = prev[m.id_mission];
          // Ne pas écraser un timer déjà actif en mémoire
          if (existingTimer && (existingTimer.state === "running" || existingTimer.state === "paused")) return;

          const dateLimite = m.date_limite ? new Date(m.date_limite) : null;

          // Deadline dépassée → fail automatique
          if (dateLimite && dateLimite.getTime() < now && m.statut !== "done" && m.statut !== "fail") {
            updateStatut(m.id_mission, "fail");
            updated[m.id_mission] = { state: "fail", elapsed: 0, validationId: null, startedAt: null };
            return;
          }

          // Restaurer depuis Supabase
          if (m.statut === "done" || m.statut === "fail") {
            updated[m.id_mission] = {
              ...(existingTimer ?? { elapsed: 0, validationId: null, startedAt: null }),
              state: m.statut,
            };
          }
        });

        return updated;
      });

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
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          clearInterval(intervalRefs.current[id]);
          const { error } = await supabase.from("mission").delete().eq("id_mission", id);
          if (error) Alert.alert("Erreur", error.message);
          else {
            setMissions(prev => prev.filter(m => m.id !== id));
            setTimers(prev => { const n = { ...prev }; delete n[id]; return n; });
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
      difficulte:  mission.difficulty === "Difficile" ? 3 : mission.difficulty === "Moyen" ? 2 : 1,
      priorite:    mission.urgent ? 4 : 2,
      date_limite: mission.dateLimite?.toISOString() ?? null,
    });
    setMissionModalVisible(true);
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
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <TouchableOpacity style={styles.createBtn} onPress={() => { setSelectedData(null); setMissionModalVisible(true); }}>
          <Text style={styles.createBtnText}>＋  Créer mission</Text>
        </TouchableOpacity>
      </ScrollView>

      <MissionStatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        missionTitle={statusModal.missionTitle}
        dateLimit={statusModal.dateLimit}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />

      <CreateMissionModal
        visible={isMissionModalVisible}
        onClose={() => { setMissionModalVisible(false); setSelectedData(null); }}
        onSave={() => { fetchMissions(); setSelectedData(null); setMissionModalVisible(false); }}
        initialData={selectedData}
      />

      <CreateEventModal
        visible={isEventModalVisible}
        onClose={() => setEventModalVisible(false)}
        onCreate={() => { fetchMissions(); setSelectedData(null); }}
        initialData={selectedData}
      />

      <Navbar active="missions" onChange={() => {}} />
    </View>
  );
}

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
});
