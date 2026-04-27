// screens/MissionMapScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import CreateMissionModal from "../components/CreateMissionModal";
import HibouGuide from "../components/ui/Hibou";
import { SHADOWS } from "../constants/theme";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type MissionStatus = "locked" | "active" | "in_progress" | "paused" | "done";

interface Mission {
  id_mission: number;
  titre: string;
  description: string | null;
  duree_min: number | null;
  difficulte: number;
  priorite: number;
  xp_gain: number;
  energie_cout: number;
  stress_gain: number;
  connaissance_gain: number;
  organisation_gain: number;
  date_limite: string | null;
  id_boss: number;
  statut: string;
  localStatus: MissionStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFF_LABELS: Record<number, string> = { 1: "Facile", 2: "Moyen", 3: "Difficile" };
const PRIO_COLORS: Record<number, string> = {
  1: "#6EE7B7", 2: "#60A5FA", 3: "#FBBF24", 4: "#F87171",
};
const DIFF_ICONS: Record<number, string>  = { 1: "⚡", 2: "🔥", 3: "💀" };
const MAP_STEP = 150;

const dbStatusToLocal = (statut: string): MissionStatus => {
  switch (statut) {
    case "done":    return "done";
    case "running": return "in_progress";
    case "paused":  return "paused";
    case "fail":    return "locked";
    default:        return "active";
  }
};

const getNodePosition = (index: number): { top: number; isLeft: boolean } => ({
  top: 80 + index * MAP_STEP,
  isLeft: index % 2 === 0,
});

const STATUS_CONFIG: Record<MissionStatus, { color: string; bg: string; border: string; icon: string; label: string }> = {
  locked:      { color: "#9CA3AF", bg: "#F3F4F6", border: "#E5E7EB", icon: "🔒", label: "Verrouillée" },
  active:      { color: "#7C3AED", bg: "#EDE9FE", border: "#C4B5FD", icon: "⭐", label: "Disponible"  },
  in_progress: { color: "#F59E0B", bg: "#FEF3C7", border: "#FCD34D", icon: "⚡", label: "En cours"    },
  paused:      { color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: "⏸️", label: "En pause"    },
  done:        { color: "#10B981", bg: "#D1FAE5", border: "#6EE7B7", icon: "✅", label: "Terminée"    },
};

// ─── SVG Trail (snake dynamique) ─────────────────────────────────────────────
const TrailPath = ({ count }: { count: number }) => {
  if (count === 0) return null;
  let d = "";
  for (let i = 0; i < count; i++) {
    const { top, isLeft } = getNodePosition(i);
    const x = isLeft ? width * 0.28 : width * 0.72;
    if (i === 0) {
      d += `M ${x} ${top + 30}`;
    } else {
      const { top: prevTop, isLeft: prevLeft } = getNodePosition(i - 1);
      const prevX = prevLeft ? width * 0.28 : width * 0.72;
      const midY  = (prevTop + top) / 2;
      d += ` C ${prevX} ${midY}, ${x} ${midY}, ${x} ${top + 30}`;
    }
  }
  const mapH = 80 + count * MAP_STEP + 120;
  const sparkles: { x: number; y: number }[] = [];
  for (let i = 0; i < count - 1; i++) {
    const { top: t1, isLeft: l1 } = getNodePosition(i);
    const { top: t2 }             = getNodePosition(i + 1);
    sparkles.push({ x: l1 ? width * 0.28 : width * 0.72, y: (t1 + t2) / 2 });
  }
  return (
    <Svg width={width} height={mapH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Path d={d} stroke="#C4B5E8" strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.35} />
      <Path d={d} stroke="#E9D5FF" strokeWidth={13} strokeLinecap="round" fill="none" strokeDasharray="2 22" />
      {sparkles.map((s, i) => (
        <React.Fragment key={i}>
          <Circle cx={s.x} cy={s.y} r={3.5} fill="#fff" opacity={0.75} />
          <Circle cx={s.x} cy={s.y} r={8}   fill="#fff" opacity={0.12} />
        </React.Fragment>
      ))}
    </Svg>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ progress }: { progress: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 900, useNativeDriver: false }).start();
  }, [progress]);
  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: barWidth }]} />
    </View>
  );
};

