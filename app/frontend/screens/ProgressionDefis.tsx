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
import Svg, { Path } from "react-native-svg";

import {
  StatCibleKey,
  addTempsEtudie,
  cocherMission,
  getDefiDetail,
  getMissions,
  getMissionsCompleteesPar,
  getParticipants,
  getStatsCiblesDuDefi,
  getStatsUtilisateur,
  verifierVictoireDefi,
} from "../../../backend/ProgressionService";

import { inviterAmi } from "../../../backend/InvitationService";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MissionItem {
  id:           number;
  title:        string;
  description:  string;
  duree:        number;
  statut:       "completed" | "in_progress" | "pending";
  progression:  number;
  xp_base:      number;
  difficulte:   number;
  priorite:     number;
  type_mission: string;
  cocheeParMoi: boolean;
  xp_gagne_moi?: number;
}

interface Participant {
  id_user:         number;
  nom:             string;
  prenom?:         string;
  minutes_etudies: number;
  avatar_color:    string;
  score:           number;
  xp_total:        number;
}

interface ClassementItem {
  rang:        number;
  id_user:     number;
  nom:         string;
  score_final: number;
  xp_total:    number;
}

// ─── Config stats cibles ──────────────────────────────────────────────────────

const STAT_CONFIG: Record<StatCibleKey, { label: string; color: string; icon: string; bonusLabel: string }> = {
  energie:      { label: "Énergie",      color: "#F5A623", icon: "⚡", bonusLabel: "+50% énergie" },
  stress:       { label: "Stress",       color: "#E57373", icon: "🧘", bonusLabel: "−50% stress" },
  connaissance: { label: "Connaissance", color: "#5B8DEF", icon: "📚", bonusLabel: "+50% connaissance" },
  organisation: { label: "Organisation", color: "#4CAF50", icon: "📋", bonusLabel: "+50% organisation" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMinutes = (mins: number) => {
  if (mins <= 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

const AVATAR_COLORS = ["#E8A4C8", "#B39DDB", "#F48FB1", "#90CAF9", "#A5D6A7", "#FFCC80", "#80DEEA"];
const MEDAL         = ["🥇", "🥈", "🥉"];

const getInitials = (nom: string, prenom?: string) => {
  if (prenom) return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
  const parts = nom.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return nom.slice(0, 2).toUpperCase();
};

// ─── StatsCiblesBar ───────────────────────────────────────────────────────────
// Barre affichant les stats cibles du défi et le bonus ×1.5 associé

function StatsCiblesBar({ statsCibles }: { statsCibles: StatCibleKey[] }) {
  if (statsCibles.length === 0) return null;
  return (
    <View style={scbStyles.container}>
      <Text style={scbStyles.title}>✨ Stats cibles de ce défi</Text>
      <Text style={scbStyles.subtitle}>Chaque mission te donne un bonus ×1.5 sur :</Text>
      <View style={scbStyles.row}>
        {statsCibles.map(key => {
          const cfg = STAT_CONFIG[key];
          return (
            <View key={key} style={[scbStyles.chip, { borderColor: cfg.color }]}>
              <Text style={scbStyles.chipIcon}>{cfg.icon}</Text>
              <View>
                <Text style={[scbStyles.chipLabel, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={scbStyles.chipBonus}>{cfg.bonusLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const scbStyles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.88)", borderRadius: SIZES.radiusLg,
    padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: `${COLORS.primary}25`,
  },
  title:    { fontSize: 13, fontWeight: "800", color: "#17063B", marginBottom: 2 },
  subtitle: { fontSize: 11, color: "rgba(100,70,160,0.6)", marginBottom: 10 },
  row:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  chipIcon:  { fontSize: 16 },
  chipLabel: { fontSize: 12, fontWeight: "800" },
  chipBonus: { fontSize: 10, color: "rgba(100,70,160,0.6)", fontWeight: "600" },
});

// ─── BonusToast ───────────────────────────────────────────────────────────────
// Toast qui apparaît après avoir coché une mission, montrant XP + stats boostées

function BonusToast({
  visible, xp, statsCibles,
}: {
  visible: boolean; xp: number; statsCibles: StatCibleKey[];
}) {
  const opac = useRef(new Animated.Value(0)).current;
  const ty   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opac.setValue(1); ty.setValue(0);
      Animated.parallel([
        Animated.timing(opac, { toValue: 0, duration: 2200, useNativeDriver: true, delay: 800 }),
        Animated.timing(ty,   { toValue: -60, duration: 2500, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[btStyles.toast, { opacity: opac, transform: [{ translateY: ty }] }]}>
      <Text style={btStyles.xp}>+{xp} XP ⚡</Text>
      {statsCibles.length > 0 && (
        <Text style={btStyles.bonus}>
          Bonus ×1.5 : {statsCibles.map(k => STAT_CONFIG[k].icon).join(" ")}
        </Text>
      )}
    </Animated.View>
  );
}

const btStyles = StyleSheet.create({
  toast: {
    position: "absolute", bottom: 200, alignSelf: "center",
    backgroundColor: COLORS.primary, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 12,
    zIndex: 999, alignItems: "center", ...SHADOWS.light,
  },
  xp:    { color: "#fff", fontWeight: "800", fontSize: 18 },
  bonus: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", marginTop: 2 },
});

// ─── VictoireModal ────────────────────────────────────────────────────────────

function VictoireModal({ visible, gagnant, onClose }: {
  visible: boolean; gagnant: ClassementItem | null; onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else { scaleAnim.setValue(0.6); opacAnim.setValue(0); }
  }, [visible]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={vicStyles.overlay}>
        <Animated.View style={[vicStyles.card, { opacity: opacAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={vicStyles.trophy}>🏆</Text>
          <Text style={vicStyles.title}>Défi terminé !</Text>
          <Text style={vicStyles.subtitle}>Objectif atteint par l'équipe 🎉</Text>
          {gagnant && (
            <View style={vicStyles.winnerBox}>
              <Text style={vicStyles.winnerLabel}>Gagnant</Text>
              <Text style={vicStyles.winnerName}>{gagnant.nom}</Text>
              <Text style={vicStyles.winnerScore}>{gagnant.score_final} pts</Text>
            </View>
          )}
          <TouchableOpacity style={vicStyles.btn} onPress={onClose}>
            <Text style={vicStyles.btnText}>Voir le classement 🏆</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const vicStyles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 28 },
  card:        { backgroundColor: "#fff", borderRadius: 28, padding: 32, alignItems: "center", width: "100%", shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 24, elevation: 20 },
  trophy:      { fontSize: 64, marginBottom: 12 },
  title:       { fontSize: 26, fontWeight: "800", color: "#17063B", marginBottom: 6 },
  subtitle:    { fontSize: 14, color: "rgba(100,70,160,0.6)", marginBottom: 20 },
  winnerBox:   { backgroundColor: "rgba(255,215,0,0.12)", borderRadius: 16, padding: 16, alignItems: "center", width: "100%", marginBottom: 20, borderWidth: 1.5, borderColor: "rgba(255,180,0,0.3)" },
  winnerLabel: { fontSize: 11, color: "rgba(100,70,160,0.6)", fontWeight: "700", marginBottom: 4 },
  winnerName:  { fontSize: 20, fontWeight: "800", color: "#17063B" },
  winnerScore: { fontSize: 16, color: COLORS.primary, fontWeight: "700", marginTop: 2 },
  btn:         { backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 14, paddingHorizontal: 32, ...SHADOWS.light },
  btnText:     { color: "#fff", fontSize: 15, fontWeight: "800" },
});

// ─── MissionCard ──────────────────────────────────────────────────────────────

function MissionCard({ mission, index, onCocher, savingId, statsCibles }: {
  mission: MissionItem; index: number;
  onCocher: (m: MissionItem) => void;
  savingId: number | null;
  statsCibles: StatCibleKey[];
}) {
  const anim    = useRef(new Animated.Value(0)).current;
  const scaleAn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 70, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  const isSaving     = savingId === mission.id;
  const cocheeParMoi = mission.cocheeParMoi;
  const xp_preview   = Math.round((mission.xp_base ?? 10) * (mission.difficulte ?? 1) * (mission.priorite ?? 1));
  const diffColor    = (mission.difficulte ?? 1) <= 2 ? "#22c55e" : (mission.difficulte ?? 1) <= 3 ? "#f59e0b" : "#ef4444";

  const handlePress = () => {
    if (cocheeParMoi || isSaving) return;
    Animated.sequence([
      Animated.spring(scaleAn, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(scaleAn, { toValue: 1,    useNativeDriver: true }),
    ]).start();
    onCocher(mission);
  };

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
        { scale: scaleAn },
      ],
    }}>
      <TouchableOpacity
        activeOpacity={cocheeParMoi ? 1 : 0.88}
        onPress={handlePress}
        style={[
          styles.missionCard,
          cocheeParMoi && styles.missionCardDone,
        ]}
      >
        <View style={[styles.missionIconWrap, cocheeParMoi ? styles.iconDone : styles.iconPending]}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : cocheeParMoi ? (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4.5 4.5L19 7" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : (
            <Ionicons name="ellipse-outline" size={18} color={COLORS.primary} />
          )}
        </View>

        <View style={styles.missionContent}>
          <Text style={[styles.missionTitle, cocheeParMoi && styles.missionTitleDone]} numberOfLines={1}>
            {mission.title}
          </Text>
          {mission.description ? (
            <Text style={styles.missionDesc} numberOfLines={2}>{mission.description}</Text>
          ) : null}

          <View style={styles.missionMeta}>
            <View style={[styles.diffBadge, { backgroundColor: `${diffColor}18` }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{"★".repeat(Math.min(mission.difficulte ?? 1, 5))}</Text>
            </View>

            {mission.duree > 0 && (
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={10} color={COLORS.primary} />
                <Text style={styles.metaBadgeText}>{mission.duree} min</Text>
              </View>
            )}

            {cocheeParMoi ? (
              <View style={[styles.metaBadge, { backgroundColor: `${COLORS.primary}18` }]}>
                <Text style={[styles.metaBadgeText, { color: COLORS.primary, fontWeight: "800" }]}>
                  +{mission.xp_gagne_moi ?? xp_preview} XP ✓
                </Text>
              </View>
            ) : (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>+{xp_preview} XP</Text>
              </View>
            )}

            {/* Indicateurs de bonus stats cibles */}
            {!cocheeParMoi && statsCibles.length > 0 && (
              <View style={styles.metaBadge}>
                <Text style={[styles.metaBadgeText, { color: "#f59e0b" }]}>
                  ✨×1.5 {statsCibles.map(k => STAT_CONFIG[k].icon).join("")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!cocheeParMoi && (
          <TouchableOpacity
            onPress={handlePress}
            style={[styles.cocherBtn, isSaving && { opacity: 0.6 }]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12l4.5 4.5L19 7" stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ClassementRow ────────────────────────────────────────────────────────────

function ClassementRow({ item, index, isMe }: { item: ClassementItem; index: number; isMe: boolean }) {
  const color    = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = getInitials(item.nom);
  return (
    <View style={[styles.rankRow, index === 0 && styles.rankRowFirst, isMe && styles.rankRowMe]}>
      <Text style={styles.rankMedal}>{MEDAL[index] ?? `${index + 1}.`}</Text>
      <View style={[styles.rankAvatar, { backgroundColor: color }]}>
        <Text style={styles.rankAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rankName} numberOfLines={1}>{item.nom}{isMe ? " (moi)" : ""}</Text>
        <Text style={styles.rankXP}>{item.xp_total} XP</Text>
      </View>
      <View style={[styles.rankScoreBadge, index === 0 && styles.rankScoreBadgeFirst]}>
        <Text style={styles.rankScore}>{item.score_final} pts</Text>
      </View>
    </View>
  );
}

// ─── InviterModal ─────────────────────────────────────────────────────────────

function InviterModal({ visible, onClose, defiId, defiNom, defiDesc, userId }: {
  visible: boolean; onClose: () => void;
  defiId: number; defiNom: string; defiDesc: string; userId: number | null;
}) {
  const [users,      setUsers]      = useState<any[]>([]);
  const [selected,   setSelected]   = useState<number[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emails,     setEmails]     = useState<string[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);

  useEffect(() => {
    if (visible) { loadUsers(); setSelected([]); setEmailInput(""); setEmails([]); }
  }, [visible]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users").select("id_user, nom, prenom, email, username")
      .neq("id_user", userId ?? 0).order("prenom", { ascending: true });
    if (data) setUsers(data);
    setLoading(false);
  };

  const toggle  = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const addEmail = () => {
    const t = emailInput.trim().toLowerCase();
    if (!t || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) || emails.includes(t)) return;
    setEmails(prev => [...prev, t]); setEmailInput("");
  };

  const handleSend = async () => {
    const selectedUsers = users.filter(u => selected.includes(u.id_user));
    const total         = selectedUsers.length + emails.length;
    if (total === 0) return;
    setSending(true);
    const { data: meData } = await supabase.from("users").select("prenom, nom").eq("id_user", userId ?? 0).single();
    const inviteurNom = meData ? `${meData.prenom} ${meData.nom}` : "Un ami";
    await Promise.all([
      ...selectedUsers.map(u => inviterAmi({ email: u.email, defiId, defiNom, defiDescription: defiDesc, inviteurNom, inviteurId: userId ?? 1 })),
      ...emails.map(email => inviterAmi({ email, defiId, defiNom, defiDescription: defiDesc, inviteurNom, inviteurId: userId ?? 1 })),
    ]);
    setSending(false);
    Alert.alert("Invitations envoyées !", `${total} invitation${total > 1 ? "s" : ""} envoyée${total > 1 ? "s" : ""}.`);
    onClose();
  };

  const total = selected.length + emails.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={invStyles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={invStyles.sheet}>
        <View style={invStyles.handle} />
        <Text style={invStyles.title}>Inviter des participants</Text>
        <Text style={invStyles.sub}>Défi : <Text style={{ color: COLORS.primary, fontWeight: "700" }}>{defiNom}</Text></Text>
        <View style={invStyles.emailRow}>
          <TextInput
            style={invStyles.emailInput} placeholder="email@exemple.com"
            placeholderTextColor="rgba(120,90,180,0.4)"
            value={emailInput} onChangeText={setEmailInput}
            keyboardType="email-address" autoCapitalize="none"
            returnKeyType="done" onSubmitEditing={addEmail}
          />
          <TouchableOpacity style={invStyles.addBtn} onPress={addEmail}>
            <Text style={invStyles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {emails.length > 0 && (
          <View style={invStyles.chips}>
            {emails.map(e => (
              <View key={e} style={invStyles.chip}>
                <Text style={invStyles.chipText} numberOfLines={1}>{e}</Text>
                <TouchableOpacity onPress={() => setEmails(prev => prev.filter(x => x !== e))}>
                  <Text style={invStyles.chipX}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Text style={invStyles.sectionLabel}>Utilisateurs de l'app</Text>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{ padding: 16 }} /> : (
          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
            {users.map((u, i) => {
              const isSelected = selected.includes(u.id_user);
              const initials   = getInitials(u.nom, u.prenom);
              const color      = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <TouchableOpacity key={u.id_user}
                  style={[invStyles.userRow, isSelected && invStyles.userRowSelected]}
                  onPress={() => toggle(u.id_user)} activeOpacity={0.85}
                >
                  <View style={[invStyles.userAvatar, { backgroundColor: color }]}>
                    <Text style={invStyles.userAvatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={invStyles.userName}>{u.username ? `@${u.username}` : `${u.prenom} ${u.nom}`}</Text>
                    <Text style={invStyles.userEmail}>{u.email}</Text>
                  </View>
                  <View style={[invStyles.check, isSelected && invStyles.checkSelected]}>
                    {isSelected && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 12l4.5 4.5L19 7" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <TouchableOpacity
          style={[invStyles.sendBtn, (total === 0 || sending) && { opacity: 0.5 }]}
          onPress={handleSend} disabled={total === 0 || sending}
        >
          {sending ? <ActivityIndicator color="#fff" /> : (
            <Text style={invStyles.sendBtnText}>
              {total > 0 ? `Envoyer ${total} invitation${total > 1 ? "s" : ""}` : "Sélectionne des personnes"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const invStyles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet:          { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: "85%" },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginBottom: 16 },
  title:          { fontSize: 20, fontWeight: "800", color: "#17063B", marginBottom: 4 },
  sub:            { fontSize: 13, color: "rgba(100,70,160,0.6)", marginBottom: 16 },
  emailRow:       { flexDirection: "row", gap: 8, marginBottom: 10 },
  emailInput:     { flex: 1, borderWidth: 1.5, borderColor: "rgba(180,160,220,0.4)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: "#17063B" },
  addBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  addBtnText:     { color: "#fff", fontSize: 24, fontWeight: "400", lineHeight: 28 },
  chips:          { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip:           { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${COLORS.primary}12`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: `${COLORS.primary}25` },
  chipText:       { fontSize: 12, color: "#3D1F7A", fontWeight: "600", maxWidth: 150 },
  chipX:          { fontSize: 16, color: "#888", lineHeight: 18 },
  sectionLabel:   { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 8 },
  userRow:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  userRowSelected:{ backgroundColor: `${COLORS.primary}08` },
  userAvatar:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  userName:       { fontSize: 14, fontWeight: "700", color: "#17063B" },
  userEmail:      { fontSize: 11, color: "rgba(100,70,160,0.6)", marginTop: 1 },
  check:          { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "rgba(180,160,220,0.5)", alignItems: "center", justifyContent: "center" },
  checkSelected:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sendBtn:        { backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 15, alignItems: "center", marginTop: 16, ...SHADOWS.light },
  sendBtnText:    { color: "#fff", fontSize: 15, fontWeight: "800" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressionDefiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useUser();

  const id_defi   = params.defiId   ? Number(params.defiId)   : 0;
  const defi_nom  = params.defiNom  ? String(params.defiNom)  : "Défi";
  const defi_desc = params.defiDesc ? String(params.defiDesc) : "";

  type TabType = "missions" | "classement";

  const [activeTab,     setActiveTab]     = useState<TabType>("missions");
  const [activeNav,     setActiveNav]     = useState("defis");
  const [loading,       setLoading]       = useState(true);
  const [savingMission, setSavingMission] = useState<number | null>(null);
  const [showAddTime,   setShowAddTime]   = useState(false);
  const [addMinutes,    setAddMinutes]    = useState("");
  const [showVictoire,  setShowVictoire]  = useState(false);
  const [showInviter,   setShowInviter]   = useState(false);
  const [bonusToast,    setBonusToast]    = useState({ visible: false, xp: 0, statsCibles: [] as StatCibleKey[] });

  const [defiInfo,       setDefiInfo]       = useState<any>(null);
  const [participants,   setParticipants]   = useState<Participant[]>([]);
  const [missions,       setMissions]       = useState<MissionItem[]>([]);
  const [classement,     setClassement]     = useState<ClassementItem[]>([]);
  const [mesCompletions, setMesCompletions] = useState<Set<number>>(new Set());
  const [statsCibles,    setStatsCibles]    = useState<StatCibleKey[]>([]);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
    chargerTout();
  }, []);

  const chargerTout = async () => {
    setLoading(true);
    await Promise.all([
      chargerDefi(),
      chargerMissionsEtCompletions(),
      chargerParticipants(),
      chargerClassementAutomatique(),
      chargerStatsCibles(),
    ]);
    setLoading(false);
  };

  const chargerDefi = async () => {
    const { data } = await getDefiDetail(id_defi);
    if (data) setDefiInfo(data);
  };

  // Charger les stats cibles du défi
  const chargerStatsCibles = async () => {
    const cibles = await getStatsCiblesDuDefi(id_defi);
    setStatsCibles(cibles);
  };

  const chargerMissionsEtCompletions = async () => {
  const [{ data: missData }, { data: compData }] = await Promise.all([
    getMissions(id_defi),
    getMissionsCompleteesPar(userId ?? 0, id_defi),
  ]);

  const doneSet = new Set<number>();
  const xpMap   = new Map<number, number>();
  (compData ?? []).forEach((c: any) => {
    // ✅ statut est dans mission_validation
    if (c.statut === 'done') {
      doneSet.add(c.id_mission);
      xpMap.set(c.id_mission, c.xp_obtenu ?? 0);
    }
  });

  if (missData) {
    setMissions(missData.map((m: any) => ({
      id:           m.id_mission,
      title:        m.titre       ?? 'Mission',
      description:  m.description ?? '',
      duree:        m.duree_min   ?? 0,
      // ✅ statut déterminé par mission_validation
      statut:       doneSet.has(m.id_mission) ? 'completed' : 'pending',
      progression:  m.progression ?? 0,
      xp_base:      m.xp_gain     ?? 10,
      difficulte:   m.difficulte  ?? 1,
      priorite:     m.priorite    ?? 1,
      type_mission: 'revision',
      cocheeParMoi: doneSet.has(m.id_mission),
      xp_gagne_moi: xpMap.get(m.id_mission),
    })));
  }
};

  const chargerParticipants = async () => {
  const { data } = await getParticipants(id_defi);
  if (!data) return;

  setParticipants(
    data.sort((a, b) => (b.minutes_etudies ?? 0) - (a.minutes_etudies ?? 0))
  );
};

  const chargerClassementAutomatique = async () => {
    const { data: parts } = await supabase
      .from("defi_participants")
      .select("id_user, xp_total, score, users(nom, prenom)")
      .eq("id_defi", id_defi);

    if (!parts || parts.length === 0) {
      if (userId) {
        const { data: meData } = await supabase.from("users").select("nom, prenom").eq("id_user", userId).single();
        if (meData) setClassement([{ rang: 1, id_user: userId, nom: `${meData.prenom ?? ""} ${meData.nom ?? ""}`.trim(), score_final: 0, xp_total: 0 }]);
      }
      return;
    }

    const defi = defiInfo ?? (await getDefiDetail(id_defi)).data;
    const scores = await Promise.all(
      parts.map(async (p: any) => {
        const { data: validations } = await supabase
          .from("mission_validation")
          .select("xp_obtenu, date_fin, mission!inner(difficulte, id_defi)")
          .eq("id_user", p.id_user)
          .eq("mission.id_defi", id_defi)
          .order("date_fin", { ascending: false });

        const xp_missions  = (validations ?? []).map((v: any) => v.xp_obtenu ?? 0);
        const difficultes  = (validations ?? []).map((v: any) => v.mission?.difficulte ?? 1);
        const xp_total     = Math.min(xp_missions.reduce((s: number, x: number) => s + x, 0), 500);
        const diff_moy     = difficultes.length > 0 ? difficultes.reduce((s: number, d: number) => s + d, 0) / difficultes.length : 1;

        let bonus_rapidite = 0;
        if (defi?.date_debut && defi?.date_fin && validations && validations.length > 0) {
          const fin_defi   = new Date(defi.date_fin).getTime();
          const completion = new Date(validations[0].date_fin).getTime();
          bonus_rapidite   = Math.max(0, (fin_defi - completion) / (1000 * 60 * 60)) * 0.5;
        }

        const score_final = Math.round(xp_total + diff_moy * 10 + bonus_rapidite);
        const nom         = p.users ? `${(p.users as any).prenom ?? ""} ${(p.users as any).nom ?? ""}`.trim() : "Inconnu";

        await supabase.from("defi_participants").update({ score: score_final, xp_total }).eq("id_defi", id_defi).eq("id_user", p.id_user);

        return { id_user: p.id_user, nom, xp_total, score_final };
      })
    );

    const sorted = [...scores].sort((a, b) => b.score_final - a.score_final).map((s, i) => ({ ...s, rang: i + 1 }));

    const estPresent = sorted.some(s => s.id_user === userId);
    if (!estPresent && userId) {
      const { data: meData } = await supabase.from("users").select("nom, prenom").eq("id_user", userId).single();
      sorted.push({ rang: sorted.length + 1, id_user: userId, nom: meData ? `${meData.prenom ?? ""} ${meData.nom ?? ""}`.trim() : "Moi", xp_total: 0, score_final: 0 });
    }

    setClassement(sorted);
  };

  // ── Cocher une mission ────────────────────────────────────────────────────

  const handleCocherMission = async (mission: MissionItem) => {
    if (!userId || savingMission !== null || mission.cocheeParMoi) return;
    setSavingMission(mission.id);

    const statsRes = await getStatsUtilisateur(userId);
    const stats    = statsRes.data ?? { stress: 50, energie: 80, organisation: 50, connaissances: 0, discipline: 50, serenite: 50, concentration: 70 };

    const result = await cocherMission({
      missionId:        mission.id,
      userId,
      defiId:           id_defi,
      mission: {
        id_mission:   mission.id,
        id_defi:      id_defi,
        titre:        mission.title,
        duree_min:    mission.duree,
        xp_gain:      mission.xp_base,
        difficulte:   mission.difficulte,
        priorite:     mission.priorite,
        type_mission: mission.type_mission,
      },
      statsActuelles:   stats,
      missionsFaites:   mesCompletions.size,
      missionsTotal:    missions.length,
      missionsOubliees: missions.length - mesCompletions.size - 1,
    });

    setSavingMission(null);

    if (result.error) { Alert.alert("Erreur", "Impossible de cocher la mission."); return; }

    // Afficher le toast avec XP + stats cibles boostées
    if (result.xp_gagne) {
      setBonusToast({ visible: true, xp: result.xp_gagne, statsCibles: result.statsCibles ?? [] });
      setTimeout(() => setBonusToast({ visible: false, xp: 0, statsCibles: [] }), 3000);
    }

    await chargerTout();

    if (defiInfo?.objectif_minutes) {
      const { gagne } = await verifierVictoireDefi(id_defi, defiInfo.objectif_minutes);
      if (gagne) setShowVictoire(true);
    }
  };

  // ── Ajouter du temps ──────────────────────────────────────────────────────

  const handleAddTime = async () => {
    const mins = parseInt(addMinutes, 10);
    if (isNaN(mins) || mins <= 0) { Alert.alert("Erreur", "Entre un nombre de minutes valide."); return; }
    if (!userId) return;

    const { data: existing } = await supabase.from("defi_participants").select("id_user").eq("id_defi", id_defi).eq("id_user", userId).maybeSingle();
    if (!existing) await supabase.from("defi_participants").insert({ id_defi, id_user: userId, minutes_etudies: 0, score: 0, xp_total: 0 });

    const { error } = await addTempsEtudie(id_defi, userId, mins);
    if (error) Alert.alert("Erreur", "Impossible d'enregistrer le temps.");
    else { setAddMinutes(""); setShowAddTime(false); await chargerTout(); }
  };

  // ── Calculs ───────────────────────────────────────────────────────────────

  const objectif_minutes = defiInfo?.objectif_minutes ?? 120;
  const totalMinutes     = participants.reduce((s, p) => s + (p.minutes_etudies ?? 0), 0);
  const progressRatio    = Math.min(totalMinutes / objectif_minutes, 1);
  const mesCompletsCount = mesCompletions.size;
  const maMissionPct     = missions.length > 0 ? Math.round((mesCompletsCount / missions.length) * 100) : 0;
  const gagnant          = classement.length > 0 ? classement[0] : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={["#D8CCFF", "#E8DFFA", "#EDE8FB"]} style={styles.gradient}>

        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{defi_nom}</Text>
            {defi_desc ? <Text style={styles.headerSub} numberOfLines={1}>{defi_desc}</Text> : null}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowInviter(true)}>
              <Ionicons name="person-add-outline" size={17} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={chargerTout}>
              <Ionicons name="refresh-outline" size={17} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Stats cibles du défi */}
            <StatsCiblesBar statsCibles={statsCibles} />

            {/* Carte progression groupe */}
            <View style={[styles.progressCard, SHADOWS.light]}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressLabel}>Progression du groupe</Text>
                  <Text style={styles.progressValue}>
                    {formatMinutes(totalMinutes)}
                    <Text style={styles.progressGoal}> / {formatMinutes(objectif_minutes)}</Text>
                  </Text>
                </View>
                <View style={[styles.pctBadge, progressRatio >= 1 && styles.pctBadgeDone]}>
                  <Text style={styles.pctText}>{Math.round(progressRatio * 100)}%</Text>
                </View>
              </View>

              <View style={styles.barTrack}>
                <LinearGradient
                  colors={progressRatio >= 1 ? ["#22c55e", "#4ade80"] : ["#664e97", "#906ce6", "#c182de"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.round(progressRatio * 100)}%` }]}
                />
              </View>

              <View style={styles.myProgressRow}>
                <Text style={styles.myProgressLabel}>Ma progression</Text>
                <Text style={styles.myProgressValue}>{mesCompletsCount}/{missions.length} missions ({maMissionPct}%)</Text>
              </View>
              <View style={styles.barTrackThin}>
                <View style={[styles.barFillThin, { width: `${maMissionPct}%` }]} />
              </View>

              {/* Participants */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={styles.participantsRow}>
                  {participants.length === 0 ? (
                    <Text style={styles.noData}>Aucun participant</Text>
                  ) : participants.map((p, i) => {
                    const isMe     = p.id_user === userId;
                    const color    = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const initials = getInitials(p.nom, p.prenom);
                    return (
                      <View key={p.id_user} style={styles.participantItem}>
                        <View style={[styles.avatar, { backgroundColor: color }, isMe && styles.avatarMe]}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <Text style={[styles.participantName, isMe && { color: COLORS.primary }]} numberOfLines={1}>
                          {isMe ? "Moi" : (p.prenom ?? p.nom).split(" ")[0]}
                        </Text>
                        <Text style={styles.participantTime}>{formatMinutes(p.minutes_etudies)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.addTimeBtn} onPress={() => setShowAddTime(true)} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                    <Ionicons name="add-circle-outline" size={15} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.btnText}>+ Temps</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInviter(true)} activeOpacity={0.85}>
                  <Text style={styles.inviteBtnText}>👥 Inviter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(["missions", "classement"] as TabType[]).map(tab => (
                <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === "missions" ? "📋 Missions" : "🏆 Classement"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Missions */}
            {activeTab === "missions" && (
              <View style={styles.list}>
                {missions.length === 0 ? (
                  <Text style={styles.noData}>Aucune mission dans ce défi.</Text>
                ) : missions.map((m, i) => (
                  <MissionCard
                    key={m.id} mission={m} index={i}
                    onCocher={handleCocherMission}
                    savingId={savingMission}
                    statsCibles={statsCibles}
                  />
                ))}
              </View>
            )}

            {/* Classement */}
            {activeTab === "classement" && (
              <View style={styles.list}>
                {classement.length === 0 ? (
                  <View style={styles.emptyClassement}>
                    <Text style={styles.emptyIcon}>🏆</Text>
                    <Text style={styles.emptyTitle}>Classement vide</Text>
                    <Text style={styles.emptySub}>Complete des missions pour apparaître ici.</Text>
                  </View>
                ) : classement.map((item, i) => (
                  <ClassementRow key={item.id_user} item={item} index={i} isMe={item.id_user === (userId ?? -1)} />
                ))}

                {classement.length > 0 && (
                  <View style={styles.formuleLegend}>
                    <Text style={styles.formuleTitle}>📐 Formule du score</Text>
                    <Text style={styles.formuleText}>
                      Score = XP missions (max 500){"\n"}
                      + Difficulté moy × 10{"\n"}
                      + Heures restantes × 0.5 (bonus rapidité){"\n\n"}
                      {statsCibles.length > 0 && (
                        `✨ Bonus ×1.5 actif sur : ${statsCibles.map(k => STAT_CONFIG[k].label).join(", ")}`
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 130 }} />
          </ScrollView>
        )}

        {/* Modal ajouter du temps */}
        <Modal visible={showAddTime} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAddTime(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ajouter du temps d'étude</Text>
            <Text style={styles.modalLabel}>Minutes étudiées</Text>
            <TextInput
              style={styles.timeInput} placeholder="ex: 45"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric" value={addMinutes} onChangeText={setAddMinutes}
            />
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddTime}>
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                <Text style={styles.btnText}>Confirmer</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowAddTime(false); setAddMinutes(""); }}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Bonus Toast */}
        <BonusToast visible={bonusToast.visible} xp={bonusToast.xp} statsCibles={bonusToast.statsCibles} />

        {/* Victoire */}
        <VictoireModal visible={showVictoire} gagnant={gagnant} onClose={() => { setShowVictoire(false); setActiveTab("classement"); }} />

        {/* Inviter */}
        <InviterModal visible={showInviter} onClose={() => setShowInviter(false)} defiId={id_defi} defiNom={defi_nom} defiDesc={defi_desc} userId={userId} />

        <Navbar active={activeNav} onChange={setActiveNav} />
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: "#D8CCFF" },
  gradient: { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.padding, paddingTop: Platform.OS === "android" ? 50 : 58, paddingBottom: 10, gap: 10 },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 17, fontWeight: "800", color: "#17063B" },
  headerSub:     { fontSize: 12, color: "rgba(100,70,160,0.6)", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  headerBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", ...SHADOWS.light },
  loadingWrap:   { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:   { fontSize: 14, color: "rgba(100,70,160,0.6)", fontWeight: "600" },
  scroll:        { paddingHorizontal: SIZES.padding, paddingTop: 10 },
  progressCard:  { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: SIZES.radiusLg, padding: 16, marginBottom: 14 },
  progressHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  progressLabel: { fontSize: 11, color: "rgba(100,70,160,0.6)", fontWeight: "600", marginBottom: 2 },
  progressValue: { fontSize: 24, fontWeight: "800", color: "#17063B" },
  progressGoal:  { fontSize: 13, color: "rgba(100,70,160,0.5)", fontWeight: "600" },
  pctBadge:      { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pctBadgeDone:  { backgroundColor: "#22c55e" },
  pctText:       { color: "#fff", fontWeight: "800", fontSize: 15 },
  barTrack:      { height: 10, backgroundColor: "rgba(180,160,220,0.25)", borderRadius: 5, overflow: "hidden", marginBottom: 10 },
  barFill:       { height: "100%", borderRadius: 5 },
  myProgressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  myProgressLabel:{ fontSize: 11, color: "rgba(100,70,160,0.6)", fontWeight: "600" },
  myProgressValue:{ fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  barTrackThin:  { height: 6, backgroundColor: "rgba(180,160,220,0.2)", borderRadius: 3, overflow: "hidden" },
  barFillThin:   { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  participantsRow:{ flexDirection: "row", gap: 14, paddingVertical: 4, paddingHorizontal: 2 },
  participantItem:{ alignItems: "center", gap: 3, width: 58 },
  avatar:         { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarMe:       { borderWidth: 2.5, borderColor: COLORS.primary },
  avatarText:     { fontSize: 15, fontWeight: "800", color: "#fff" },
  participantName:{ fontSize: 11, fontWeight: "700", color: "#3D1F7A", textAlign: "center", width: 58 },
  participantTime:{ fontSize: 10, color: "rgba(100,70,160,0.6)" },
  cardBtns:       { flexDirection: "row", gap: 8, marginTop: 14 },
  addTimeBtn:     { flex: 2, borderRadius: 32, overflow: "hidden" },
  inviteBtn:      { flex: 1, borderRadius: 32, borderWidth: 2, borderColor: "#906ce6", alignItems: "center", justifyContent: "center", paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.8)" },
  inviteBtnText:  { fontSize: 11, fontWeight: "700", color: "#906ce6" },
  btnGrad:        { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, paddingHorizontal: 12, borderRadius: 32 },
  btnText:        { color: "#fff", fontSize: 12, fontWeight: "700" },
  noData:         { fontSize: 13, color: "rgba(100,70,160,0.5)", textAlign: "center", padding: 20 },
  tabRow:         { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: SIZES.radiusLg, padding: 4, marginBottom: 12, ...SHADOWS.light },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius, alignItems: "center" },
  tabActive:      { backgroundColor: "rgba(149,116,224,0.15)" },
  tabText:        { fontSize: 12, fontWeight: "600", color: COLORS.textLight },
  tabTextActive:  { color: COLORS.primary, fontWeight: "800" },
  list:           { gap: 10 },
  missionCard:    { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: SIZES.radiusLg, padding: 13, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: "transparent", ...SHADOWS.light },
  missionCardDone:{ borderColor: "rgba(149,116,224,0.35)", backgroundColor: "rgba(240,235,255,0.9)" },
  missionIconWrap:{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconDone:       { backgroundColor: COLORS.primary },
  iconPending:    { backgroundColor: "rgba(180,160,220,0.2)" },
  missionContent: { flex: 1 },
  missionTitle:   { fontSize: 13, fontWeight: "700", color: "#17063B", marginBottom: 2 },
  missionTitleDone:{ color: COLORS.primary },
  missionDesc:    { fontSize: 11, color: "rgba(100,70,160,0.6)", lineHeight: 15, marginBottom: 5 },
  missionMeta:    { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  diffBadge:      { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffText:       { fontSize: 9 },
  metaBadge:      { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(180,160,220,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  metaBadgeText:  { fontSize: 10, color: "rgba(100,70,160,0.7)", fontWeight: "600" },
  cocherBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: `${COLORS.primary}14`, borderWidth: 1.5, borderColor: `${COLORS.primary}30`, alignItems: "center", justifyContent: "center" },
  rankRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: SIZES.radiusLg, padding: 12, gap: 10, ...SHADOWS.light },
  rankRowFirst:   { backgroundColor: "rgba(255,215,0,0.12)", borderWidth: 1.5, borderColor: "rgba(255,180,0,0.3)" },
  rankRowMe:      { borderWidth: 1.5, borderColor: `${COLORS.primary}50` },
  rankMedal:      { fontSize: 22, width: 28, textAlign: "center" },
  rankAvatar:     { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  rankAvatarText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  rankName:       { fontSize: 14, fontWeight: "700", color: "#17063B" },
  rankXP:         { fontSize: 11, color: "rgba(100,70,160,0.6)", fontWeight: "600", marginTop: 1 },
  rankScoreBadge: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  rankScoreBadgeFirst: { backgroundColor: "#f59e0b" },
  rankScore:      { color: "#fff", fontSize: 12, fontWeight: "800" },
  emptyClassement:{ alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIcon:      { fontSize: 48 },
  emptyTitle:     { fontSize: 18, fontWeight: "800", color: "#17063B" },
  emptySub:       { fontSize: 13, color: "rgba(100,70,160,0.6)", textAlign: "center", lineHeight: 18 },
  formuleLegend:  { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 14, marginTop: 4 },
  formuleTitle:   { fontSize: 13, fontWeight: "700", color: "#17063B", marginBottom: 6 },
  formuleText:    { fontSize: 12, color: "rgba(100,70,160,0.7)", lineHeight: 19 },
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet:     { backgroundColor: "#fff", borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 18, fontWeight: "800", color: "#17063B", marginBottom: 16 },
  modalLabel:     { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 8 },
  timeInput:      { borderWidth: 1.5, borderColor: "rgba(180,160,220,0.4)", borderRadius: SIZES.radius, padding: 12, fontSize: 16, color: "#17063B", fontWeight: "600", marginBottom: 12 },
  modalConfirmBtn:{ borderRadius: 32, overflow: "hidden", marginBottom: 10 },
  modalCancelBtn: { alignItems: "center", paddingVertical: 10 },
  modalCancelText:{ fontSize: 14, color: "rgba(100,70,160,0.5)", fontWeight: "600" },
});