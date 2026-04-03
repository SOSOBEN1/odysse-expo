import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS, SHADOWS } from "../styles/theme";
import CreateEventModal from "./CreateEventModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Event = {
  id: string;
  title: string;
  date: string;
  total: number;
  done: number;
  icon: string;
  iconBg: string;
};

type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const EVENTS: Event[] = [
  { id: "1", title: "Soutenance PFE", date: "10 JUIN", total: 5, done: 3, icon: "🎓", iconBg: "#fef3c7" },
  { id: "2", title: "Projet mobile", date: "10 JUIN", total: 4, done: 2, icon: "📱", iconBg: "#fee2e2" },
  { id: "3", title: "Examen de maths", date: "10 JUIN", total: 3, done: 0, icon: "🧮", iconBg: "#fef9c3" },
];

const UPCOMING: UpcomingEvent[] = [
  { id: "u1", title: "Hackathon 2024", date: "25 JUIN", daysLeft: 10 },
];

// ─── Donut Chart ──────────────────────────────────────────────────────────────
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
        <Text style={donut.label}>Progression{"\n"}globale</Text>
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

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const percent = event.total > 0 ? Math.round((event.done / event.total) * 100) : 0;
  const progressColor = percent === 100 ? "#22c55e" : percent === 0 ? "#e5e7eb" : COLORS.primary;

  return (
    <TouchableOpacity style={eventStyles.card} activeOpacity={0.85}>
      <View style={[eventStyles.iconWrapper, { backgroundColor: event.iconBg }]}>
        <Text style={eventStyles.icon}>{event.icon}</Text>
      </View>
      <View style={eventStyles.content}>
        <View style={eventStyles.topRow}>
          <Text style={eventStyles.title}>{event.title}</Text>
          <View style={[eventStyles.percentBadge, { backgroundColor: COLORS.primary }]}>
            <Text style={eventStyles.percentText}>{percent}%</Text>
          </View>
        </View>
        <Text style={eventStyles.date}>{event.date} | {event.done}/{event.total}</Text>
        <View style={eventStyles.barBg}>
          <View style={[eventStyles.barFill, { width: `${percent}%`, backgroundColor: progressColor }]} />
        </View>
        <View style={eventStyles.bottomRow}>
          <Ionicons name="people-outline" size={12} color="#9ca3af" />
          <Text style={eventStyles.missionsText}>{event.done} / {event.total} missions terminées</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c4b5fd" style={eventStyles.chevron} />
    </TouchableOpacity>
  );
}

const eventStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12, ...SHADOWS.light,
  },
  iconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  title: { fontSize: 14, fontWeight: "800", color: "#1e1b4b" },
  percentBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  percentText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  date: { fontSize: 11, color: "#9ca3af", marginBottom: 6 },
  barBg: { height: 6, backgroundColor: "#f3f4f6", borderRadius: 10, overflow: "hidden", marginBottom: 6 },
  barFill: { height: "100%", borderRadius: 10 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  missionsText: { fontSize: 11, color: "#9ca3af" },
  chevron: { marginLeft: 4 },
});

// ─── Upcoming Card ────────────────────────────────────────────────────────────
function UpcomingCard({ event }: { event: UpcomingEvent }) {
  return (
    <TouchableOpacity style={upcomingStyles.card} activeOpacity={0.85}>
      <View style={upcomingStyles.iconWrapper}>
        <Text style={upcomingStyles.icon}>📅</Text>
      </View>
      <View style={upcomingStyles.content}>
        <Text style={upcomingStyles.title}>{event.title}</Text>
        <Text style={upcomingStyles.date}>{event.date}</Text>
        <View style={upcomingStyles.countdownRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.secondary} />
          <Text style={upcomingStyles.countdown}>Commence dans {event.daysLeft} jours</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#c4b5fd" />
    </TouchableOpacity>
  );
}

const upcomingStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12, ...SHADOWS.light,
  },
  iconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: "#1e1b4b" },
  date: { fontSize: 11, color: "#9ca3af", marginVertical: 3 },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  countdown: { fontSize: 11, color: COLORS.secondary, fontWeight: "600" },
});

// ─── Main EventsTab ───────────────────────────────────────────────────────────
export default function EventsTab() {
  const [showModal, setShowModal] = useState(false);

  const totalMissions = EVENTS.reduce((acc, e) => acc + e.total, 0);
  const doneMissions = EVENTS.reduce((acc, e) => acc + e.done, 0);
  const globalPercent = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0;
  const terminatedEvents = EVENTS.filter(e => e.done === e.total).length;
  const lateEvents = EVENTS.filter(e => e.done === 0).length;

  return (
    <View style={styles.container}>

      {/* ── Progression globale ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progression des événements</Text>
        <Text style={styles.cardSubtitle}>Avancement global de toutes vos événements</Text>
        <View style={styles.progressRow}>
          <DonutChart percent={globalPercent} />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>🔔</Text>
              <Text style={styles.legendCount}>{EVENTS.length}</Text>
              <Text style={styles.legendLabel}>Événements actifs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#22c55e" }]} />
              <Text style={styles.legendCount}>{terminatedEvents}</Text>
              <Text style={styles.legendLabel}>Terminés</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.legendCount}>{lateEvents}</Text>
              <Text style={styles.legendLabel}>En retard</Text>
            </View>
          </View>
        </View>

        {/* ← Bouton créer événement */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Créer un événement</Text>
        </TouchableOpacity>
      </View>

      {/* ── Liste événements ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes événements</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {EVENTS.map(e => <EventCard key={e.id} event={e} />)}
      </View>

      {/* ── Événements à venir ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Événements à venir</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {UPCOMING.map(e => <UpcomingCard key={e.id} event={e} />)}
      </View>

      {/* ── Conseil hibou ── */}
      <View style={styles.tipCard}>
        <View style={styles.tipLeft}>
          <Text style={styles.tipTitle}>💡 Conseil</Text>
          <Text style={styles.tipText}>
            Termine les missions pour faire avancer plus vite tes événements !
          </Text>
        </View>
        <Image source={require("../assets/Hibou/happy.png")} style={styles.hibou} resizeMode="contain" />
      </View>

      {/* ── Modal ── */}
      <CreateEventModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(event) => {
          console.log("Nouvel événement:", event);
          setShowModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 120 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginTop: 16, ...SHADOWS.light },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1e1b4b", marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: COLORS.secondary, marginBottom: 16 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 24, marginBottom: 16 },
  legend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendIcon: { fontSize: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendCount: { fontSize: 15, fontWeight: "700", color: "#1e1b4b", width: 24 },
  legendLabel: { fontSize: 12, color: "#6b7280", flex: 1 },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 22, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1e1b4b" },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  list: { gap: 10 },
  tipCard: {
    backgroundColor: "#f5f3ff", borderRadius: 20, padding: 16, marginTop: 24,
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: "#ddd6fe", overflow: "hidden",
  },
  tipLeft: { flex: 1 },
  tipTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  tipText: { fontSize: 12, color: "#6b7280", lineHeight: 18 },
  hibou: { width: 80, height: 80, marginRight: -8 },
});