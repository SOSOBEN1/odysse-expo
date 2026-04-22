// screens/ProgressionDefiScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ajouterTempsEtude,
  calculerEtSauvegarderScore,
  getClassementDefi,
  getDefiById,
  getMissionsDefi,
  getParticipantsDefi,
} from "../../../backend/DefisService";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  id: number;
  name: string;
  minutes: number;
  avatar: string;
  score?: number;
}

interface MissionItem {
  id: number;
  title: string;
  description: string;
  accomplishedBy: string;
  status: "completed" | "in_progress" | "pending";
  progress?: number;
  timeInfo?: string;
  xp_gain?: number;
  difficulte?: number;
}

interface ClassementItem {
  rang: number;
  name: string;
  score: number;
  avatar: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatMinutes = (mins: number) => {
  if (mins <= 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

const AVATAR_COLORS = [
  "#E8A4C8", "#B39DDB", "#F48FB1", "#90CAF9", "#A5D6A7", "#FFCC80",
];
const MEDAL = ["🥇", "🥈", "🥉"];

// ─── ObjectiveCard ────────────────────────────────────────────────────────────
function ObjectiveCard({ mission, index }: { mission: MissionItem; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 80, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  const isCompleted  = mission.status === "completed";
  const isInProgress = mission.status === "in_progress";
  const isPending    = mission.status === "pending";

  return (
    <Animated.View style={[
      styles.objCard,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [15,0] }) }] },
      isCompleted  && styles.objCardCompleted,
      isInProgress && styles.objCardInProgress,
    ]}>
      {/* Icône statut */}
      <View style={[
        styles.objIconWrap,
        isCompleted  && styles.objIconCompleted,
        isInProgress && styles.objIconInProgress,
        isPending    && styles.objIconPending,
      ]}>
        {isCompleted  && <Ionicons name="checkmark"        size={16} color="#fff" />}
        {isInProgress && <Ionicons name="time-outline"     size={16} color="#fff" />}
        {isPending    && <Ionicons name="ellipse-outline"  size={18} color={COLORS.primaryLight} />}
      </View>

      <View style={styles.objInfo}>
        <Text style={styles.objTitle} numberOfLines={1}>{mission.title}</Text>
        {mission.description ? (
          <Text style={styles.objSub} numberOfLines={2}>{mission.description}</Text>
        ) : null}
        {isCompleted && (
          <Text style={styles.objAccomplishedBy}>✅ {mission.accomplishedBy}</Text>
        )}
        {isInProgress && (
          <Text style={styles.objAccomplishedBy}>⏳ En cours...</Text>
        )}
      </View>

