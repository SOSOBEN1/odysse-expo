/**
 * ZoneScreen.tsx
 * - Slots = total_pieces du puzzle
 * - Suggestions = missions user sans id_zone (idle)
 * - Timer identique à useMissions (AsyncStorage + validation BDD)
 * - Terminer = finishMissionSession + pièce puzzle débloquée
 * - Échouer = failMissionSession + modal fail
 * - Toutes terminées = zone débloquée
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Image, Modal,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useZoneMissions, ZoneMission, ZoneTimer } from "../../../backend/viewmodels/UseZoneMission";
import CreateMissionModal from "../components/CreateMissionModal";
import MissionStatusModal from "../components/MissionStatusModals";
import ZoneUnlockedModal from "../components/ZoneUnlockedModal";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

const { width: SW } = Dimensions.get("window");
const GRID_COLS = 3;

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ZoneInfo {
  nom: string;
  image_url: string;
  accent_color: string;
  dark_color: string;
  light_color: string;
}

const DIFF_LABEL: Record<number, string> = { 1: "💧 Facile", 2: "🔥 Moyen", 3: "🔥 Difficile" };
const DIFF_COLOR: Record<number, string> = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };
const DIFF_BG: Record<number, string>    = { 1: "#dcfce7", 2: "#fef3c7", 3: "#fee2e2" };

// ─── ExitConfirmModal ─────────────────────────────────────────────────────────

function ExitConfirmModal({
  visible, accent, onPauseAndLeave, onContinueAndLeave, onCancel,
}: {
  visible: boolean; accent: string;
  onPauseAndLeave: () => void; onContinueAndLeave: () => void; onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.box}>
          <Text style={modalStyles.emoji}>⏱</Text>
          <Text style={modalStyles.title}>Mission en cours</Text>
          <Text style={modalStyles.subtitle}>Une mission tourne encore. Que veux-tu faire ?</Text>
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

function EditMissionModal({
  visible, mission, onSave, onCancel,
}: {
  visible: boolean; mission: ZoneMission | null;
  onSave: (id: number, titre: string, description: string) => void;
  onCancel: () => void;
}) {
  const [titre, setTitre] = useState("");
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
          <TextInput
            style={editStyles.input} value={titre} onChangeText={setTitre}
            placeholder="Titre de la mission" maxLength={80}
          />
          <Text style={editStyles.label}>Description</Text>
          <TextInput
            style={[editStyles.input, { height: 90, textAlignVertical: "top" }]}
            value={description} onChangeText={setDescription}
            placeholder="Description (optionnel)" multiline maxLength={300}
          />
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

function PuzzleCell({
  index, revealed, imageUri, cellSize, accent,
}: {
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

function MissionCard({
  mission, timer, accent,
  onStart, onPause, onFinish, onRetry, onEdit,
}: {
  mission: ZoneMission; timer: ZoneTimer; accent: string;
  onStart: (id: number) => void; onPause: (id: number) => void;
  onFinish: (id: number) => void; onRetry: (id: number) => void;
  onEdit: (m: ZoneMission) => void;
}) {
  const isDone    = timer.state === "done";
  const isFail    = timer.state === "fail";
  const isRunning = timer.state === "running";
  const isPaused  = timer.state === "paused";
  const isActive  = isRunning || isPaused;
  const totalSecs = mission.duree_min * 60;
  const pct       = Math.min(100, totalSecs > 0 ? Math.round((timer.elapsed / totalSecs) * 100) : 0);

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
    <View style={[
      styles.missionCard,
      isDone && { backgroundColor: "#f0fdf4" },
      isFail && { backgroundColor: "#fff1f1" },
    ]}>
      <View style={styles.missionHeader}>
        <View style={[styles.missionIconBox, { backgroundColor: DIFF_BG[mission.difficulte] ?? "#f3f4f6" }]}>
          <Text style={{ fontSize: 20 }}>{mission.difficulte === 1 ? "💧" : "🔥"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.missionTitle} numberOfLines={2}>{mission.titre}</Text>
          <View style={styles.missionMeta}>
            <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[mission.difficulte] + "22" }]}>
              <Text style={[styles.diffText, { color: DIFF_COLOR[mission.difficulte] }]}>
                {DIFF_LABEL[mission.difficulte]}
              </Text>
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

      {mission.description ? (
        <Text style={styles.missionDesc} numberOfLines={2}>{mission.description}</Text>
      ) : null}

      {(isActive || isDone || isFail) && (
        <View style={[
          styles.chronoBox,
          isDone    ? { backgroundColor: "#dcfce7" } :
          isFail    ? { backgroundColor: "#fee2e2" } :
          isRunning ? { backgroundColor: "#fff7ed" } :
                      { backgroundColor: "#f3f4f6" },
        ]}>
          <Text style={[
            styles.chronoText,
            isDone    ? { color: "#16a34a" } :
            isFail    ? { color: "#dc2626" } :
            isRunning ? { color: "#ea580c" } :
                        { color: "#6b7280" },
          ]}>
            {isDone ? "✅ Mission terminée !" :
             isFail ? "❌ Temps écoulé — mission échouée" :
             `⏱ ${fmt(timer.elapsed)} / ${String(mission.duree_min).padStart(2, "0")}:00`}
          </Text>
          {isActive && (
            <View style={[styles.chronoPulse, { backgroundColor: isRunning ? "#ea580c" : "#9ca3af" }]} />
          )}
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
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]}
              onPress={() => onRetry(mission.id_mission)}
            >
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
                style={[styles.actionBtn, {
                  backgroundColor: isDone ? "#22c55e" : accent,
                  opacity: isDone ? 0.8 : 1,
                }]}
                onPress={handleBtn}
                disabled={isDone}
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

function EmptySlot({
  index, suggestions, onAccept, onCreateNew, accent,
}: {
  index: number;
  suggestions: ZoneMission[];
  onAccept: (m: ZoneMission) => void;
  onCreateNew: () => void;
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[
      styles.missionCard,
      { borderStyle: "dashed", borderWidth: 2, borderColor: accent + "55", backgroundColor: "#faf9ff" },
    ]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: accent, fontWeight: "700", fontSize: 14 }}>
          🧩 Emplacement {index + 1}
        </Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: accent }]}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.actionBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={{ marginTop: 12, gap: 8 }}>
          {suggestions.length > 0 ? (
            <>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 2 }}>
                Missions disponibles :
              </Text>
              {suggestions.slice(0, 4).map((s) => (
                <TouchableOpacity
                  key={s.id_mission}
                  style={styles.suggestionRow}
                  onPress={() => { onAccept(s); setExpanded(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{s.titre}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                      <Text style={styles.suggestionMeta}>⏱ {s.duree_min} min</Text>
                      <Text style={styles.suggestionMeta}>⚡ {s.xp_gain} XP</Text>
                      <Text style={[styles.suggestionMeta, { color: DIFF_COLOR[s.difficulte] }]}>
                        {DIFF_LABEL[s.difficulte]}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: accent, fontWeight: "800", fontSize: 16 }}>✓</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <Text style={{ fontSize: 12, color: "#9b87c9", textAlign: "center", paddingVertical: 4 }}>
              Aucune mission disponible
            </Text>
          )}

          <TouchableOpacity
            style={[styles.createSlotBtn, { borderColor: accent }]}
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
  const router               = useRouter();
  const { userId: rawUserId } = useUser();
  const { zoneId, zoneSlug } = useLocalSearchParams<{ zoneId: string; zoneSlug: string }>();

  if (!rawUserId) return null;
  const userId = String(rawUserId);

  const [zoneInfo,       setZoneInfo]       = useState<ZoneInfo | null>(null);
  const [showExitModal,  setShowExitModal]  = useState(false);
  const [editingMission, setEditingMission] = useState<ZoneMission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nextZoneName,   setNextZoneName]   = useState("");

  const bgFade    = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const progressW = useRef(new Animated.Value(0)).current;

  const CELL_SIZE = Math.floor((SW - 48) / GRID_COLS) - 4;

  // ── Hook principal ─────────────────────────────────────────────────────────

  const {
    missions, slots, suggestions, timers, puzzle, loading,
    statusModal, zoneUnlocked,
    doneMissions, getTimer,
    startTimer, pauseTimer, finishTimer, retryTimer,
    hasRunningTimer, pauseAllRunning, saveAllRunningForBackground,
    acceptSuggestion, addMission,
    closeStatusModal, closeZoneUnlocked,
  } = useZoneMissions(userId, Number(zoneId), 3);

  const totalPieces  = puzzle?.total_pieces  ?? 3;
  const piecesEarned = puzzle?.pieces_earned ?? 0;
  const isComplete   = puzzle?.is_complete   ?? false;
  const imageUri     = zoneInfo?.image_url   ?? "";
  const accent       = zoneInfo?.accent_color ?? "#7f5af0";

  // ── Charger infos zone ─────────────────────────────────────────────────────

  useEffect(() => {
    const loadZoneInfo = async () => {
      const { data } = await supabase
        .from("zone")
        .select("nom, image_url, accent_color, dark_color, light_color")
        .eq("id_zone", Number(zoneId))
        .single();
      if (data) setZoneInfo(data);
    };
    loadZoneInfo();
  }, [zoneId]);

  // ── Animation d'entrée ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(bgFade,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, friction: 7, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  // ── Animation barre puzzle ─────────────────────────────────────────────────

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

  // ── Zone débloquée : récupérer nom zone suivante ───────────────────────────

  useEffect(() => {
    if (!zoneUnlocked) return;
    const fetchNextZone = async () => {
      const { data } = await supabase
        .from("zone")
        .select("nom")
        .gt("id_zone", Number(zoneId))
        .order("id_zone", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data?.nom) setNextZoneName(data.nom);
    };
    fetchNextZone();
  }, [zoneUnlocked, zoneId]);

  // ── Navigation retour ──────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (hasRunningTimer()) setShowExitModal(true);
    else router.back();
  }, [hasRunningTimer, router]);

  const handlePauseAndLeave = useCallback(async () => {
    await pauseAllRunning();
    setShowExitModal(false);
    router.back();
  }, [pauseAllRunning, router]);

  const handleContinueAndLeave = useCallback(async () => {
    await saveAllRunningForBackground();
    setShowExitModal(false);
    router.back();
  }, [saveAllRunningForBackground, router]);

  // ── Édition mission ────────────────────────────────────────────────────────

  const handleSaveEdit = useCallback(async (id: number, titre: string, description: string) => {
    try {
      await supabase.from("mission").update({ titre, description }).eq("id_mission", id);
    } catch (e) {
      console.error("Edit mission error:", e);
    } finally {
      setEditingMission(null);
    }
  }, []);

  // ── Mission créée depuis modal ─────────────────────────────────────────────

  const handleMissionCreated = useCallback(async () => {
    // Recharger la dernière mission créée pour cette zone
    const { data } = await supabase
      .from("mission")
      .select("*")
      .eq("id_user", userId)
      .eq("id_zone", Number(zoneId))
      .order("id_mission", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) addMission(data);
    setShowCreateModal(false);
  }, [userId, zoneId, addMission]);

  // ── Rendu loading ──────────────────────────────────────────────────────────

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

      {/* Background */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} />
      </Animated.View>

      {/* Header */}
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

          {/* ── Puzzle ── */}
          <View style={styles.puzzleSection}>
            <Text style={styles.sectionTitle}>Puzzle de zone</Text>
            <View style={styles.puzzleGrid}>
              {Array.from({ length: totalPieces }).map((_, i) => (
                <PuzzleCell
                  key={i} index={i}
                  revealed={i < piecesEarned}
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

          {/* ── Missions ── */}
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
                onFinish={finishTimer}
                onRetry={retryTimer}
                onEdit={setEditingMission}
              />
            ) : (
              <EmptySlot
                key={`slot-${i}`}
                index={i}
                suggestions={suggestions}
                onAccept={acceptSuggestion}
                onCreateNew={() => setShowCreateModal(true)}
                accent={accent}
              />
            )
          )}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modales ── */}
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

      {/* Modal création mission — pré-remplit id_zone */}
      <CreateMissionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleMissionCreated}
        initialData={{ id_zone: Number(zoneId) }}
      />

      {/* Modal succès / échec */}
      <MissionStatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        missionTitle={statusModal.missionTitle}
        dateLimit={undefined}
        xp={statusModal.xp}
        coins={statusModal.coins}
        onClose={closeStatusModal}
      />

      {/* Zone débloquée */}
      <ZoneUnlockedModal
        visible={zoneUnlocked}
        zoneName={nextZoneName}
        zoneImage={imageUri}
        onExplore={() => { closeZoneUnlocked(); router.back(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#000" },
  header:               { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12, zIndex: 10 },
  backBtn:              { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle:          { fontSize: 18, fontWeight: "900", color: "#fff", flex: 1, textAlign: "center", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  pieceBadge:           { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  pieceBadgeText:       { color: "#fff", fontWeight: "800", fontSize: 12 },
  scroll:               { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 6 },
  card:                 { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 26, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 },
  sectionTitle:         { fontSize: 15, fontWeight: "800", color: "#2d1a6e", marginBottom: 12 },
  puzzleSection:        { marginBottom: 20 },
  puzzleGrid:           { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 12 },
  puzzleProgress:       { marginBottom: 8 },
  puzzleProgressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  puzzleProgressLabel:  { fontSize: 13, fontWeight: "700", color: "#2d1a6e" },
  puzzleProgressPct:    { fontSize: 13, fontWeight: "900" },
  revealedBox:          { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  revealedImage:        { width: "100%", height: 180 },
  revealedBanner:       { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 8, alignItems: "center" },
  revealedText:         { color: "#fff", fontWeight: "900", fontSize: 16 },
  progressTrack:        { height: 10, backgroundColor: "#e8e0ff", borderRadius: 10, overflow: "hidden" },
  progressFill:         { height: "100%", borderRadius: 10 },
  cell:                 { borderRadius: 8, overflow: "hidden", borderWidth: 2, margin: 2, elevation: 3 },
  cellCheck:            { position: "absolute", bottom: 3, right: 3, width: 15, height: 15, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#fff" },
  cellLocked:           { flex: 1, backgroundColor: "rgba(40,10,100,0.55)", justifyContent: "center", alignItems: "center" },
  missionCard:          { backgroundColor: "#f8f7ff", borderRadius: 18, padding: 12, marginBottom: 12, shadowColor: "#7f5af0", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  missionHeader:        { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  missionIconBox:       { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  missionTitle:         { fontSize: 14, fontWeight: "700", color: "#2d1a6e", marginBottom: 4, lineHeight: 19 },
  missionMeta:          { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  missionDesc:          { fontSize: 12, color: "#6b7280", lineHeight: 17, marginBottom: 8 },
  diffPill:             { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffText:             { fontSize: 10, fontWeight: "700" },
  metaText:             { fontSize: 10, color: "#9b87c9", fontWeight: "600" },
  chronoBox:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  chronoText:           { fontSize: 13, fontWeight: "700" },
  chronoPulse:          { width: 8, height: 8, borderRadius: 4 },
  missionBottom:        { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  pctText:              { fontSize: 11, fontWeight: "700", marginTop: 3 },
  btnGroup:             { flexDirection: "row", gap: 6, alignItems: "center" },
  finishBtn:            { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  actionBtn:            { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 14 },
  actionBtnText:        { color: "#fff", fontWeight: "800", fontSize: 12 },
  editBtn:              { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f3f0ff", justifyContent: "center", alignItems: "center", marginLeft: 4 },
  suggestionRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f3f0ff", borderRadius: 12, padding: 10 },
  suggestionTitle:      { fontSize: 13, fontWeight: "700", color: "#2d1a6e" },
  suggestionMeta:       { fontSize: 10, color: "#9b87c9", fontWeight: "600" },
  createSlotBtn:        { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, padding: 11, alignItems: "center" },
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