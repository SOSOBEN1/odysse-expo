// screens/HomeScreen.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import SettingIcone from "../components/SettingIcone";
import NotifIcone from "../components/NotifIcone";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
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
import { supabase } from "../../../app/frontend/constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";

import { fetchMissionStats, fetchRecentMissions } from "../../../backend/models/mission.service";
import type { MissionStats, RecentMission } from "../../../backend/models/mission.service";

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return { icon: "☀️",  text: "Bonjour" };
  if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
  if (hour >= 18 && hour < 21) return { icon: "🌅",  text: "Bonsoir" };
  return { icon: "🌙", text: "Bonne nuit" };
}

// ─────────────────────────────────────────────────────────────
//  Types locaux
// ─────────────────────────────────────────────────────────────

type UserStats = {
  userName: string;
  level:    number;
  xp:       number;
  maxXp:    number;
  coins:    number;
  energie:  number;
};

// ─────────────────────────────────────────────────────────────
//  HomeScreen
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router    = useRouter();
  const [activeTab, setActiveTab] = useState("Missions");
  const [activeNav, setActiveNav] = useState("home");

  const { userId }                        = useUser();
  const { icon: timeIcon, text: timeText } = getTimeGreeting();
  const { selectedModel, setSelectedModel } = useAvatar();

  const [userStats, setUserStats] = useState<UserStats>({
    userName: "...",
    level:    1,
    xp:       0,
    maxXp:    500,
    coins:    0,
    energie:  100,
  });

  // ✅ Remplacé par les types du backend
  const [missions, setMissions] = useState<RecentMission[]>([]);
  const [stats,    setStats]    = useState<MissionStats>({
    terminated:  0,
    inProgress:  0,
    late:        0,
    streak:      0,
    weekTime:    "0h 00",
    successRate: 0,
  });

  useEffect(() => {
    if (!userId) return;
    fetchUserStats();
    loadMissionData();
  }, [userId]);

  // ── Fetch stats utilisateur ───────────────────────────────
  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nom, prenom, progression, energie, niveau, gold, avatar_url, username")
        .eq("id_user", userId)
        .single();

      if (error || !data) return;

      const niveau = data.niveau ?? 1;
      const xp     = data.progression ?? 0;
      const maxXp  = niveau * 500;
      const xpPreviousLevels  = (niveau - 1) * 500;
      const xpInCurrentLevel  = Math.max(0, xp - xpPreviousLevels);

      const displayName = data.username
        ? data.username
        : `${data.prenom ?? ""} ${data.nom ?? ""}`.trim() || "Joueur";

      if (data.avatar_url) setSelectedModel(data.avatar_url);

      setUserStats({
        userName: displayName,
        level:    niveau,
        xp:       xpInCurrentLevel,
        maxXp,
        coins:    data.gold ?? 0,
        energie:  data.energie ?? 100,
      });
    } catch (err: any) {
      console.error("Erreur fetchUserStats:", err.message);
    }
  };

  // ✅ Toute la logique missions déléguée au backend
const loadMissionData = async () => {
  if (!userId) return;
  try {
    const [missionStats, recentMissions] = await Promise.all([
      fetchMissionStats(String(userId)),
      fetchRecentMissions(String(userId), 5),
    ]);
    setStats(missionStats);
    setMissions(recentMissions);
  } catch (err: any) {
    console.error("❌ Erreur loadMissionData:", err.message);
  }
};

  const xpPercent = userStats.maxXp > 0 ? (userStats.xp / userStats.maxXp) * 100 : 0;

  return (
    <View style={styles.container}>
      <WaveBackground height={290} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.coinsBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinsText}>{userStats.coins.toLocaleString()}</Text>
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
                <Text style={styles.levelText}>Niv. {userStats.level}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>
                  {timeText},{" "}
                  <Text style={styles.greetingName}>{userStats.userName}!</Text>
                </Text>
                <Text style={styles.timeIcon}>{timeIcon}</Text>
              </View>
              <View style={styles.xpBarBg}>
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.primary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.xpBarFill, { width: `${xpPercent}%` }]}
                />
              </View>
              <Text style={styles.xpText}>
                {userStats.xp.toLocaleString()} XP / {userStats.maxXp.toLocaleString()} XP
              </Text>
              {stats.streak > 0 && (
                <Text style={styles.streakText}>🔥 {stats.streak} jour{stats.streak > 1 ? "s" : ""} de suite !</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {["Missions", "Événements"].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
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
              onAdd={() => { loadMissionData(); fetchUserStats(); }}
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

// ─────────────────────────────────────────────────────────────
//  Styles (identiques à l'original)
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#f5f3ff" },
  scroll:            { flex: 1 },
  scrollContent:     { paddingBottom: 20 },
  header:            { paddingTop: 30, paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  topRow:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  coinsBadge:        { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, ...SHADOWS.light },
  coinIcon:          { fontSize: 16 },
  coinsText:         { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  headerIcons:       { flexDirection: "row", gap: 8 },
  profileRow:        { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrapper:     { width: 80, height: 100, borderRadius: 20, overflow: "hidden", position: "relative", backgroundColor: "#ede9fe", ...SHADOWS.medium },
  avatarPlaceholder: { flex: 1, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
  avatarEmoji:       { fontSize: 40 },
  levelBadge:        { position: "absolute", bottom: 4, alignSelf: "center", backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: "#fff", zIndex: 10 },
  levelText:         { color: "#fff", fontSize: 10, fontWeight: "700" },
  infoBlock:         { flex: 1 },
  greetingRow:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting:          { color: "#6b7280", fontSize: 14, flex: 1 },
  greetingName:      { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  timeIcon:          { fontSize: 20 },
  xpBarBg:           { height: 8, backgroundColor: "#ddd6fe", borderRadius: 10, marginTop: 10, overflow: "hidden" },
  xpBarFill:         { height: "100%", borderRadius: 10 },
  xpText:            { color: "#9ca3af", fontSize: 11, marginTop: 4 },
  streakText:        { color: "#F59E0B", fontSize: 12, fontWeight: "700", marginTop: 4 },
  tabsRow:           { flexDirection: "row", marginHorizontal: 16, marginTop: 8, backgroundColor: "#ede9fe", borderRadius: 30, padding: 4 },
  tabBtn:            { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: "center" },
  tabBtnActive:      { backgroundColor: COLORS.primary },
  tabText:           { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  tabTextActive:     { color: "#fff" },
});