      <View style={styles.objRight}>
        {isCompleted && mission.timeInfo ? (
          <>
            <Text style={styles.objCompletedLabel}>Complété</Text>
            <Text style={styles.objTimeInfo}>{mission.timeInfo}</Text>
          </>
        ) : null}
        {isInProgress && mission.progress !== undefined ? (
          <View style={styles.progressCircle}>
            <Text style={styles.progressCircleText}>{mission.progress}%</Text>
          </View>
        ) : null}
        {mission.xp_gain ? (
          <Text style={styles.objXp}>+{mission.xp_gain} XP</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── ClassementRow ────────────────────────────────────────────────────────────
function ClassementRow({ item, index }: { item: ClassementItem; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <View style={[styles.rankRow, index === 0 && styles.rankRowFirst]}>
      <Text style={styles.rankMedal}>{MEDAL[index] ?? `${index + 1}.`}</Text>
      <View style={[styles.rankAvatar, { backgroundColor: color }]}>
        <Text style={styles.rankAvatarText}>
          {item.avatar ? item.avatar.slice(0, 2).toUpperCase() : "??"}
        </Text>
      </View>
      <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.rankScoreBadge}>
        <Text style={styles.rankScore}>{item.score} pts</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProgressionDefiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useUser();

  const id_defi   = params.defiId   ? Number(params.defiId)   : 0;
  const defi_nom  = params.defiNom  ? String(params.defiNom)  : "Défi";
  const defi_desc = params.defiDesc ? String(params.defiDesc) : "";

  // ── State ──────────────────────────────────────────────────────────────────
  type TabType = "missions" | "classement";
  const [activeTab,    setActiveTab]    = useState<TabType>("missions");
  const [activeNav,    setActiveNav]    = useState("defis");
  const [loading,      setLoading]      = useState(true);
  const [savingScore,  setSavingScore]  = useState(false);
  const [showAddTime,  setShowAddTime]  = useState(false);
  const [addMinutes,   setAddMinutes]   = useState("");
  const [selectedMission, setSelectedMission] = useState<MissionItem | null>(null);

  const [defiInfo,      setDefiInfo]      = useState<any>(null);
  const [participants,  setParticipants]  = useState<Participant[]>([]);
  const [missions,      setMissions]      = useState<MissionItem[]>([]);
  const [classement,    setClassement]    = useState<ClassementItem[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // ── Chargement ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    await Promise.all([chargerDefi(), chargerMissions(), chargerParticipants(), chargerClassement()]);
    setLoading(false);
  };

  const chargerDefi = async () => {
    const { data } = await getDefiById(id_defi);
    if (data) setDefiInfo(data);
  };

  const chargerMissions = async () => {
    const { data } = await getMissionsDefi(id_defi);
    if (data) {
      setMissions(data.map((m: any) => ({
        id:             m.id_mission,
        title:          m.titre ?? "Mission",
        description:    m.description ?? "",
        accomplishedBy: m.users?.prenom ?? "—",
        status:
          m.statut === "termine"   ? "completed"  :
          m.statut === "en_cours"  ? "in_progress" : "pending",
        progress:   m.progression ?? undefined,
        timeInfo:   m.duree_min ? `${m.duree_min} min` : undefined,
        xp_gain:    m.xp_gain,
        difficulte: m.difficulte,
      })));
    }
  };

  const chargerParticipants = async () => {
    const { data } = await getParticipantsDefi(id_defi);
    if (!data) return;

    // Grouper par user
    const map = new Map<number, Participant>();
    data.forEach((v: any) => {
      const uid = v.id_user;
      if (!map.has(uid)) {
        map.set(uid, {
          id:      uid,
          name:    v.users?.prenom ?? "?",
          minutes: 0,
          avatar:  v.users?.prenom?.slice(0, 2).toUpperCase() ?? "??",
        });
      }
      const p = map.get(uid)!;
      p.minutes += v.mission?.duree_min ?? 0;
    });
    setParticipants([...map.values()].sort((a, b) => b.minutes - a.minutes));
  };

  const chargerClassement = async () => {
    const { data } = await getClassementDefi(id_defi);
    if (data) {
      setClassement(data.map((r: any, i: number) => ({
        rang:   i + 1,
        name:   r.users?.prenom ?? "?",
        score:  r.score ?? 0,
        avatar: r.users?.prenom?.slice(0, 2).toUpperCase() ?? "??",
      })));
    }
  };

  // ── Ajouter du temps ───────────────────────────────────────────────────────
  const handleAddTime = async () => {
    const mins = parseInt(addMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert("Erreur", "Entre un nombre de minutes valide.");
      return;
    }
    if (!selectedMission) {
      Alert.alert("Erreur", "Sélectionne une mission.");
      return;
    }
    if (!userId) return;

    // XP proportionnel à la durée (formule simplifiée)
    const diff    = selectedMission.difficulte ?? 1;
    const xp_gain = Math.round((mins / (selectedMission.timeInfo ? parseInt(selectedMission.timeInfo) || 30 : 30)) * (selectedMission.xp_gain ?? 10));

    const { error } = await ajouterTempsEtude(userId, selectedMission.id, mins, xp_gain);

    if (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer le temps.");
    } else {
      setAddMinutes("");
      setShowAddTime(false);
      setSelectedMission(null);
      await chargerDonnees();
    }
  };

  // ── Calculer & sauvegarder le score ───────────────────────────────────────
  const handleSauvegarderScore = async () => {
    if (!userId || !defiInfo) return;
    setSavingScore(true);
    const { data: validations } = await getParticipantsDefi(id_defi);
    const mesValidations = (validations ?? []).filter((v: any) => v.id_user === userId);
    await calculerEtSauvegarderScore(
      id_defi,
      userId,
      mesValidations,
      defiInfo.date_debut,
      defiInfo.date_fin ?? new Date().toISOString(),
    );
    await chargerClassement();
    setSavingScore(false);
    Alert.alert("✅ Score sauvegardé !", "Ton score a été enregistré dans le classement.");
    setActiveTab("classement");
  };

  // ── Calcul progression ────────────────────────────────────────────────────
  const objectif_minutes = defiInfo?.objectif_minutes ?? 120;
  const totalMinutes     = participants.reduce((s, p) => s + p.minutes, 0);
  const progressRatio    = Math.min(totalMinutes / objectif_minutes, 1);
  const totalH           = Math.floor(totalMinutes / 60);
  const totalM           = totalMinutes % 60;
  const goalH            = Math.floor(objectif_minutes / 60);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={["#D8CCFF", "#E8DFFA", "#EDE8FB"]} style={styles.gradient}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-16,0] }) }],
        }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{defi_nom}</Text>
            {defi_desc ? <Text style={styles.headerSubtitle} numberOfLines={1}>{defi_desc}</Text> : null}
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={chargerDonnees}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement du défi...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Carte progression ── */}
            <View style={[styles.progressCard, SHADOWS.light]}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Temps étudié</Text>
                  <Text style={styles.progressValue}>
                    {totalH > 0 ? `${totalH}h${totalM > 0 ? String(totalM).padStart(2,"0") : ""}` : `${totalM} min`}
                    <Text style={styles.progressGoal}> / {goalH}h</Text>
                  </Text>
                </View>
                <View style={styles.progressPct}>
                  <Text style={styles.progressPctText}>{Math.round(progressRatio * 100)}%</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#664e97", "#906ce6", "#c182de"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]}
                />
              </View>

              {/* Participants */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={styles.participantsRow}>
                  {participants.length === 0 ? (
                    <Text style={styles.noDataText}>Aucun participant actif pour l'instant</Text>
                  ) : participants.map((p, i) => (
                    <View key={p.id} style={styles.participantItem}>
                      <View style={[styles.avatarCircle, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                        <Text style={styles.avatarText}>{p.avatar}</Text>
                      </View>
                      <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.participantTime}>{formatMinutes(p.minutes)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Boutons */}
              <View style={styles.cardBtnsRow}>
                <TouchableOpacity
                  style={styles.addTimeBtn}
                  onPress={() => setShowAddTime(true)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGrad}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Ajouter du temps</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.scoreBtn, savingScore && { opacity: 0.5 }]}
                  onPress={handleSauvegarderScore}
                  disabled={savingScore}
                  activeOpacity={0.85}
                >
                  {savingScore
                    ? <ActivityIndicator size="small" color={COLORS.primary} />
                    : <Text style={styles.scoreBtnText}>💾 Mon score</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabRow}>
              {(["missions", "classement"] as TabType[]).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === "missions" ? "📋 Missions" : "🏆 Classement"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Contenu tabs ── */}
            {activeTab === "missions" ? (
              <View style={styles.list}>
                {missions.length === 0 ? (
                  <Text style={styles.noDataText}>Aucune mission dans ce défi.</Text>
                ) : missions.map((m, i) => (
                  <ObjectiveCard key={m.id} mission={m} index={i} />
                ))}
              </View>
            ) : (
              <View style={styles.list}>
                {classement.length === 0 ? (
                  <View style={styles.emptyClassement}>
                    <Text style={styles.emptyClassementIcon}>🏆</Text>
                    <Text style={styles.emptyClassementTitle}>Classement vide</Text>
                    <Text style={styles.emptyClassementSub}>
                      Les scores apparaîtront ici une fois que les participants auront sauvegardé leur progression.
                    </Text>
                  </View>
                ) : classement.map((item, i) => (
                  <ClassementRow key={i} item={item} index={i} />
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* ── Modal ajouter du temps ── */}
        <Modal visible={showAddTime} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddTime(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ajouter du temps d'étude</Text>

            {/* Sélection de la mission */}
            <Text style={styles.modalLabel}>Mission concernée</Text>
            <ScrollView style={styles.missionPicker} showsVerticalScrollIndicator={false}>
              {missions.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.missionPickerItem, selectedMission?.id === m.id && styles.missionPickerItemSelected]}
                  onPress={() => setSelectedMission(m)}
                >
                  <Text style={[styles.missionPickerText, selectedMission?.id === m.id && styles.missionPickerTextSelected]}>
                    {m.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Minutes étudiées</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="ex: 45"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={addMinutes}
              onChangeText={setAddMinutes}
            />

            {addMinutes && !isNaN(parseInt(addMinutes)) ? (
              <View style={styles.xpPreview}>
                <Text style={styles.xpPreviewText}>
                  ≈ +{Math.round(parseInt(addMinutes) / 30 * (selectedMission?.xp_gain ?? 10))} XP estimés
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTime}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                <Text style={styles.btnText}>Confirmer</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowAddTime(false); setSelectedMission(null); }}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Navbar active={activeNav} onChange={setActiveNav} />
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#D8CCFF" },
  gradient: { flex: 1 },

  header: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: SIZES.padding,
    paddingTop:        Platform.OS === "android" ? 50 : 58,
    paddingBottom:     10,
    gap:               10,
  },
  headerCenter:   { flex: 1 },
  headerTitle:    { fontSize: 17, fontWeight: "800", color: "#17063B" },
  headerSubtitle: { fontSize: 12, color: "rgba(100,70,160,0.6)", marginTop: 1 },
  refreshBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.8)",
                    alignItems: "center", justifyContent: "center", ...SHADOWS.light },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "rgba(100,70,160,0.6)", fontWeight: "600" },

  scroll: { paddingHorizontal: SIZES.padding, paddingTop: 10 },

  // ── Progress card ──
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius:    SIZES.radiusLg,
    padding:         16,
    marginBottom:    14,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  progressTitle:  { fontSize: 12, color: "rgba(100,70,160,0.6)", fontWeight: "600", marginBottom: 2 },
  progressValue:  { fontSize: 26, fontWeight: "800", color: "#17063B" },
  progressGoal:   { fontSize: 14, color: "rgba(100,70,160,0.5)", fontWeight: "600" },
  progressPct: {
    backgroundColor: COLORS.primary,
    borderRadius:    20,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  progressPctText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  progressTrack: {
    height:          10,
    backgroundColor: "rgba(180,160,220,0.25)",
    borderRadius:    5,
    overflow:        "hidden",
    marginBottom:    14,
  },
  progressFill: { height: "100%", borderRadius: 5 },

  participantsRow: { flexDirection: "row", gap: 14, paddingVertical: 4, paddingHorizontal: 2 },
  participantItem: { alignItems: "center", gap: 4, width: 58 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:       { fontSize: 16, fontWeight: "800", color: "#fff" },
  participantName:  { fontSize: 11, fontWeight: "700", color: "#3D1F7A", textAlign: "center", width: 58 },
  participantTime:  { fontSize: 10, color: "rgba(100,70,160,0.6)" },

  cardBtnsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  addTimeBtn:  { flex: 2, borderRadius: 32, overflow: "hidden" },
  scoreBtn: {
    flex: 1, borderRadius: 32, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  scoreBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  btnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center",
             paddingVertical: 11, paddingHorizontal: 14, borderRadius: 32 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  noDataText: { fontSize: 13, color: "rgba(100,70,160,0.5)", textAlign: "center", padding: 20 },

  // ── Tabs ──
  tabRow: {
    flexDirection:    "row",
    backgroundColor:  "rgba(255,255,255,0.7)",
    borderRadius:     SIZES.radiusLg,
    padding:          4,
    marginBottom:     12,
    ...SHADOWS.light,
  },
  tab:           { flex: 1, paddingVertical: 9, borderRadius: SIZES.radius, alignItems: "center" },
  tabActive:     { backgroundColor: "rgba(149,116,224,0.15)" },
  tabText:       { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },

  list: { gap: 10 },

  // ── Objective cards ──
  objCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius:    SIZES.radiusLg,
    padding:         14,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             10,
    borderWidth:     1,
    borderColor:     "transparent",
    ...SHADOWS.light,
  },
  objCardCompleted:  { borderColor: "rgba(34,197,94,0.25)", backgroundColor: "rgba(240,255,244,0.9)" },
  objCardInProgress: { borderColor: "rgba(149,116,224,0.3)" },

  objIconWrap:       { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  objIconCompleted:  { backgroundColor: "#22c55e" },
  objIconInProgress: { backgroundColor: COLORS.primary },
  objIconPending:    { backgroundColor: "rgba(180,160,220,0.2)" },

  objInfo:           { flex: 1 },
  objTitle:          { fontSize: 13, fontWeight: "700", color: "#17063B", marginBottom: 2 },
  objSub:            { fontSize: 11, color: "rgba(100,70,160,0.6)", lineHeight: 15 },
  objAccomplishedBy: { fontSize: 11, color: "rgba(100,70,160,0.7)", marginTop: 3, fontWeight: "600" },

  objRight:          { alignItems: "flex-end", gap: 4, minWidth: 60 },
  objCompletedLabel: { fontSize: 11, fontWeight: "700", color: "#22c55e" },
  objTimeInfo:       { fontSize: 11, color: "rgba(100,70,160,0.6)" },
  objXp:             { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  progressCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 3, borderColor: COLORS.primary,
    backgroundColor: "rgba(149,116,224,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  progressCircleText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  // ── Classement ──
  rankRow: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius:    SIZES.radiusLg,
    padding:         12,
    gap:             10,
    ...SHADOWS.light,
  },
  rankRowFirst: { backgroundColor: "rgba(255,215,0,0.12)", borderWidth: 1, borderColor: "rgba(255,180,0,0.3)" },
  rankMedal:    { fontSize: 22, width: 30, textAlign: "center" },
  rankAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  rankAvatarText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  rankName:       { flex: 1, fontSize: 14, fontWeight: "700", color: "#17063B" },
  rankScoreBadge: {
    backgroundColor: COLORS.primary,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  rankScore: { color: "#fff", fontSize: 12, fontWeight: "800" },

  emptyClassement:      { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyClassementIcon:  { fontSize: 48 },
  emptyClassementTitle: { fontSize: 18, fontWeight: "800", color: "#17063B" },
  emptyClassementSub:   { fontSize: 13, color: "rgba(100,70,160,0.6)", textAlign: "center", lineHeight: 18 },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    backgroundColor:       "#fff",
    borderTopLeftRadius:   SIZES.radiusLg,
    borderTopRightRadius:  SIZES.radiusLg,
    padding:               24,
    paddingBottom:         40,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#17063B", marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 8 },

  missionPicker: { maxHeight: 140, marginBottom: 4 },
  missionPickerItem: {
    paddingVertical:   10,
    paddingHorizontal: 12,
    borderRadius:      10,
    marginBottom:      4,
    backgroundColor:   "rgba(180,160,220,0.1)",
  },
  missionPickerItemSelected: { backgroundColor: `${COLORS.primary}20`, borderWidth: 1, borderColor: COLORS.primary },
  missionPickerText:         { fontSize: 13, color: "#3D1F7A", fontWeight: "500" },
  missionPickerTextSelected: { color: COLORS.primary, fontWeight: "700" },

  timeInput: {
    borderWidth:     1.5,
    borderColor:     "rgba(180,160,220,0.4)",
    borderRadius:    SIZES.radius,
    padding:         12,
    fontSize:        16,
    color:           "#17063B",
    fontWeight:      "600",
    marginBottom:    8,
  },
  xpPreview: {
    backgroundColor: "rgba(149,116,224,0.1)",
    borderRadius:    10,
    padding:         10,
    marginBottom:    12,
    alignItems:      "center",
  },
  xpPreviewText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  modalConfirmBtn: { borderRadius: 32, overflow: "hidden", marginBottom: 10 },
  modalCancelBtn:  { alignItems: "center", paddingVertical: 10 },
  modalCancelText: { fontSize: 14, color: "rgba(100,70,160,0.5)", fontWeight: "600" },
});