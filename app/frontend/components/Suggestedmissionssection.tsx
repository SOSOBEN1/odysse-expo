// ─────────────────────────────────────────────────────────────
//  components/SuggestedMissionsSection.tsx
//  Section complète de suggestions de missions intelligentes
// ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMissionSuggestions } from "../hooks/Usemissionsuggestions";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";

type Props = {
  onMissionStart?: (mission: MissionSuggestion) => void;
  maxSuggestions?: number;
};

// ─── MissionCard — même style que dans DashboardScreen ───────
const MissionCard = ({
  mission,
  onStart,
}: {
  mission: MissionSuggestion;
  onStart: (m: MissionSuggestion) => void;
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
      style={[missionStyles.btn, missionStyles.btnStart]}
      onPress={() => onStart(mission)}
    >
      <Text style={missionStyles.btnText}>Démarrer ▶</Text>
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
  btnText:       { fontSize: 11, fontWeight: "700", color: COLORS.modalTitle },
});

// ─── Section principale ───────────────────────────────────────
export default function SuggestedMissionsSection({
  onMissionStart,
  maxSuggestions = 5,
}: Props) {
  const {
    suggestions,
    isLoading,
    error,
    refresh,
    completeMission,
  } = useMissionSuggestions(maxSuggestions);

  const handleStart = (mission: MissionSuggestion) => {
    completeMission(mission.id);
    onMissionStart?.(mission);
  };

  return (
    <View style={[styles.container, SHADOWS.light]}>
      {/* ── En-tête ── */}
      <Text style={styles.title}>Missions suggérées</Text>

      {/* ── Contenu ── */}
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
          />
        ))
      )}

      {/* ── Bouton rafraîchir ── */}
      {!isLoading && (
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
          <Text style={styles.refreshText}>＋ Ajouter une mission</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:  COLORS.card,
    borderRadius:     SIZES.radiusLarge,
    marginHorizontal: SIZES.padding,
    padding:          SIZES.padding,
    marginBottom:     14,
  },
  title: {
    fontSize:     18,
    fontWeight:   "800",
    color:        COLORS.text,
    marginBottom: 14,
  },
  loadingBox: {
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 24,
    gap:             8,
  },
  loadingText: {
    fontSize: 12,
    color:    COLORS.suggMutedText,
  },
  errorBox: {
    alignItems:      "center",
    paddingVertical: 16,
    gap:             10,
  },
  errorText: {
    color:    COLORS.suggPriorityCritical,
    fontSize: 13,
  },
  retryBtn: {
    backgroundColor:   COLORS.primary,
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   8,
  },
  retryText: {
    color:      COLORS.background,
    fontWeight: "700",
    fontSize:   12,
  },
  emptyBox: {
    alignItems:      "center",
    paddingVertical: 20,
    gap:             6,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize:   15,
    fontWeight: "800",
    color:      COLORS.text,
  },
  emptyText: {
    fontSize:  12,
    color:     COLORS.suggMutedText,
    textAlign: "center",
  },
  refreshBtn: {
    borderWidth:     1.5,
    borderColor:     COLORS.secondary,
    borderStyle:     "dashed",
    borderRadius:    30,
    paddingVertical: 11,
    alignItems:      "center",
    marginTop:       4,
  },
  refreshText: {
    color:      COLORS.secondary,
    fontWeight: "700",
    fontSize:   14,
  },
});
