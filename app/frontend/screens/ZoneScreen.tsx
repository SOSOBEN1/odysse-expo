/**
 * ZoneScreen.tsx
 * ✅ Utilisation du hook useZoneMissions comme source unique de vérité
 * ✅ Correction du bug timer : les timers persistent correctement entre les navigations
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Image, Modal,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useZoneMissions, ZoneMission } from "../../../backend/viewmodels/UseZoneMission";
import SuccessModal from "../components/SuccessModal";
import ZoneUnlockedModal from "../components/ZoneUnlockedModal";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

const { width: SW } = Dimensions.get("window");
const GRID_COLS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerState = "idle" | "running" | "paused" | "done" | "fail";

interface TimerData {
  state:     TimerState;
  elapsed:   number;
  startedAt: number | null;
}

interface ZoneInfo {
  nom: string; image_url: string; accent_color: string; dark_color: string; light_color: string;
}

interface PuzzleInfo {
  id_puzzle: number; total_pieces: number; pieces_earned: number; is_complete: boolean;
}

const DIFF_LABEL: Record<number, string> = { 1: "💧 Facile", 2: "🔥 Moyen", 3: "🔥 Difficile" };
const DIFF_COLOR: Record<number, string> = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };
const DIFF_BG:    Record<number, string> = { 1: "#dcfce7", 2: "#fef3c7", 3: "#fee2e2" };

// ─── ExitConfirmModal ─────────────────────────────────────────────────────────
// (Reste inchangé)

function ExitConfirmModal({ visible, accent, onPauseAndLeave, onContinueAndLeave, onCancel }: {
  visible: boolean; accent: string;
  onPauseAndLeave: () => void; onContinueAndLeave: () => void; onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.emoji}>⏱</Text>
          <Text style={modalStyles.title}>Mission en cours</Text>
          <Text style={modalStyles.subtitle}>Une mission est en cours. Que veux-tu faire ?</Text>
          <TouchableOpacity style={[modalStyles.btn, { backgroundColor: accent }]} onPress={onPauseAndLeave}>
            <Text style={modalStyles.btnText}>⏸ Mettre en pause et quitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[modalStyles.btn, { backgroundColor: "#f59e0b" }]} onPress={onContinueAndLeave}>
            <Text style={modalStyles.btnText}>▶ Laisser tourner et quitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── EditMissionModal ─────────────────────────────────────────────────────────
// (Reste inchangé)

function EditMissionModal({ visible, mission, onSave, onCancel }: {
  visible: boolean; mission: ZoneMission | null;
  onSave: (id: number, titre: string, description: string) => void; onCancel: () => void;
}) {
  const [titre, setTitre]             = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (mission) { setTitre(mission.titre); setDescription(mission.description ?? ""); }
  }, [mission]);

  if (!mission) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.box, { paddingBottom: 24 }]}>
          <Text style={modalStyles.title}>✏️ Modifier la mission</Text>
          <Text style={editStyles.label}>Titre</Text>
          <TextInput style={editStyles.input} value={titre} onChangeText={setTitre} placeholder="Titre de la mission" maxLength={80} />
          <Text style={editStyles.label}>Description</Text>
          <TextInput style={[editStyles.input, { height: 90, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} placeholder="Description (optionnel)" multiline maxLength={300} />
          <TouchableOpacity
            style={[modalStyles.btn, { backgroundColor: "#7f5af0", marginTop: 8 }]}
            onPress={() => onSave(mission.id_mission, titre.trim(), description.trim())}
            disabled={!titre.trim()}
          >
            <Text style={modalStyles.btnText}>💾 Sauvegarder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── PuzzleCell ───────────────────────────────────────────────────────────────
// (Reste inchangé)

function PuzzleCell({ index, revealed, imageUri, cellSize, accent }: {
  index: number; revealed: boolean; imageUri: string; cellSize: number; accent: string;
}) {
  const sc    = useRef(new Animated.Value(0)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  const col     = index % GRID_COLS;
  const row     = Math.floor(index / GRID_COLS);
  const imgSize = cellSize * GRID_COLS;

  useEffect(() => {
    Animated.spring(sc, { toValue: 1, friction: 5, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (revealed) {
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 800, useNativeDriver: true }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
  }, [revealed]);

  return (
    <Animated.View style={[styles.cell, {
      width: cellSize, height: cellSize,
      borderColor: revealed ? accent : "rgba(255,255,255,0.2)",
      transform: [{ scale: sc }],
    }]}>
      {revealed ? (
        <>
          <View style={{ width: cellSize, height: cellSize, overflow: "hidden" }}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: imgSize, height: imgSize, position: "absolute", left: -(col * cellSize), top: -(row * cellSize) }}
              resizeMode="cover"
            />
          </View>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: accent + "22", borderRadius: 8, opacity: glow }]} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.65)", borderRadius: 8, opacity: flash }]} />
          <View style={[styles.cellCheck, { backgroundColor: accent }]}>
            <Ionicons name="checkmark" size={9} color="#fff" />
          </View>
        </>
      ) : (
        <View style={styles.cellLocked}>
          <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.4)" />
        </View>
      )}
    </Animated.View>
  );
}

// ─── MissionCard ──────────────────────────────────────────────────────────────

function MissionCard({ mission, timer, accent, onStart, onPause, onFinish, onRetry, onEdit }: {
  mission: ZoneMission; timer: TimerData; accent: string;
  onStart: (id: number) => void; onPause: (id: number) => void;
  onFinish: (id: number) => void; onRetry: (id: number) => void; onEdit: (m: ZoneMission) => void;
}) {
  const isDone    = timer.state === "done";
  const isFail    = timer.state === "fail";
  const isRunning = timer.state === "running";
  const isPaused  = timer.state === "paused";
  const isActive  = isRunning || isPaused;
  const totalSecs = (mission.duree_min ?? 1) * 60;
  const pct       = Math.min(100, Math.round((timer.elapsed / totalSecs) * 100));

  const fmt = (s: number) => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getBtnLabel = () => {
    if (isDone)    return "✅ Terminé";
    if (isRunning) return "⏸ Pause";
    if (isPaused)  return "▶ Continuer";
    return "▶ Démarrer";
  };

  const handleBtn = () => {
    if (isDone) return;
    if (isRunning) onPause(mission.id_mission);
    else onStart(mission.id_mission);
  };

  return (
    <View style={[styles.missionCard, isDone && { backgroundColor: "#f0fdf4" }, isFail && { backgroundColor: "#fff1f1" }]}>
      <View style={styles.missionHeader}>
        <View style={[styles.missionIconBox, { backgroundColor: DIFF_BG[mission.difficulte] ?? "#f3f4f6" }]}>
          <Text style={{ fontSize: 20 }}>{mission.difficulte === 1 ? "💧" : "🔥"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.missionTitle} numberOfLines={2}>{mission.titre}</Text>
          <View style={styles.missionMeta}>
            <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[mission.difficulte] + "22" }]}>
              <Text style={[styles.diffText, { color: DIFF_COLOR[mission.difficulte] }]}>{DIFF_LABEL[mission.difficulte]}</Text>
            </View>
            <Text style={styles.metaText}>⏱ {mission.duree_min} min</Text>
            <Text style={styles.metaText}>⚡ {mission.xp_gain} XP</Text>
            <Text style={styles.metaText}>🧩 +1 pièce</Text>
          </View>
        </View>
        {!isDone && (
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(mission)}>
            <Ionicons name="pencil" size={14} color="#9b87c9" />
          </TouchableOpacity>
        )}
      </View>

      {mission.description ? <Text style={styles.missionDesc} numberOfLines={2}>{mission.description}</Text> : null}

      {(isActive || isDone || isFail) && (
        <View style={[styles.chronoBox,
          isDone ? { backgroundColor: "#dcfce7" } : isFail ? { backgroundColor: "#fee2e2" } :
          isRunning ? { backgroundColor: "#fff7ed" } : { backgroundColor: "#f3f4f6" },
        ]}>
          <Text style={[styles.chronoText,
            isDone ? { color: "#16a34a" } : isFail ? { color: "#dc2626" } :
            isRunning ? { color: "#ea580c" } : { color: "#6b7280" },
          ]}>
            {isDone ? "✅ Mission terminée !" :
             isFail ? "❌ Temps écoulé — mission échouée" :
             `⏱ ${fmt(timer.elapsed)} / ${String(mission.duree_min).padStart(2, "0")}:00`}
          </Text>
          {isActive && <View style={[styles.chronoPulse, { backgroundColor: isRunning ? "#ea580c" : "#9ca3af" }]} />}
        </View>
      )}

      <View style={styles.missionBottom}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${pct}%` as any,
              backgroundColor: isDone ? "#22c55e" : isFail ? "#ef4444" : accent,
            }]} />
          </View>
          <Text style={[styles.pctText, { color: isDone ? "#22c55e" : isFail ? "#ef4444" : accent }]}>
            {isDone ? "Terminé ✓" : isFail ? "Échoué ✗" : timer.state === "idle" ? "Non commencé" : `${pct}%`}
          </Text>
        </View>
        <View style={styles.btnGroup}>
          {isFail && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]} onPress={() => onRetry(mission.id_mission)}>
              <Text style={styles.actionBtnText}>🔄 Recommencer</Text>
            </TouchableOpacity>
          )}
          {!isFail && (
            <>
              {isActive && (
                <TouchableOpacity style={styles.finishBtn} onPress={() => onFinish(mission.id_mission)}>
                  <Text style={{ fontSize: 18 }}>🏁</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDone ? "#22c55e" : accent, opacity: isDone ? 0.8 : 1 }]}
                onPress={handleBtn} disabled={isDone}
              >
                <Text style={styles.actionBtnText}>{getBtnLabel()}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── EmptySlot ────────────────────────────────────────────────────────────────

function EmptySlot({ index, suggestions, onAccept, onCreateNew, accent }: {
  index: number; suggestions: any[];
  onAccept: (m: any) => void; onCreateNew: () => void; accent: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[styles.missionCard, { borderStyle: "dashed", borderWidth: 2, borderColor: accent + "55", backgroundColor: "#faf9ff" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: accent, fontWeight: "700", fontSize: 14 }}>🧩 Emplacement {index + 1}</Text>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: accent }]} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.actionBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>
      {expanded && (
        <View style={{ marginTop: 12, gap: 8 }}>
          {suggestions.length > 0 && (
            <>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280" }}>Suggestions :</Text>
              {suggestions.slice(0, 3).map(s => (
                <TouchableOpacity
                  key={s.id_mission}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f3f0ff", borderRadius: 10, padding: 10 }}
                  onPress={() => { onAccept(s); setExpanded(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#2d1a6e" }}>{s.titre}</Text>
                    <Text style={{ fontSize: 11, color: "#9b87c9" }}>+{s.xp_gain} XP</Text>
                  </View>
                  <Text style={{ color: accent, fontWeight: "800" }}>✓</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          <TouchableOpacity
            style={{ borderWidth: 1.5, borderColor: accent, borderStyle: "dashed", borderRadius: 10, padding: 10, alignItems: "center" }}
            onPress={() => { onCreateNew(); setExpanded(false); }}
          >
            <Text style={{ color: accent, fontWeight: "700" }}>✏️ Créer une nouvelle mission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ZoneScreen() {
  const router                = useRouter();
  const { userId: rawUserId } = useUser();
  const { zoneId, zoneSlug }  = useLocalSearchParams<{ zoneId: string; zoneSlug: string }>();

  if (!rawUserId) return null;
  const userId = rawUserId;

  // ✅ État local UNIQUEMENT pour l'UI (modales, animations)
  const [zoneInfo,  setZoneInfo]  = useState<ZoneInfo | null>(null);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [showUnlocked,   setShowUnlocked]   = useState(false);
  const [currentMission, setCurrentMission] = useState<ZoneMission | null>(null);
  const [nextZoneName,   setNextZoneName]   = useState("");
  const pendingUnlock = useRef(false);
  const [showExitModal,  setShowExitModal]  = useState(false);
  const [editingMission, setEditingMission] = useState<ZoneMission | null>(null);
  const [saving,    setSaving]    = useState(false);

  const bgFade    = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const progressW = useRef(new Animated.Value(0)).current;

  const CELL_SIZE = Math.floor((SW - 48) / GRID_COLS) - 4;

  // ✅ Utilisation du hook useZoneMissions comme source unique de vérité
  const {
    missions,
    slots,
    suggestions,
    timers,
    puzzle,
    loading,
    doneMissions,
    getTimer,
    startTimer,
    pauseTimer,
    finishTimer,
    retryTimer,
    hasRunningTimer,
    pauseAllRunning,
    saveAllRunningForBackground,
    markDone,
    updatePuzzle,
    acceptSuggestion,
  } = useZoneMissions(userId, Number(zoneId), puzzle?.total_pieces ?? 3);

  const totalPieces = puzzle?.total_pieces ?? 3;
  const piecesEarned = puzzle?.pieces_earned ?? 0;
  const isComplete = puzzle?.is_complete ?? false;
  const imageUri = zoneInfo?.image_url ?? "";
  const accent = zoneInfo?.accent_color ?? "#22c55e";

  // ✅ Chargement unique des infos de zone (indépendant des missions/timers)
  useEffect(() => {
    const loadZoneInfo = async () => {
      const numId = Number(zoneId);
      const { data: zone } = await supabase
        .from("zone")
        .select("nom, image_url, accent_color, dark_color, light_color")
        .eq("id_zone", numId)
        .single();
      if (zone) setZoneInfo(zone);
    };
    loadZoneInfo();
  }, [zoneId]);

  // ✅ Animation d'entrée (une seule fois)
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(bgFade,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, friction: 7, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  // ✅ Mise à jour de la progression du puzzle
  useEffect(() => {
    if (puzzle) {
      Animated.timing(progressW, {
        toValue: puzzle.total_pieces > 0 ? (puzzle.pieces_earned / puzzle.total_pieces) * 100 : 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [puzzle]);

  // ✅ Gestion du retour arrière
  const handleBack = useCallback(() => {
    if (hasRunningTimer()) setShowExitModal(true);
    else router.back();
  }, [hasRunningTimer, router]);

  // ✅ Gestion de la modale de sortie
  const handlePauseAndLeave = useCallback(() => {
    pauseAllRunning();
    setShowExitModal(false);
    router.back();
  }, [pauseAllRunning, router]);

  const handleContinueAndLeave = useCallback(async () => {
    await saveAllRunningForBackground();
    setShowExitModal(false);
    router.back();
  }, [saveAllRunningForBackground, router]);

  // ✅ Gestion de la fin de mission
  const handleFinish = useCallback(async (id: number) => {
    const t = getTimer(id);
    if (t.state === "done" || t.state === "fail") return;
    if (saving) return;

    setSaving(true);
    const mission = missions.find(m => m.id_mission === id);
    setCurrentMission(mission || null);

    try {
      const { data, error } = await supabase.rpc("complete_mission", {
        p_user_id:    userId,
        p_mission_id: id,
      });

      if (error) { console.error("RPC error:", error); return; }
      if (data?.error) {
        if (data.error !== "mission_already_done") console.error("Mission error:", data.error);
        return;
      }

      // ✅ Informer le hook
      finishTimer(id);
      markDone(id);

      // ✅ Mettre à jour le puzzle dans le hook
      if (data.pieces_earned !== undefined) {
        updatePuzzle({
          pieces_earned: data.pieces_earned,
          is_complete: data.puzzle_complete,
        });
      }

      if (data.zone_unlocked && data.next_zone_id) {
        const { data: nextZone } = await supabase
          .from("zone").select("nom").eq("id_zone", data.next_zone_id).single();
        setNextZoneName(nextZone?.nom ?? "Zone suivante");
        pendingUnlock.current = true;
      }

      const allDone = missions.filter(m => m.id_mission !== id ? m.done : true).every(m => m.done) 
                      && missions.length === totalPieces;
      if (allDone) {
        const totalXp = missions.reduce((sum, m) => sum + (m.xp_gain ?? 0), 0);
        await supabase.rpc("add_xp", { p_user_id: userId, p_xp: totalXp });
        setTimeout(() => setShowUnlocked(true), 1500);
      }

      setShowSuccess(true);
    } finally {
      setSaving(false);
    }
  }, [missions, saving, userId, finishTimer, markDone, updatePuzzle, getTimer, totalPieces]);

  // ✅ Gestion de l'édition de mission
  const handleSaveEdit = useCallback(async (id: number, titre: string, description: string) => {
    try {
      await supabase.from("mission").update({ titre, description }).eq("id_mission", id);
    } catch (e) {
      console.error("Edit mission error:", e);
    } finally {
      setEditingMission(null);
    }
  }, []);

  // ✅ Rendu
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#7f5af0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} />
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{zoneInfo?.nom ?? zoneSlug}</Text>
        <View style={[styles.pieceBadge, { backgroundColor: accent }]}>
          <Text style={styles.pieceBadgeText}>🧩 {piecesEarned}/{totalPieces}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlide }] }]}>
          {/* Puzzle */}
          <View style={styles.puzzleSection}>
            <Text style={styles.sectionTitle}>Puzzle de zone</Text>
            <View style={styles.puzzleGrid}>
              {Array.from({ length: totalPieces }).map((_, i) => (
                <PuzzleCell
                  key={i} index={i} revealed={i < piecesEarned}
                  imageUri={imageUri} cellSize={CELL_SIZE} accent={accent}
                />
              ))}
            </View>
            <View style={styles.puzzleProgress}>
              <View style={styles.puzzleProgressHeader}>
                <Text style={styles.puzzleProgressLabel}>
                  {isComplete ? "🎉 Zone révélée !" : `${piecesEarned}/${totalPieces} pièces`}
                </Text>
                <Text style={[styles.puzzleProgressPct, { color: accent }]}>
                  {Math.round((piecesEarned / Math.max(totalPieces, 1)) * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, {
                  backgroundColor: accent,
                  width: progressW.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                }]} />
              </View>
            </View>
            {isComplete && (
              <View style={styles.revealedBox}>
                <Image source={{ uri: imageUri }} style={styles.revealedImage} resizeMode="cover" />
                <View style={styles.revealedBanner}>
                  <Text style={styles.revealedText}>🎉 Zone révélée !</Text>
                </View>
              </View>
            )}
          </View>

          {/* Missions avec slots - Utilisation des slots du hook */}
          <Text style={styles.sectionTitle}>Missions ({doneMissions}/{totalPieces})</Text>
          {slots.map((m, i) =>
            m ? (
              <MissionCard
                key={m.id_mission}
                mission={m}
                timer={getTimer(m.id_mission)}
                accent={accent}
                onStart={startTimer}
                onPause={pauseTimer}
                onFinish={handleFinish}
                onRetry={retryTimer}
                onEdit={setEditingMission}
              />
            ) : (
              <EmptySlot
                key={`slot-${i}`}
                index={i}
                suggestions={suggestions}
                onAccept={acceptSuggestion}
                onCreateNew={() => {}}
                accent={accent}
              />
            )
          )}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <ExitConfirmModal
        visible={showExitModal}
        accent={accent}
        onPauseAndLeave={handlePauseAndLeave}
        onContinueAndLeave={handleContinueAndLeave}
        onCancel={() => setShowExitModal(false)}
      />

      <EditMissionModal
        visible={!!editingMission}
        mission={editingMission}
        onSave={handleSaveEdit}
        onCancel={() => setEditingMission(null)}
      />

      <SuccessModal
        visible={showSuccess}
        xp={currentMission?.xp_gain ?? 20}
        missionImg={undefined}
        onContinue={() => {
          setShowSuccess(false);
          if (pendingUnlock.current) {
            pendingUnlock.current = false;
            setTimeout(() => setShowUnlocked(true), 500);
          }
        }}
      />

      <ZoneUnlockedModal
        visible={showUnlocked}
        zoneName={nextZoneName}
        zoneImage={imageUri}
        onExplore={() => { setShowUnlocked(false); router.back(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// (Restent inchangés)

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#000" },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12, zIndex: 10 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#fff", flex: 1, textAlign: "center", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  pieceBadge:  { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  pieceBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  scroll: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 6 },
  card:   { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 26, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2d1a6e", marginBottom: 12 },
  puzzleSection: { marginBottom: 20 },
  puzzleGrid:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 12 },
  puzzleProgress: { marginBottom: 8 },
  puzzleProgressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  puzzleProgressLabel:  { fontSize: 13, fontWeight: "700", color: "#2d1a6e" },
  puzzleProgressPct:    { fontSize: 13, fontWeight: "900" },
  revealedBox:    { borderRadius: 16, overflow: "hidden", marginTop: 8, position: "relative" },
  revealedImage:  { width: "100%", height: 180 },
  revealedBanner: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 8, alignItems: "center" },
  revealedText:   { color: "#fff", fontWeight: "900", fontSize: 16 },
  progressTrack: { height: 10, backgroundColor: "#e8e0ff", borderRadius: 10, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 10 },
  cell:       { borderRadius: 8, overflow: "hidden", borderWidth: 2, margin: 2, elevation: 3 },
  cellCheck:  { position: "absolute", bottom: 3, right: 3, width: 15, height: 15, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#fff" },
  cellLocked: { flex: 1, backgroundColor: "rgba(40,10,100,0.55)", justifyContent: "center", alignItems: "center" },
  missionCard:   { backgroundColor: "#f8f7ff", borderRadius: 18, padding: 12, marginBottom: 12, shadowColor: "#7f5af0", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  missionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  missionIconBox:{ width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  missionTitle:  { fontSize: 14, fontWeight: "700", color: "#2d1a6e", marginBottom: 4, lineHeight: 19 },
  missionMeta:   { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  missionDesc:   { fontSize: 12, color: "#6b7280", lineHeight: 17, marginBottom: 8 },
  diffPill:      { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffText:      { fontSize: 10, fontWeight: "700" },
  metaText:      { fontSize: 10, color: "#9b87c9", fontWeight: "600" },
  chronoBox:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  chronoText:    { fontSize: 13, fontWeight: "700" },
  chronoPulse:   { width: 8, height: 8, borderRadius: 4 },
  missionBottom: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  pctText:       { fontSize: 11, fontWeight: "700", marginTop: 3 },
  btnGroup:      { flexDirection: "row", gap: 6, alignItems: "center" },
  finishBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  actionBtn:     { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 14 },
  actionBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  editBtn:       { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f3f0ff", justifyContent: "center", alignItems: "center", marginLeft: 4 },
});

const modalStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  box:        { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  emoji:      { fontSize: 40, marginBottom: 8 },
  title:      { fontSize: 18, fontWeight: "900", color: "#2d1a6e", marginBottom: 6, textAlign: "center" },
  subtitle:   { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 20, lineHeight: 19 },
  btn:        { width: "100%", borderRadius: 16, paddingVertical: 13, alignItems: "center", marginBottom: 10 },
  btnText:    { color: "#fff", fontWeight: "800", fontSize: 14 },
  cancelBtn:  { marginTop: 4, paddingVertical: 8 },
  cancelText: { color: "#9b87c9", fontWeight: "600", fontSize: 13 },
});

const editStyles = StyleSheet.create({
  label: { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", color: "#7f5af0", marginBottom: 4, marginTop: 12 },
  input: { width: "100%", borderWidth: 1.5, borderColor: "#e8e0ff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2d1a6e", backgroundColor: "#fafafe" },
});