// ─── Mission Node (style doc5 + données réelles) ──────────────────────────────
interface MissionNodeProps {
  mission: Mission;
  index: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MissionNode = ({ mission, index, onPress, onEdit, onDelete }: MissionNodeProps) => {
  const { top, isLeft } = getNodePosition(index);
  const cfg    = STATUS_CONFIG[mission.localStatus];
  const anim   = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(1)).current;
  const isLocked = mission.localStatus === "locked";

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay: index * 100, useNativeDriver: true, tension: 60, friction: 8,
    }).start();
    if (mission.localStatus === "in_progress" || mission.localStatus === "active") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.07, duration: 850, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 850, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mission.localStatus]);

  return (
    <Animated.View style={[
      styles.nodeWrapper,
      isLeft ? styles.nodeLeft : styles.nodeRight,
      {
        top,
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          {/* ── Avatar circle (style doc5) ── */}
          {isLocked ? (
            /* Padlock node */
            <View style={styles.lockNode}>
              <Svg width={38} height={44} viewBox="0 0 42 50">
                <Ellipse cx={21} cy={17} rx={9} ry={9} stroke="#C4B5E8" strokeWidth={5} fill="none" />
                <Path d="M8 24 Q8 44 21 44 Q34 44 34 24 Z" fill="#C4B5E8" />
                <Circle cx={21} cy={34} r={4} fill="#fff" opacity={0.8} />
                <Path d="M21 34 V39" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.lockLabel} numberOfLines={2}>{mission.titre}</Text>
            </View>
          ) : (
            /* Active / done / paused / in_progress node */
            <View style={styles.nodeGroup}>
              {/* Status badge above */}
              <View style={[styles.statusPill, { backgroundColor: cfg.color }]}>
                <Text style={styles.statusPillText}>{cfg.label}</Text>
              </View>

              {/* Circle avatar */}
              <View style={[
                styles.avatarCircle,
                { backgroundColor: cfg.bg, borderColor: cfg.border },
              ]}>
                <Text style={styles.avatarIcon}>{cfg.icon}</Text>
                {/* Coin badge for active */}
                {mission.localStatus === "active" && (
                  <View style={styles.coinBadge}>
                    <Svg width={22} height={22} viewBox="0 0 24 24">
                      <Circle cx={12} cy={12} r={11} fill="#D97706" />
                      <Circle cx={12} cy={12} r={8}  fill="#F59E0B" />
                      <Circle cx={12} cy={12} r={5}  fill="#FDE68A" opacity={0.6} />
                    </Svg>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={[styles.nodeTitle, { color: cfg.color }]} numberOfLines={2}>
                {mission.titre}
              </Text>

              {/* Gains row */}
              <View style={styles.gainsRow}>
                <Text style={styles.gainChip}>🏆 +{mission.xp_gain} XP</Text>
                {mission.duree_min != null && (
                  <Text style={styles.gainChip}>⏱ {mission.duree_min}m</Text>
                )}
                <Text style={styles.gainChip}>{DIFF_ICONS[mission.difficulte]} {DIFF_LABELS[mission.difficulte]}</Text>
              </View>

              {/* Edit / Delete */}
              <View style={styles.nodeActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                  <Ionicons name="pencil-outline" size={13} color="#7C3AED" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={13} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Mission Detail Modal ─────────────────────────────────────────────────────
interface MissionDetailModalProps {
  mission: Mission | null;
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
}

const MissionDetailModal = ({ mission, visible, onClose, onStart, onPause, onComplete }: MissionDetailModalProps) => {
  if (!mission) return null;
  const cfg = STATUS_CONFIG[mission.localStatus];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <View style={detailStyles.container}>
          <View style={detailStyles.handle} />
          <View style={[detailStyles.header, { backgroundColor: cfg.color + "22" }]}>
            <Text style={detailStyles.headerIcon}>{cfg.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={detailStyles.title}>{mission.titre}</Text>
              <View style={[detailStyles.statusPill, { backgroundColor: cfg.color }]}>
                <Text style={detailStyles.statusPillText}>{cfg.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={detailStyles.body} showsVerticalScrollIndicator={false}>
            {mission.description && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>📋 Description</Text>
                <Text style={detailStyles.desc}>{mission.description}</Text>
              </View>
            )}
            <View style={detailStyles.infoGrid}>
              {[
                { emoji: DIFF_ICONS[mission.difficulte], label: "Difficulté",  val: DIFF_LABELS[mission.difficulte] },
                { emoji: "🏆",                           label: "XP",          val: `+${mission.xp_gain}` },
                ...(mission.duree_min ? [{ emoji: "⏱", label: "Durée",       val: `${mission.duree_min} min` }] : []),
                ...(mission.date_limite ? [{ emoji: "📅", label: "Limite",    val: new Date(mission.date_limite).toLocaleDateString("fr-FR") }] : []),
                { emoji: "📚", label: "Connaissance", val: `+${mission.connaissance_gain}` },
                { emoji: "📋", label: "Organisation", val: `+${mission.organisation_gain}` },
              ].map(g => (
                <View key={g.label} style={detailStyles.infoCard}>
                  <Text style={detailStyles.infoEmoji}>{g.emoji}</Text>
                  <Text style={detailStyles.infoLabel}>{g.label}</Text>
                  <Text style={detailStyles.infoVal}>{g.val}</Text>
                </View>
              ))}
            </View>

            <View style={detailStyles.ctaGroup}>
              {mission.localStatus === "active" && (
                <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#7C3AED" }]} onPress={onStart}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={detailStyles.ctaBtnText}>Commencer</Text>
                </TouchableOpacity>
              )}
              {mission.localStatus === "in_progress" && (
                <>
                  <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#3B82F6" }]} onPress={onPause}>
                    <Ionicons name="pause" size={18} color="#fff" />
                    <Text style={detailStyles.ctaBtnText}>Mettre en pause</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#10B981" }]} onPress={onComplete}>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={detailStyles.ctaBtnText}>Terminer ✅</Text>
                  </TouchableOpacity>
                </>
              )}
              {mission.localStatus === "paused" && (
                <>
                  <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#7C3AED" }]} onPress={onStart}>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={detailStyles.ctaBtnText}>Reprendre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#10B981" }]} onPress={onComplete}>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={detailStyles.ctaBtnText}>Terminer quand même</Text>
                  </TouchableOpacity>
                </>
              )}
              {mission.localStatus === "done" && (
                <View style={[detailStyles.ctaBtn, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="trophy" size={18} color="#10B981" />
                  <Text style={[detailStyles.ctaBtnText, { color: "#10B981" }]}>Mission accomplie 🎉</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Speech Bubble ─────────────────────────────────────────────────────────────
const SpeechBubble = ({ message }: { message: string }) => (
  <View style={styles.bubbleWrapper}>
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{message}</Text>
    </View>
    <View style={styles.bubbleArrow} />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MissionMapScreen() {
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId: string; eventTitle: string }>();
  const router = useRouter();

  const [missions,           setMissions]           = useState<Mission[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [selectedMission,    setSelectedMission]    = useState<Mission | null>(null);
  const [detailVisible,      setDetailVisible]      = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editData,           setEditData]           = useState<any>(null);

  // hibou message dynamique
  const hibouMsg = missions.length === 0
    ? "Crée ta\npremière\nmission !"
    : missions.every(m => m.localStatus === "done")
      ? "Bravo !\nToutes les\nmissions faites 🎉"
      : "Continue\ncomme ça ! 💪";

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchMissions = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mission")
        .select("*")
        .eq("id_boss", Number(eventId))
        .order("id_mission", { ascending: true });

      if (error) throw error;

      const raw = data ?? [];
      let firstUnlockedFound = false;
      const withStatus: Mission[] = raw.map((m) => {
        const dbLocal = dbStatusToLocal(m.statut);
        if (dbLocal === "done" || dbLocal === "in_progress" || dbLocal === "paused") {
          return { ...m, localStatus: dbLocal };
        }
        if (!firstUnlockedFound) {
          firstUnlockedFound = true;
          return { ...m, localStatus: "active" as MissionStatus };
        }
        return { ...m, localStatus: "locked" as MissionStatus };
      });

      setMissions(withStatus);
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const updateStatut = async (id_mission: number, statut: string) => {
    const { error } = await supabase.from("mission").update({ statut }).eq("id_mission", id_mission);
    if (error) Alert.alert("Erreur", error.message);
  };

  const handleStart = async () => {
    if (!selectedMission) return;
    await updateStatut(selectedMission.id_mission, "running");
    setMissions(prev => prev.map(m =>
      m.id_mission === selectedMission.id_mission ? { ...m, localStatus: "in_progress" } : m
    ));
    setSelectedMission(prev => prev ? { ...prev, localStatus: "in_progress" } : null);
  };

  const handlePause = async () => {
    if (!selectedMission) return;
    await updateStatut(selectedMission.id_mission, "paused");
    setMissions(prev => prev.map(m =>
      m.id_mission === selectedMission.id_mission ? { ...m, localStatus: "paused" } : m
    ));
    setSelectedMission(prev => prev ? { ...prev, localStatus: "paused" } : null);
  };

  const handleComplete = async () => {
    if (!selectedMission) return;
    const id = selectedMission.id_mission;
    await updateStatut(id, "done");
    setMissions(prev => {
      const idx = prev.findIndex(m => m.id_mission === id);
      return prev.map((m, i) => {
        if (m.id_mission === id) return { ...m, localStatus: "done" as MissionStatus };
        if (i === idx + 1 && m.localStatus === "locked") return { ...m, localStatus: "active" as MissionStatus };
        return m;
      });
    });
    setDetailVisible(false);
    Alert.alert("🎉 Mission terminée !", `Tu as gagné ${selectedMission.xp_gain} XP !`);
  };

  const handleDelete = (mission: Mission) => {
    Alert.alert("Supprimer", `Supprimer "${mission.titre}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("mission").delete().eq("id_mission", mission.id_mission);
          if (error) { Alert.alert("Erreur", error.message); return; }
          setMissions(prev => prev.filter(m => m.id_mission !== mission.id_mission));
        },
      },
    ]);
  };

  const handleEdit = (mission: Mission) => {
    setEditData({
      id_mission: mission.id_mission, titre: mission.titre,
      description: mission.description, duree_min: mission.duree_min,
      difficulte: mission.difficulte, priorite: mission.priorite,
      date_limite: mission.date_limite, id_boss: mission.id_boss,
    });
    setCreateModalVisible(true);
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const doneCount = missions.filter(m => m.localStatus === "done").length;
  const progress  = missions.length > 0 ? doneCount / missions.length : 0;
  const totalXP   = missions.filter(m => m.localStatus === "done").reduce((acc, m) => acc + m.xp_gain, 0);
  const mapH      = Math.max(80 + missions.length * MAP_STEP + 220, 600);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── HEADER ── */}
      <Animated.View style={[
        styles.header,
        { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] },
      ]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.projectTitle} numberOfLines={1}>{eventTitle ?? "Missions"}</Text>
          <ProgressBar progress={progress} />
          <Text style={styles.progressLabel}>
            {doneCount}/{missions.length} missions · {totalXP} XP gagnés
          </Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>🏆 {totalXP}</Text>
        </View>
      </Animated.View>

      {/* ── MAP ── */}
      {loading ? (
        <View style={styles.loader}>
          <Text style={styles.loaderEmoji}>🗺️</Text>
          <Text style={styles.loaderText}>Chargement de la carte...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.mapScroll}
          contentContainerStyle={{ height: mapH + 140, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: mapH, width }}>
            {/* Background sparkles */}
            <Svg width={width} height={mapH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              {Array.from({ length: 20 }, (_, i) => (
                <Circle
                  key={i}
                  cx={10 + ((i * 73) % (width - 20))}
                  cy={10 + ((i * 137) % (mapH - 20))}
                  r={1 + (i % 3)}
                  fill="#fff"
                  opacity={0.4 + (i % 3) * 0.1}
                />
              ))}
            </Svg>

            {/* Treasure chest (start) */}
            <View style={styles.chestWrapper}>
              <View style={styles.chest}>
                <Svg width={48} height={42} viewBox="0 0 52 46">
                  <Path d="M4 4 Q26 0 48 4 L48 20 Q26 16 4 20 Z" fill="#D97706" />
                  <Path d="M4 4 Q26 0 48 4 L48 10 Q26 6 4 10 Z" fill="#F59E0B" opacity={0.7} />
                  <Path d="M4 20 L4 44 Q26 48 48 44 L48 20 Q26 24 4 20 Z" fill="#D97706" />
                  <Path d="M4 20 L4 30 Q26 34 48 30 L48 20 Q26 24 4 20 Z" fill="#F59E0B" opacity={0.5} />
                  <Circle cx={26} cy={32} r={5} fill="#fff" opacity={0.8} />
                  <Circle cx={26} cy={32} r={3} fill="#D97706" />
                </Svg>
              </View>
            </View>

            {missions.length === 0 ? (
              <View style={styles.emptyMap}>
                <Text style={styles.emptyEmoji}>🌟</Text>
                <Text style={styles.emptyText}>Aucune mission pour cet événement</Text>
                <Text style={styles.emptySubText}>Crée ta première mission !</Text>
              </View>
            ) : (
              <>
                <TrailPath count={missions.length} />
                {missions.map((mission, index) => (
                  <MissionNode
                    key={mission.id_mission}
                    mission={mission}
                    index={index}
                    onPress={() => { setSelectedMission(mission); setDetailVisible(true); }}
                    onEdit={() => handleEdit(mission)}
                    onDelete={() => handleDelete(mission)}
                  />
                ))}
                {doneCount === missions.length && missions.length > 0 && (
                  <View style={[styles.trophyWrapper, { top: mapH - 110 }]}>
                    <Text style={styles.trophyEmoji}>🏆</Text>
                    <Text style={styles.trophyText}>Événement complété !</Text>
                  </View>
                )}
              </>
            )}

            {/* Hibou + bulle */}
            <View style={styles.hibouArea}>
              <SpeechBubble message={hibouMsg} />
              <HibouGuide emotion="confused" message="" size={110} />
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => { setEditData({ id_boss: Number(eventId) }); setCreateModalVisible(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.ctaBtnText}>Créer une mission</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <MissionDetailModal
        mission={selectedMission}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onStart={handleStart}
        onPause={handlePause}
        onComplete={handleComplete}
      />

      <CreateMissionModal
        visible={createModalVisible}
        onClose={() => { setCreateModalVisible(false); setEditData(null); }}
        onSave={() => { fetchMissions(); setCreateModalVisible(false); setEditData(null); }}
        initialData={editData}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: "#F5F3FF" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "android" ? 44 : 56,
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...SHADOWS.medium, zIndex: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center",
  },
  headerCenter:   { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  projectTitle:   { fontSize: 18, fontWeight: "800", color: "#2D1A5E", marginBottom: 8 },
  progressTrack:  { width: "100%", height: 8, backgroundColor: "#E9D5FF", borderRadius: 4, overflow: "hidden" },
  progressFill:   { height: "100%", backgroundColor: "#7C3AED", borderRadius: 4 },
  progressLabel:  { fontSize: 12, color: "#7C3AED", marginTop: 4, fontWeight: "600" },
  xpBadge: {
    backgroundColor: "#FEF3C7", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: "#F59E0B",
  },
  xpBadgeText:    { fontSize: 13, fontWeight: "800", color: "#92400E" },

  // Map
  mapScroll:      { flex: 1 },
  loader:         { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderEmoji:    { fontSize: 48, marginBottom: 12 },
  loaderText:     { fontSize: 16, color: "#7C3AED", fontWeight: "600" },

  // Chest
  chestWrapper:   { position: "absolute", top: 12, left: 16, zIndex: 5 },
  chest:          { backgroundColor: "#FFF8E1", borderRadius: 12, padding: 6, ...SHADOWS.light },

  // Nodes
  nodeWrapper:    { position: "absolute", zIndex: 4, maxWidth: width * 0.46 },
  nodeLeft:       { left: 10 },
  nodeRight:      { right: 10 },

  // Lock node
  lockNode: {
    width: 70, alignItems: "center",
    backgroundColor: "#F3F4F6", borderRadius: 18,
    borderWidth: 2, borderColor: "#E5E7EB",
    padding: 10, ...SHADOWS.light,
  },
  lockLabel: {
    fontSize: 10, fontWeight: "600", color: "#9CA3AF",
    textAlign: "center", marginTop: 6,
  },

  // Active/done node group
  nodeGroup:      { alignItems: "center", width: width * 0.42 },
  statusPill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 6, alignSelf: "center",
  },
  statusPillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, ...SHADOWS.medium,
    position: "relative",
  },
  avatarIcon:     { fontSize: 26 },
  coinBadge:      { position: "absolute", top: -12, right: -6 },
  nodeTitle: {
    fontSize: 12, fontWeight: "800", textAlign: "center",
    marginTop: 8, maxWidth: width * 0.38,
  },
  gainsRow:       { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6, justifyContent: "center" },
  gainChip: {
    fontSize: 10, fontWeight: "600", color: "#4C1D95",
    backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  nodeActions:    { flexDirection: "row", gap: 6, marginTop: 8 },
  actionBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  // Trophy
  trophyWrapper:  { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 5 },
  trophyEmoji:    { fontSize: 52 },
  trophyText:     { fontSize: 16, fontWeight: "800", color: "#92400E", marginTop: 4 },

  // Empty
  emptyMap:       { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 120 },
  emptyEmoji:     { fontSize: 56, marginBottom: 12 },
  emptyText:      { fontSize: 17, fontWeight: "800", color: "#4C1D95", textAlign: "center" },
  emptySubText:   { fontSize: 14, color: "#7C3AED", marginTop: 6 },

  // Hibou
  hibouArea: {
    position: "absolute", bottom: 10, left: 10,
    width: 170, zIndex: 6, alignItems: "flex-start",
  },

  // Speech Bubble
  bubbleWrapper:  { alignItems: "center", marginLeft: 10, marginBottom: 0 },
  bubble: {
    backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 8, paddingHorizontal: 12,
    maxWidth: 150, ...SHADOWS.light,
    borderWidth: 1.5, borderColor: "#C4B5E8",
  },
  bubbleText:     { fontSize: 12, fontWeight: "600", color: "#2D1A5E", textAlign: "center", lineHeight: 18 },
  bubbleArrow: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 11,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#fff",
    marginTop: -1,
  },

  // CTA
  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    paddingTop: 14, paddingHorizontal: 20,
    backgroundColor: "rgba(245,243,255,0.97)",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    ...SHADOWS.medium,
  },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 15, borderRadius: 50,
    gap: 8, ...SHADOWS.medium,
  },
  ctaBtnText:     { color: "#fff", fontSize: 16, fontWeight: "800" },
});

// ─── Detail Modal Styles ──────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  container: {
    backgroundColor: "#F5F3FF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "88%", paddingTop: 8,
  },
  handle:         { width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    marginHorizontal: 16, borderRadius: 16, marginBottom: 8,
  },
  headerIcon:     { fontSize: 36 },
  title:          { fontSize: 18, fontWeight: "800", color: "#2D1A5E", flex: 1 },
  statusPill:     { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  statusPillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...SHADOWS.light,
  },
  body:           { paddingHorizontal: 20, paddingBottom: 40 },
  section:        { marginBottom: 16 },
  sectionTitle:   { fontSize: 14, fontWeight: "800", color: "#4C1D95", marginBottom: 8 },
  desc: {
    fontSize: 14, color: "#374151", lineHeight: 22,
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: "#E9D5FF",
  },
  infoGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1, minWidth: 80, backgroundColor: "#fff", borderRadius: 14,
    padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#E9D5FF",
  },
  infoEmoji:      { fontSize: 22, marginBottom: 4 },
  infoLabel:      { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  infoVal:        { fontSize: 13, fontWeight: "800", color: "#2D1A5E", marginTop: 2 },
  ctaGroup:       { gap: 10, marginTop: 20 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 50, paddingVertical: 15, gap: 8,
  },
  ctaBtnText:     { color: "#fff", fontSize: 16, fontWeight: "800" },
});
