
// ─────────────────────────────────────────────────────────────
//  components/SuggestedMissionCard.tsx
//  Carte visuelle d'une mission suggérée
// ─────────────────────────────────────────────────────────────

import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import {
  getPriorityColor,
  getPriorityLabel,
  type MissionSuggestion,
} from "../utils/MissionSuggestionEngine";

type Props = {
  mission:   MissionSuggestion;
  onStart:   (mission: MissionSuggestion) => void;
  onDismiss: (missionId: string) => void;
};

export default function SuggestedMissionCard({ mission, onStart, onDismiss }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const priorityColor = getPriorityColor(mission.priority);
  const priorityLabel = getPriorityLabel(mission.priority);
  const isCritical    = mission.priority === "critical";

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue:         0,
      duration:        250,
      useNativeDriver: true,
    }).start(() => onDismiss(mission.id));
  };

  const handleStart = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1,   duration: 100, useNativeDriver: true }),
    ]).start(() => onStart(mission));
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <View
        style={[
          styles.card,
          isCritical && styles.cardCritical,
          { borderLeftColor: priorityColor },
        ]}
      >
        {/* ── Badge priorité ── */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20", borderColor: priorityColor }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
        </View>

        {/* ── Corps ── */}
        <View style={styles.body}>
          <View style={[styles.emojiBox, { backgroundColor: mission.color + "20" }]}>
            <Text style={styles.emoji}>{mission.emoji}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{mission.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{mission.description}</Text>

            {/* Raison de la suggestion */}
            <Text style={styles.reason} numberOfLines={2}>{mission.reason}</Text>

            {/* Métadonnées */}
            <View style={styles.meta}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>⏱ {mission.duration}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: mission.color + "20" }]}>
                <Text style={[styles.metaText, { color: mission.color }]}>{mission.impact}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>⭐ {mission.xpReward} XP</Text>
              </View>
              <View style={[styles.metaChip, styles.coinChip]}>
                <Text style={[styles.metaText, styles.coinText]}>🪙 {mission.coinReward}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: isCritical ? priorityColor : COLORS.primary }]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startText}>{isCritical ? "⚡ Urgent" : "▶ Démarrer"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius:    SIZES.radius,
    padding:         14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.light,
  },
  cardCritical: {
    backgroundColor: COLORS.suggCardCriticalBg,
  },
  priorityBadge: {
    flexDirection:     "row",
    alignItems:        "center",
    alignSelf:         "flex-start",
    borderRadius:      20,
    borderWidth:       1,
    paddingHorizontal: 8,
    paddingVertical:   3,
    marginBottom:      10,
    gap:               5,
  },
  priorityDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize:      10,
    fontWeight:    "800",
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: "row",
    gap:           12,
    marginBottom:  12,
  },
  emojiBox: {
    width:          44,
    height:         44,
    borderRadius:   12,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap:  3,
  },
  title: {
    fontSize:   14,
    fontWeight: "800",
    color:      COLORS.text,
  },
  description: {
    fontSize:   12,
    color:      COLORS.suggDescText,
    lineHeight: 17,
  },
  reason: {
    fontSize:   11,
    color:      COLORS.suggReasonText,
    fontStyle:  "italic",
    marginTop:  4,
    lineHeight: 15,
  },
  meta: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           5,
    marginTop:     8,
  },
  metaChip: {
    backgroundColor:   COLORS.suggMetaChipBg,
    borderRadius:      20,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  metaText: {
    fontSize:   10,
    color:      COLORS.suggDescText,
    fontWeight: "600",
  },
  coinChip: {
    backgroundColor: COLORS.suggCoinChipBg,
  },
  coinText: {
    color: COLORS.suggCoinText,
  },
  actions: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "flex-end",
    gap:            10,
  },
  dismissBtn: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.suggDismissBg,
    alignItems:      "center",
    justifyContent:  "center",
  },
  dismissText: {
    fontSize:   12,
    color:      COLORS.suggDismissText,
    fontWeight: "700",
  },
  startBtn: {
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   8,
  },
  startText: {
    color:      COLORS.background,
    fontSize:   12,
    fontWeight: "800",
  },
});