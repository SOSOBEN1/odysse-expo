// screens/MissionMapScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Animated, StatusBar, Platform, Alert, Modal,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../constants/supabase";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import CreateMissionModal from "../components/CreateMissionModal";

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
  // status géré localement (pas en DB dans ton schéma)
  localStatus: MissionStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DIFF_LABELS: Record<number, string> = { 1: "Facile", 2: "Moyen", 3: "Difficile" };
const PRIO_LABELS: Record<number, string> = { 1: "Basse", 2: "Normale", 3: "Haute", 4: "Urgente" };
const PRIO_COLORS: Record<number, string> = {
  1: "#6EE7B7", 2: "#60A5FA", 3: "#FBBF24", 4: "#F87171",
};
const DIFF_ICONS: Record<number, string> = { 1: "⚡", 2: "🔥", 3: "💀" };
const MAP_STEP = 150; // px entre chaque nœud

// ─── Calcul des positions en zigzag ──────────────────────────────────────────
const getNodePosition = (index: number): { top: number; isLeft: boolean } => ({
  top: 60 + index * MAP_STEP,
  isLeft: index % 2 === 0,
});

// ─── SVG Trail dynamique ──────────────────────────────────────────────────────
const TrailPath = ({ count }: { count: number }) => {
  if (count === 0) return null;
  const cx = width / 2;
  let d = "";
  for (let i = 0; i < count; i++) {
    const { top, isLeft } = getNodePosition(i);
    const x = isLeft ? width * 0.28 : width * 0.72;
    if (i === 0) {
      d += `M ${x} ${top + 30}`;
    } else {
      const { top: prevTop, isLeft: prevLeft } = getNodePosition(i - 1);
      const prevX = prevLeft ? width * 0.28 : width * 0.72;
      const midY = (prevTop + top) / 2;
      d += ` C ${prevX} ${midY}, ${x} ${midY}, ${x} ${top + 30}`;
    }
  }
  const mapH = 60 + count * MAP_STEP + 100;

  const sparkles: { x: number; y: number }[] = [];
  for (let i = 0; i < count - 1; i++) {
    const { top: t1, isLeft: l1 } = getNodePosition(i);
    const { top: t2, isLeft: l2 } = getNodePosition(i + 1);
    sparkles.push({
      x: (l1 ? width * 0.28 : width * 0.72),
      y: (t1 + t2) / 2,
    });
  }

  return (
    <Svg width={width} height={mapH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Ombre */}
      <Path d={d} stroke="#C4B5E8" strokeWidth={24} strokeLinecap="round" fill="none" opacity={0.3} />
      {/* Chemin principal */}
      <Path d={d} stroke="#E9D5FF" strokeWidth={14} strokeLinecap="round" fill="none"
        strokeDasharray="2 20" />
      {sparkles.map((s, i) => (
        <React.Fragment key={i}>
          <Circle cx={s.x} cy={s.y} r={3.5} fill="#fff" opacity={0.7} />
          <Circle cx={s.x} cy={s.y} r={7} fill="#fff" opacity={0.12} />
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

// ─── Mission Card (nœud sur la carte) ────────────────────────────────────────
interface MissionNodeProps {
  mission: Mission;
  index: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG: Record<MissionStatus, { color: string; bg: string; icon: string; label: string }> = {
  locked:      { color: "#9CA3AF", bg: "#F3F4F6", icon: "🔒", label: "Verrouillée" },
  active:      { color: "#7C3AED", bg: "#EDE9FE", icon: "⭐", label: "Disponible" },
  in_progress: { color: "#F59E0B", bg: "#FEF3C7", icon: "⚡", label: "En cours" },
  paused:      { color: "#3B82F6", bg: "#EFF6FF", icon: "⏸️", label: "En pause" },
  done:        { color: "#10B981", bg: "#D1FAE5", icon: "✅", label: "Terminée" },
};

const MissionNode = ({ mission, index, onPress, onEdit, onDelete }: MissionNodeProps) => {
  const { top, isLeft } = getNodePosition(index);
  const cfg = STATUS_CONFIG[mission.localStatus];
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay: index * 100, useNativeDriver: true, tension: 60, friction: 8,
    }).start();

    if (mission.localStatus === "in_progress" || mission.localStatus === "active") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mission.localStatus]);

  const isLocked = mission.localStatus === "locked";

  return (
    <Animated.View style={[
      styles.nodeWrapper,
      isLeft ? styles.nodeLeft : styles.nodeRight,
      { top, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
    ]}>
      {/* Badge statut */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
        <Text style={styles.statusBadgeText}>{cfg.label}</Text>
      </View>

      <Animated.View style={[{ transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={[styles.nodeCard, { backgroundColor: cfg.bg, borderColor: cfg.color + "55" }]}
          onPress={onPress}
          disabled={isLocked}
          activeOpacity={0.85}
        >
          {/* Icône + titre */}
          <View style={styles.nodeTop}>
            <View style={[styles.nodeIconBox, { backgroundColor: cfg.color }]}>
              <Text style={styles.nodeIcon}>{cfg.icon}</Text>
            </View>
            <View style={styles.nodeTitleBox}>
              <Text style={[styles.nodeTitle, isLocked && { color: "#9CA3AF" }]} numberOfLines={2}>
                {mission.titre}
              </Text>
              <View style={styles.nodeMetaRow}>
                <Text style={styles.nodeMeta}>{DIFF_ICONS[mission.difficulte]} {DIFF_LABELS[mission.difficulte]}</Text>
                <View style={[styles.prioBadge, { backgroundColor: PRIO_COLORS[mission.priorite] + "33", borderColor: PRIO_COLORS[mission.priorite] }]}>
                  <Text style={[styles.prioText, { color: PRIO_COLORS[mission.priorite] }]}>
                    {PRIO_LABELS[mission.priorite]}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Gains */}
          {!isLocked && (
            <View style={styles.gainsRow}>
              <Text style={styles.gainChip}>🏆 +{mission.xp_gain} XP</Text>
              {mission.duree_min && <Text style={styles.gainChip}>⏱ {mission.duree_min} min</Text>}
              {mission.date_limite && (
                <Text style={[styles.gainChip, { color: "#EF4444" }]}>
                  📅 {new Date(mission.date_limite).toLocaleDateString("fr-FR")}
                </Text>
              )}
            </View>
          )}

          {/* Actions edit/delete */}
          {!isLocked && (
            <View style={styles.nodeActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                <Ionicons name="pencil-outline" size={14} color="#7C3AED" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
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
          {/* Handle */}
          <View style={detailStyles.handle} />

          {/* Header */}
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
            {/* Description */}
            {mission.description && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>📋 Description</Text>
                <Text style={detailStyles.desc}>{mission.description}</Text>
              </View>
            )}

            {/* Infos */}
            <View style={detailStyles.infoGrid}>
              <View style={detailStyles.infoCard}>
                <Text style={detailStyles.infoEmoji}>{DIFF_ICONS[mission.difficulte]}</Text>
                <Text style={detailStyles.infoLabel}>Difficulté</Text>
                <Text style={detailStyles.infoVal}>{DIFF_LABELS[mission.difficulte]}</Text>
              </View>
              <View style={detailStyles.infoCard}>
                <Text style={detailStyles.infoEmoji}>🎯</Text>
                <Text style={detailStyles.infoLabel}>Priorité</Text>
                <Text style={[detailStyles.infoVal, { color: PRIO_COLORS[mission.priorite] }]}>
                  {PRIO_LABELS[mission.priorite]}
                </Text>
              </View>
              {mission.duree_min && (
                <View style={detailStyles.infoCard}>
                  <Text style={detailStyles.infoEmoji}>⏱</Text>
                  <Text style={detailStyles.infoLabel}>Durée</Text>
                  <Text style={detailStyles.infoVal}>{mission.duree_min} min</Text>
                </View>
              )}
              {mission.date_limite && (
                <View style={detailStyles.infoCard}>
                  <Text style={detailStyles.infoEmoji}>📅</Text>
                  <Text style={detailStyles.infoLabel}>Limite</Text>
                  <Text style={detailStyles.infoVal}>
                    {new Date(mission.date_limite).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
              )}
            </View>

            {/* Gains */}
            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>✨ Gains</Text>
              <View style={detailStyles.gainsGrid}>
                {[
                  { icon: "🏆", label: "XP", val: `+${mission.xp_gain}` },
                  { icon: "⚡", label: "Énergie", val: `-${mission.energie_cout}` },
                  { icon: "📚", label: "Connaissance", val: `+${mission.connaissance_gain}` },
                  { icon: "📋", label: "Organisation", val: `+${mission.organisation_gain}` },
                ].map(g => (
                  <View key={g.label} style={detailStyles.gainBox}>
                    <Text style={detailStyles.gainIcon}>{g.icon}</Text>
                    <Text style={detailStyles.gainVal}>{g.val}</Text>
                    <Text style={detailStyles.gainLabel}>{g.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA Buttons */}
            <View style={detailStyles.ctaGroup}>
              {mission.localStatus === "active" && (
                <TouchableOpacity style={[detailStyles.ctaBtn, { backgroundColor: "#7C3AED" }]} onPress={onStart}>
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={detailStyles.ctaBtnText}>Commencer la mission</Text>
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
                    <Text style={detailStyles.ctaBtnText}>Terminer la mission ✅</Text>
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
                  <Text style={[detailStyles.ctaBtnText, { color: "#10B981" }]}>Mission accomplie ! 🎉</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MissionMapScreen() {
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId: string; eventTitle: string }>();
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // statuts locaux : id_mission -> MissionStatus
  const [localStatuses, setLocalStatuses] = useState<Record<number, MissionStatus>>({});

  // ── Chargement des missions liées à cet événement ──────────────────────────
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

      // Calcul des statuts : la 1ère non-terminée est "active", les suivantes "locked"
      const statuses: Record<number, MissionStatus> = {};
      let firstActiveSet = false;
      (data ?? []).forEach((m, i) => {
        const prev = statuses;
        const prevDone = i === 0 || Object.values(statuses).every(s => s === "done") ||
          (data[i - 1] && (localStatuses[data[i - 1].id_mission] === "done" || statuses[data[i - 1].id_mission] === "done"));

        if (localStatuses[m.id_mission]) {
          statuses[m.id_mission] = localStatuses[m.id_mission];
        } else if (!firstActiveSet) {
          statuses[m.id_mission] = "active";
          firstActiveSet = true;
        } else {
          statuses[m.id_mission] = "locked";
        }
      });

      const withStatus: Mission[] = (data ?? []).map((m, i) => ({
        ...m,
        localStatus: localStatuses[m.id_mission] ?? (i === 0 ? "active" : "locked"),
      }));

      setMissions(withStatus);
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, localStatuses]);

  useFocusEffect(useCallback(() => { fetchMissions(); }, [eventId]));

  // Recalcul des statuts après changement de localStatuses
  const getMissionsWithStatuses = (raw: Mission[]): Mission[] => {
    let firstActiveFound = false;
    return raw.map((m) => {
      const ls = localStatuses[m.id_mission];
      if (ls) return { ...m, localStatus: ls };
      if (!firstActiveFound) { firstActiveFound = true; return { ...m, localStatus: "active" }; }
      return { ...m, localStatus: "locked" };
    });
  };

  // Recompute lors du changement de statuts locaux
  useEffect(() => {
    setMissions(prev => {
      let firstActiveFound = false;
      return prev.map((m) => {
        const ls = localStatuses[m.id_mission];
        if (ls) return { ...m, localStatus: ls };
        if (!firstActiveFound) { firstActiveFound = true; return { ...m, localStatus: "active" }; }
        return { ...m, localStatus: "locked" };
      });
    });
  }, [localStatuses]);

  // ── Actions sur les missions ───────────────────────────────────────────────
  const handleStart = () => {
    if (!selectedMission) return;
    setLocalStatuses(prev => ({ ...prev, [selectedMission.id_mission]: "in_progress" }));
    setSelectedMission(prev => prev ? { ...prev, localStatus: "in_progress" } : null);
  };

  const handlePause = () => {
    if (!selectedMission) return;
    setLocalStatuses(prev => ({ ...prev, [selectedMission.id_mission]: "paused" }));
    setSelectedMission(prev => prev ? { ...prev, localStatus: "paused" } : null);
  };

  const handleComplete = () => {
    if (!selectedMission) return;
    const id = selectedMission.id_mission;

    setLocalStatuses(prev => {
      const updated = { ...prev, [id]: "done" as MissionStatus };
      // Déverrouiller la suivante
      const currentIndex = missions.findIndex(m => m.id_mission === id);
      const next = missions[currentIndex + 1];
      if (next && !prev[next.id_mission]) {
        updated[next.id_mission] = "active";
      }
      return updated;
    });

    setDetailVisible(false);
    Alert.alert("🎉 Mission terminée !", `Tu as gagné ${selectedMission.xp_gain} XP !`, [
      { text: "Super !", style: "default" }
    ]);
  };

  const handleDelete = (mission: Mission) => {
    Alert.alert("Supprimer", `Supprimer "${mission.titre}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("mission")
            .delete()
            .eq("id_mission", mission.id_mission);
          if (error) { Alert.alert("Erreur", error.message); return; }
          setMissions(prev => prev.filter(m => m.id_mission !== mission.id_mission));
        },
      },
    ]);
  };

  const handleEdit = (mission: Mission) => {
    setEditData({
      id_mission:         mission.id_mission,
      titre:              mission.titre,
      description:        mission.description,
      duree_min:          mission.duree_min,
      difficulte:         mission.difficulte,
      priorite:           mission.priorite,
      date_limite:        mission.date_limite,
      id_boss:            mission.id_boss,
    });
    setCreateModalVisible(true);
  };

  const handleSave = (saved: any) => {
    setMissions(prev => {
      const exists = prev.find(m => m.id_mission === saved.id_mission);
      const withStatus = { ...saved, localStatus: localStatuses[saved.id_mission] ?? "active" };
      if (exists) return prev.map(m => m.id_mission === saved.id_mission ? withStatus : m);
      return [...prev, { ...withStatus, localStatus: prev.length === 0 ? "active" : "locked" }];
    });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const doneCount = missions.filter(m => m.localStatus === "done").length;
  const progress = missions.length > 0 ? doneCount / missions.length : 0;
  const totalXP = missions.filter(m => m.localStatus === "done").reduce((acc, m) => acc + m.xp_gain, 0);
  const mapH = Math.max(60 + missions.length * 150 + 180, 500);

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
        { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }
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

        <View style={styles.headerRight}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>🏆 {totalXP}</Text>
          </View>
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

            {/* Étoiles déco */}
            <Svg width={width} height={mapH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              {Array.from({ length: 20 }, (_, i) => {
                const sx = 10 + ((i * 73) % (width - 20));
                const sy = 10 + ((i * 137) % (mapH - 20));
                const sr = 1 + (i % 3);
                return <Circle key={i} cx={sx} cy={sy} r={sr} fill="#fff" opacity={0.4 + (i % 3) * 0.1} />;
              })}
            </Svg>

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

                {/* Trophée en bas si tout complété */}
                {doneCount === missions.length && missions.length > 0 && (
                  <View style={[styles.trophyWrapper, { top: mapH - 100 }]}>
                    <Text style={styles.trophyEmoji}>🏆</Text>
                    <Text style={styles.trophyText}>Événement complété !</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── CTA Créer mission ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => { setEditData({ id_boss: Number(eventId) }); setCreateModalVisible(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.ctaBtnText}>Créer une mission</Text>
        </TouchableOpacity>
      </View>

      {/* ── Mission Detail Modal ── */}
      <MissionDetailModal
        mission={selectedMission}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onStart={handleStart}
        onPause={handlePause}
        onComplete={handleComplete}
      />

      {/* ── Create / Edit Modal ── */}
      <CreateMissionModal
        visible={createModalVisible}
        onClose={() => { setCreateModalVisible(false); setEditData(null); }}
        onSave={(saved) => { handleSave(saved); setCreateModalVisible(false); setEditData(null); }}
        initialData={editData}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F3FF" },

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
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  projectTitle: { fontSize: 18, fontWeight: "800", color: "#2D1A5E", marginBottom: 8 },
  progressTrack: {
    width: "100%", height: 8, backgroundColor: "#E9D5FF",
    borderRadius: 4, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: "#7C3AED", marginTop: 4, fontWeight: "600" },
  headerRight: { alignItems: "center" },
  xpBadge: {
    backgroundColor: "#FEF3C7", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: "#F59E0B",
  },
  xpBadgeText: { fontSize: 13, fontWeight: "800", color: "#92400E" },

  // Map
  mapScroll: { flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderEmoji: { fontSize: 48, marginBottom: 12 },
  loaderText: { fontSize: 16, color: "#7C3AED", fontWeight: "600" },
  emptyMap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 120 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: "800", color: "#4C1D95", textAlign: "center" },
  emptySubText: { fontSize: 14, color: "#7C3AED", marginTop: 6 },

  // Nodes
  nodeWrapper: { position: "absolute", zIndex: 4, maxWidth: width * 0.52 },
  nodeLeft: { left: 12 },
  nodeRight: { right: 12 },
  statusBadge: {
    alignSelf: "flex-start", borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
    marginLeft: 10, marginBottom: -10, zIndex: 2,
  },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  nodeCard: {
    borderRadius: 18, padding: 12, borderWidth: 1.5,
    ...SHADOWS.medium,
  },
  nodeTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  nodeIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nodeIcon: { fontSize: 20 },
  nodeTitleBox: { flex: 1 },
  nodeTitle: { fontSize: 13, fontWeight: "800", color: "#2D1A5E", lineHeight: 18 },
  nodeMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  nodeMeta: { fontSize: 11, color: "#7C3AED", fontWeight: "600" },
  prioBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  prioText: { fontSize: 10, fontWeight: "700" },
  gainsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  gainChip: {
    fontSize: 10, fontWeight: "600", color: "#4C1D95",
    backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  nodeActions: { flexDirection: "row", gap: 6, marginTop: 8, justifyContent: "flex-end" },
  actionBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  // Trophy
  trophyWrapper: {
    position: "absolute", left: 0, right: 0,
    alignItems: "center", zIndex: 5,
  },
  trophyEmoji: { fontSize: 52 },
  trophyText: { fontSize: 16, fontWeight: "800", color: "#92400E", marginTop: 4 },

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
    backgroundColor: COLORS.primary,
    paddingVertical: 15, borderRadius: 50,
    gap: 8, ...SHADOWS.medium,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

// ─── Detail Modal Styles ──────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  container: {
    backgroundColor: "#F5F3FF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "88%", paddingTop: 8,
  },
  handle: {
    width: 40, height: 4, backgroundColor: "#D1D5DB",
    borderRadius: 2, alignSelf: "center", marginBottom: 12,
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    marginHorizontal: 16, borderRadius: 16, marginBottom: 8,
  },
  headerIcon: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: "800", color: "#2D1A5E", flex: 1 },
  statusPill: {
    alignSelf: "flex-start", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  statusPillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    ...SHADOWS.light,
  },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#4C1D95", marginBottom: 8 },
  desc: {
    fontSize: 14, color: "#374151", lineHeight: 22,
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: "#E9D5FF",
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1, minWidth: 80, backgroundColor: "#fff", borderRadius: 14,
    padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#E9D5FF",
  },
  infoEmoji: { fontSize: 22, marginBottom: 4 },
  infoLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  infoVal: { fontSize: 13, fontWeight: "800", color: "#2D1A5E", marginTop: 2 },
  gainsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gainBox: {
    flex: 1, minWidth: 70, backgroundColor: "#fff", borderRadius: 14,
    padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#E9D5FF",
  },
  gainIcon: { fontSize: 20, marginBottom: 4 },
  gainVal: { fontSize: 15, fontWeight: "800", color: "#4C1D95" },
  gainLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  ctaGroup: { gap: 10, marginTop: 20 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 50, paddingVertical: 15, gap: 8,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
