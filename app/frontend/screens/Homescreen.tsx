import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import SettingIcone from "../components/SettingIcone";
import NotifIcone from "../components/NotifIcone";

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
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";
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

type Mission = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  status: "Terminée" | "En cours" | "En retard";
  date: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Missions");
  const [activeNav, setActiveNav] = useState("home");
  const { selectedModel } = useAvatar();
  const { userId } = useUser();
  const { icon: timeIcon, text: timeText } = getTimeGreeting();
  const xpPercent = (USER.xp / USER.maxXp) * 100;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState({
    terminated: 0,
    inProgress: 0,
    late: 0,
    streak: 7,
    weekTime: "0h 00",
    successRate: 0,
  });

  useEffect(() => {
    console.log("userId:", userId);
    if (userId) fetchMissions();
  }, [userId]);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from("mission")
        .select("*")
        
        .order("id_mission", { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!data) return;

      const mapped: Mission[] = data.map((m: any) => ({
        id: String(m.id_mission),
        title: m.titre ?? "Sans titre",
        tag: m.type ?? "",
        duration: m.duree_min ? `${Math.floor(m.duree_min / 60)}h${String(m.duree_min % 60).padStart(2, "0")}` : "-",
        status: mapStatus(m.statut),
        date: m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "-",
      }));

      setMissions(mapped);

      const terminated = data.filter((m: any) => m.statut === "terminee").length;
      const inProgress = data.filter((m: any) => m.statut === "en_cours").length;
      const late = data.filter((m: any) => m.statut === "en_retard").length;
      const total = terminated + inProgress + late;
      const successRate = total > 0 ? Math.round((terminated / total) * 100) : 0;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekMissions = data.filter((m: any) => {
        if (!m.created_at) return false;
        return new Date(m.created_at) >= startOfWeek;
      });
      const totalMinutes = weekMissions.reduce((acc: number, m: any) => acc + (m.duree_min ?? 0), 0);
      const weekTime = `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}`;

      setStats({ terminated, inProgress, late, streak: 7, weekTime, successRate });
    } catch (err: any) {
      console.error("❌ Erreur fetch missions:", err.message);
    }
  };

  const mapStatus = (statut: string): "Terminée" | "En cours" | "En retard" => {
    if (statut === "terminee") return "Terminée";
    if (statut === "en_retard") return "En retard";
    return "En cours";
  };

  const handleMissionSaved = () => {
    fetchMissions();
  };

  return (
    <View style={styles.container}>
      <WaveBackground height={290} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.coinsBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinsText}>{USER.coins.toLocaleString()}</Text>
            </View>
            <View style={styles.headerIcons}>
              <NotifIcone onPress={() => console.log("Notifications")} />
              <SettingIcone onPress={() => console.log("Settings")} />
            </View>
          </View>

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
              terminated={stats.terminated}
              inProgress={stats.inProgress}
              late={stats.late}
            />
            <StatsBar
              streak={stats.streak}
              weekTime={stats.weekTime}
              successRate={stats.successRate}
              terminated={stats.terminated}
              inProgress={stats.inProgress}
              late={stats.late}
            />
            <MissionsList
              missions={missions}
              onAdd={handleMissionSaved}
            />
          </>
        ) : (
          <EventsTab onViewAll={() => router.push("/EventsScreen")} />
        )}
      </ScrollView>

      <Navbar active={activeNav} onChange={setActiveNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingTop: 30,
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
