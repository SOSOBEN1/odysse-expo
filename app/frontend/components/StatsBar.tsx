import { StyleSheet, Text, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  streak: number;
  weekTime: string;
  successRate: number;
  terminated: number;
  inProgress: number;
  late: number;
};

export default function StatsBar({ streak, weekTime, successRate, terminated, inProgress, late }: Props) {
  const total = terminated + inProgress + late;
  const tPct = total > 0 ? (terminated / total) * 100 : 0;
  const iPct = total > 0 ? (inProgress / total) * 100 : 0;
  const lPct = total > 0 ? (late / total) * 100 : 0;

  const stats = [
    { icon: "🔥", value: streak.toString(), label: "Série actuelle", color: "#f97316" },
    { icon: "⏱️", value: weekTime, label: "Temps cette semaine", color: COLORS.primary },
    { icon: "✅", value: `${successRate}%`, label: "Taux de réussite", color: "#22c55e" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Statistiques</Text>
      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Missions par statut</Text>
      <View style={styles.barCard}>
        <View style={styles.barRow}>
          <View style={[styles.barSegment, { flex: tPct, backgroundColor: COLORS.primary }]} />
          <View style={[styles.barSegment, { flex: iPct, backgroundColor: "#fbbf24" }]} />
          <View style={[styles.barSegment, { flex: lPct, backgroundColor: "#ef4444" }]} />
        </View>
        <View style={styles.barLegend}>
          {[
            { color: COLORS.primary, label: "Terminées", count: terminated, pct: tPct },
            { color: "#fbbf24", label: "En cours", count: inProgress, pct: iPct },
            { color: "#ef4444", label: "En retard", count: late, pct: lPct },
          ].map((item) => (
            <View key={item.label} style={styles.barLegendItem}>
              <View style={[styles.barDot, { backgroundColor: item.color }]} />
              <Text style={styles.barLegendText}>
                {item.label}{"\n"}{item.count} ({Math.round(item.pct)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e1b4b", marginTop: 20, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14,
    alignItems: "center", ...SHADOWS.light,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 9, color: "#9ca3af", textAlign: "center", marginTop: 2 },
  barCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, ...SHADOWS.light },
  barRow: { flexDirection: "row", height: 12, borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  barSegment: { height: "100%" },
  barLegend: { flexDirection: "row", justifyContent: "space-between" },
  barLegendItem: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  barDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  barLegendText: { fontSize: 10, color: "#6b7280", lineHeight: 15 },
});