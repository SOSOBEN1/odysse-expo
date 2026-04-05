import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AvatarCrd from "../components/AvatarCrd";
import EventsTab from "../components/EventsTab";
import MissionProgress from "../components/MissionProgress";
import MissionsList from "../components/MissionsList";
import Navbar from "../components/Navbar";
import StatsBar from "../components/StatsBar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { icon: "☀️", text: "Bonjour" };
  if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
  if (hour >= 18 && hour < 21) return { icon: "🌅", text: "Bonsoir" };
  return { icon: "🌙", text: "Bonne nuit" };
}

const USER = {
  userName: "Sonia",
  level: 6,
  xp: 1745,
  maxXp: 1800,
  coins: 1250,
};

const STATS = {
  terminated: 18,
  inProgress: 5,
  late: 2,
  streak: 7,
  weekTime: "12h 30",
  successRate: 85,
};

const MISSIONS = [
  { id: "1", title: "Réviser algorithme", tag: "Soutenance PFE", duration: "1h30", status: "Terminée" as const, date: "24/04/2024" },
  { id: "2", title: "Corriger bugs appli", tag: "Projet mobile", duration: "1h00", status: "En cours" as const, date: "25/04/2024" },
  { id: "3", title: "Préparer présentation", tag: "Soutenance PFE", duration: "10h00", status: "En retard" as const, date: "23/04/2024" },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("Missions");
  const [activeNav, setActiveNav] = useState("home");
  const { selectedModel } = useAvatar();
  const { icon: timeIcon, text: timeText } = getTimeGreeting();
  const xpPercent = (USER.xp / USER.maxXp) * 100;

  return (
    <View style={styles.container}>
      {/* Wave background — top overridé pour descendre la vague */}
      <WaveBackground height={290} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Top row: coins + icons */}
          <View style={styles.topRow}>
            <View style={styles.coinsBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinsText}>{USER.coins.toLocaleString()}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar + Info */}
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              {selectedModel ? (
                <AvatarCrd model={selectedModel} bgColor="#ede9fe" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarEmoji}>🧑</Text>
                </View>
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Niv. {USER.level}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>
                  {timeText},{" "}
                  <Text style={styles.greetingName}>{USER.userName}!</Text>
                </Text>
                <Text style={styles.timeIcon}>{timeIcon}</Text>
              </View>

              <View style={styles.xpBarBg}>
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpBarFill, { width: `${xpPercent}%` }]}
                />
              </View>
              <Text style={styles.xpText}>
                {USER.xp.toLocaleString()} XP / {USER.maxXp.toLocaleString()} XP
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {["Missions", "Événements"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content ── */}
        {activeTab === "Missions" ? (
          <>
            <MissionProgress
              terminated={STATS.terminated}
              inProgress={STATS.inProgress}
              late={STATS.late}
            />
            <StatsBar
              streak={STATS.streak}
              weekTime={STATS.weekTime}
              successRate={STATS.successRate}
              terminated={STATS.terminated}
              inProgress={STATS.inProgress}
              late={STATS.late}
            />
            <MissionsList
              missions={MISSIONS}
              onAdd={() => console.log("Ajouter mission")}
            />
          </>
        ) : (
          <EventsTab />
        )}
      </ScrollView>

      {/* ── Navbar ── */}
      <Navbar active={activeNav} onChange={setActiveNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  header: {
    paddingTop: 30,           // ← était 54, remonté
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    ...SHADOWS.light,
  },
  coinIcon: { fontSize: 16 },
  coinsText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#ede9fe",
    ...SHADOWS.medium,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 40 },
  levelBadge: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  levelText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  infoBlock: { flex: 1 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: { color: "#6b7280", fontSize: 14, flex: 1 },
  greetingName: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  timeIcon: { fontSize: 20 },

  xpBarBg: {
    height: 8,
    backgroundColor: "#ddd6fe",
    borderRadius: 10,
    marginTop: 10,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 10 },
  xpText: { color: "#9ca3af", fontSize: 11, marginTop: 4 },

  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#ede9fe",
    borderRadius: 30,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  tabTextActive: { color: "#fff" },
});