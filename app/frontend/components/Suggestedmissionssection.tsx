// ─────────────────────────────────────────────────────────────
//  components/SuggestedMissionsSection.tsx
// ─────────────────────────────────────────────────────────────

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../constants/UserContext";
import { useMissionSuggestions } from "../hooks/Usemissionsuggestions";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";
import { createMission } from "../../../backend/models/mission.service";

type Props = {
  onMissionStart?: (mission: MissionSuggestion) => void;
  maxSuggestions?: number;
};

// ─── MissionCard ──────────────────────────────────────────────
const MissionCard = ({
  mission,
  onStart,
  starting,
}: {
  mission: MissionSuggestion;
  onStart: (m: MissionSuggestion) => void | Promise<void>;
  starting: boolean;
}) => (
  <View style={[missionStyles.card, missionStyles.suggestedCard]}>
    <View style={missionStyles.iconBox}>
      <Text style={{ fontSize: 20 }}>{mission.emoji}</Text>
    </View>
    <View style={missionStyles.textBox}>
      <Text style={missionStyles.title}>{mission.title}</Text>
      <Text style={missionStyles.suggestedTag}>Suggérée</Text>
      <Text style={missionStyles.sub}>{mission.description}</Text>
    </View>
    <TouchableOpacity
      style={[missionStyles.btn, missionStyles.btnStart, starting && missionStyles.btnDisabled]}
      onPress={() => onStart(mission)}
      disabled={starting}
    >
      <Text style={missionStyles.btnText}>
        {starting ? "..." : "Démarrer ▶"}
      </Text>
    </TouchableOpacity>
  </View>
);

const missionStyles = StyleSheet.create({
  card:          { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.missionCardBg, borderRadius: SIZES.radius, padding: 12, marginBottom: 10, gap: 10 },
  suggestedCard: { backgroundColor: COLORS.missionSuggestedBg, borderWidth: 1, borderColor: COLORS.missionSuggestedBorder },
  iconBox:       { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.missionIconBg, alignItems: "center", justifyContent: "center" },
  textBox:       { flex: 1 },
  title:         { fontSize: 13, fontWeight: "700", color: COLORS.text },
  suggestedTag:  { fontSize: 10, color: COLORS.secondary, fontStyle: "italic", fontWeight: "600" },
  sub:           { fontSize: 11, color: COLORS.missionSubColor, marginTop: 1 },
  btn:           { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  btnStart:      { backgroundColor: COLORS.missionBtnStart },
  btnDisabled:   { opacity: 0.5 },
  btnText:       { fontSize: 11, fontWeight: "700", color: COLORS.modalTitle },
});

// ─── Section principale ───────────────────────────────────────
export default function SuggestedMissionsSection({
  onMissionStart,
  maxSuggestions = 5,
}: Props) {
  const router = useRouter();
  const { userId } = useUser();
  const [startingId, setStartingId] = useState<string | null>(null);

  const {
    suggestions,
    isLoading,
    error,
    refresh,
  } = useMissionSuggestions(maxSuggestions);

  // ─── Démarrer une mission suggérée ───────────────────────────
  // 1. Crée la mission en base (vraie mission avec XP/stats)
  // 2. Navigue vers Missions avec l'id_mission → chrono démarre automatiquement
  const handleStart = async (mission: MissionSuggestion) => {
    if (!userId || startingId) return;
    setStartingId(mission.id);

    try {
      onMissionStart?.(mission);

      // Convertir la durée "20 min" → nombre
      const dureeMatch = mission.duration.match(/(\d+)/);
      const duree_min  = dureeMatch ? parseInt(dureeMatch[1], 10) : 30;

      // Mapper catégorie → difficulté/priorité
      const difficulte = mission.priority === "critical" ? 3
                       : mission.priority === "high"     ? 2
                       : 1;
      const priorite   = mission.priority === "critical" ? 5
                       : mission.priority === "high"     ? 4
                       : mission.priority === "medium"   ? 3
                       : 2;

      // Créer la mission en base — elle sera traitée comme une mission normale
      const created = await createMission({
        id_user:     typeof userId === "number" ? userId : parseInt(userId as any, 10),
        titre:       mission.title,
        description: mission.description,
        duree_min,
        difficulte,
        priorite,
        date_limite: null,
        id_boss:     null,
      });

      // Naviguer vers Missions avec l'id_mission pour démarrage auto
      router.push(
        `/frontend/screens/Missions?autoStartId=${created.id_mission}` as any
      );

    } catch (err: any) {
      console.error("[SuggestedMissions] createMission error:", err.message);
      Alert.alert("Erreur", "Impossible de créer la mission. Réessaie.");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <View style={[styles.container, SHADOWS.light]}>
      <Text style={styles.title}>Missions suggérées</Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.loadingText}>Analyse de tes stats…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Excellent niveau !</Text>
          <Text style={styles.emptyText}>
            Toutes tes statistiques sont au top. Continue comme ça !
          </Text>
        </View>
      ) : (
        suggestions.map((mission: MissionSuggestion) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onStart={handleStart}
            starting={startingId === mission.id}
          />
        ))
      )}

      {!isLoading && (
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
          <Text style={styles.refreshText}>↻ Actualiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: SIZES.padding, marginBottom: 14 },
  title:       { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 14 },
  loadingBox:  { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 12, color: COLORS.suggMutedText },
  errorBox:    { alignItems: "center", paddingVertical: 16, gap: 10 },
  errorText:   { color: COLORS.suggPriorityCritical, fontSize: 13 },
  retryBtn:    { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  retryText:   { color: COLORS.background, fontWeight: "700", fontSize: 12 },
  emptyBox:    { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyEmoji:  { fontSize: 36 },
  emptyTitle:  { fontSize: 15, fontWeight: "800", color: COLORS.text },
  emptyText:   { fontSize: 12, color: COLORS.suggMutedText, textAlign: "center" },
  refreshBtn:  { borderWidth: 1.5, borderColor: COLORS.secondary, borderStyle: "dashed", borderRadius: 30, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  refreshText: { color: COLORS.secondary, fontWeight: "700", fontSize: 14 },
});