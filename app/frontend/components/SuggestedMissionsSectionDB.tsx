// components/SuggestedMissionsSectionDB.tsx
import React from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import { useMissionSuggestions } from "../hooks/Usemissionsuggestions";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";
import { useRouter } from "expo-router";

// ─── Config difficulté ────────────────────────────────────────
const difficultyConfig = {
  critical: { color: "#ef4444", bg: "#fee2e2", stars: "⭐⭐⭐", label: "Difficile" },
  high:     { color: "#f59e0b", bg: "#fef3c7", stars: "⭐⭐",  label: "Moyen"    },
  medium:   { color: "#22c55e", bg: "#dcfce7", stars: "⭐",    label: "Facile"   },
  low:      { color: "#22c55e", bg: "#dcfce7", stars: "⭐",    label: "Facile"   },
};

// ─── Carte individuelle ───────────────────────────────────────
function SuggestedCard({
  mission,
  onStart,
  onDismiss,
}: {
  mission: MissionSuggestion;
  onStart: (m: MissionSuggestion) => void;
  onDismiss: (id: string) => void;
}) {
  const diff = difficultyConfig[mission.priority];

  return (
    <View style={[card.wrapper, { borderTopColor: mission.color }]}>
      {/* ── Dismiss ── */}
      <TouchableOpacity
        style={card.dismissBtn}
        onPress={() => onDismiss(mission.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={card.dismissText}>✕</Text>
      </TouchableOpacity>

      {/* ── Header ── */}
      <View style={card.header}>
        <View style={[card.iconWrapper, { backgroundColor: mission.color + "22" }]}>
          <Text style={card.icon}>{mission.emoji}</Text>
        </View>
        <View style={card.headerRight}>
          <View style={[card.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[card.diffText, { color: diff.color }]}>
              {diff.stars} {diff.label}
            </Text>
          </View>
          <View style={[card.xpBadge, { backgroundColor: mission.color + "15" }]}>
            <Text style={[card.xpText, { color: mission.color }]}>
              +{mission.xpReward} XP
            </Text>
          </View>
        </View>
      </View>

      {/* ── Texte ── */}
      <Text style={card.title}>{mission.title}</Text>
      <Text style={card.description} numberOfLines={2}>{mission.description}</Text>

      {/* ── Footer ── */}
      <View style={card.footer}>
        <Text style={card.duration}>⏱ {mission.duration}</Text>
        <TouchableOpacity
          style={[card.startBtn, { backgroundColor: mission.color }]}
          onPress={() => onStart(mission)}
          activeOpacity={0.85}
        >
          <Text style={card.startBtnText}>Commencer →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    borderRadius:    20,
    padding:         16,
    borderTopWidth:  4,
    width:           260,
    marginRight:     12,
    ...SHADOWS.medium,
  },
  dismissBtn: {
    position:        "absolute",
    top:             10,
    right:           10,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: "#f3f4f6",
    alignItems:      "center",
    justifyContent:  "center",
    zIndex:          10,
  },
  dismissText:  { fontSize: 10, color: "#6b7280", fontWeight: "700" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  iconWrapper:  { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  icon:         { fontSize: 24 },
  headerRight:  { alignItems: "flex-end", gap: 6 },
  diffBadge:    { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  diffText:     { fontSize: 10, fontWeight: "700" },
  xpBadge:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  xpText:       { fontSize: 11, fontWeight: "800" },
  title:        { fontSize: 14, fontWeight: "800", color: "#1e1b4b", marginBottom: 6, paddingRight: 20 },
  description:  { fontSize: 12, color: "#6b7280", lineHeight: 18, marginBottom: 14 },
  footer:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duration:     { fontSize: 12, color: "#9ca3af" },
  startBtn:     { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  startBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

// ─── Section principale ───────────────────────────────────────
type Props = {
  onMissionStart?: (mission: MissionSuggestion) => void;
  maxSuggestions?: number;
};

export default function SuggestedMissionsSectionDB({
  onMissionStart,
  maxSuggestions = 5,
}: Props) {
  const router = useRouter();
  const { suggestions, isLoading, error, refresh, completeMission } =
    useMissionSuggestions(maxSuggestions);

  const handleStart = (mission: MissionSuggestion) => {
    completeMission(mission.id);
    onMissionStart?.(mission);
  };

  return (
    <View style={section.container}>
      {/* ── En-tête ── */}
      <View style={section.header}>
        <Text style={section.title}>Missions suggérées ✨</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={section.seeAll}>Actualiser</Text>
        </TouchableOpacity>
      </View>
      <Text style={section.subtitle}>Basées sur tes stats et objectifs</Text>

      {/* ── Contenu ── */}
      {isLoading ? (
        <View style={section.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={section.loadingText}>Analyse de tes stats…</Text>
        </View>
      ) : error ? (
        <View style={section.errorBox}>
          <Text style={section.errorText}>❌ {error}</Text>
          <TouchableOpacity onPress={refresh} style={section.retryBtn}>
            <Text style={section.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={section.emptyBox}>
          <Text style={section.emptyEmoji}>🎉</Text>
          <Text style={section.emptyTitle}>Excellent niveau !</Text>
          <Text style={section.emptyText}>Toutes tes stats sont au top !</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={section.scrollContent}
        >
          {suggestions.map((m) => (
            <SuggestedCard
              key={m.id}
              mission={m}
              onStart={handleStart}
              onDismiss={completeMission}
            />
          ))}
        </ScrollView>
      )}

     
    </View>
  );
}

const section = StyleSheet.create({
  container:     { paddingHorizontal: 16, marginTop: 8 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title:         { fontSize: 16, fontWeight: "800", color: "#1e1b4b" },
  seeAll:        { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  subtitle:      { fontSize: 12, color: "#9ca3af", marginBottom: 12 },
  scrollContent: { paddingRight: 16 },
  loadingBox:    { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText:   { fontSize: 12, color: "#9ca3af" },
  errorBox:      { alignItems: "center", paddingVertical: 16, gap: 10 },
  errorText:     { color: "#ef4444", fontSize: 13 },
  retryBtn:      { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  retryText:     { color: "#fff", fontWeight: "700", fontSize: 12 },
  emptyBox:      { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyEmoji:    { fontSize: 36 },
  emptyTitle:    { fontSize: 15, fontWeight: "800", color: "#1e1b4b" },
  emptyText:     { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  addBtn:        { backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 14, alignItems: "center", marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  addBtnText:    { color: "#fff", fontWeight: "700", fontSize: 15 },
});