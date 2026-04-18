import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  terminated: number;
  inProgress: number;
  late: number;
};

function DonutChart({ percent }: { percent: number }) {
  const size = 110;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={donut.wrapper}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e9d5ff" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={COLORS.primary} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={donut.center}>
        <Text style={donut.percent}>{percent}%</Text>
        <Text style={donut.label}>Missions{"\n"}terminées</Text>
      </View>
    </View>
  );
}

const donut = StyleSheet.create({
  wrapper: { position: "relative", width: 110, height: 110 },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  percent: { fontSize: 20, fontWeight: "800", color: "#4c1d95" },
  label: { fontSize: 9, color: COLORS.primary, textAlign: "center", lineHeight: 13 },
});

export default function MissionProgress({ terminated, inProgress, late }: Props) {
  const total = terminated + inProgress + late;
  const percent = total > 0 ? Math.round((terminated / total) * 100) : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Progression des missions</Text>
      <Text style={styles.subtitle}>Avancement global de toutes vos missions</Text>
      <View style={styles.row}>
        <DonutChart percent={percent} />
        <View style={styles.legend}>
          {[
            { color: "#22c55e", count: terminated, label: "Terminées" },
            { color: "#f59e0b", count: inProgress, label: "En cours" },
            { color: "#ef4444", count: late, label: "En retard" },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendCount}>{item.count}</Text>
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    ...SHADOWS.light,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#1e1b4b", marginBottom: 2 },
  subtitle: { fontSize: 11, color: COLORS.secondary, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 24 },
  legend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendCount: { fontSize: 15, fontWeight: "700", color: "#1e1b4b", width: 24 },
  legendLabel: { fontSize: 13, color: "#6b7280" },
});