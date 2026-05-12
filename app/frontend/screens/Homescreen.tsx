import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import SettingIcone from "../components/SettingIcone";
import NotifIcone from "../components/NotifIcone";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AvatarCrd from "../components/AvatarCrd";
import EventsTab from "../components/EventsTab";
import MissionProgress from "../components/MissionProgress";
import MissionsList from "../components/MissionsList";
import Navbar from "../components/Navbar";
import StatsBar from "../components/StatsBar";
import WaveBackground from "../components/waveBackground";
import { GoldCoin } from "../components/GoldCoin";
import { useAvatar } from "../constants/AvatarContext";
import { useUser } from "../constants/UserContext";
import { supabase } from "../../../app/frontend/constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import { fetchMissionStats, fetchRecentMissions } from "../../../backend/models/mission.service";
import type { MissionStats, RecentMission } from "../../../backend/models/mission.service";
import SuggestedMissionsSection from "../components/Suggestedmissionssection";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";

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
  const { startMissionId } = useLocalSearchParams<{ startMissionId?: string }>();
  const router    = useRouter();
  const [activeTab, setActiveTab] = useState("Missions");
  const [activeNav, setActiveNav] = useState("home");

  const { userId, username: ctxUsername, isLoading } = useUser();
  const { icon: timeIcon, text: timeText }           = getTimeGreeting();
  // ✅ selectedModel peut être null si aucun avatar n'a été choisi
  const { selectedModel, setSelectedModel }          = useAvatar();

  const [userStats, setUserStats] = useState<UserStats>({
    userName: ctxUsername || "Joueur",
    level: 1, xp: 0, maxXp: 500, coins: 0, energie: 100,
  });

  const [missions, setMissions] = useState<RecentMission[]>([]);
  const [stats, setStats] = useState<MissionStats>({
    terminated: 0, inProgress: 0, late: 0,
    streak: 0, weekTime: "0h 00", successRate: 0,
  });
  const [autoStartId, setAutoStartId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading || !userId) return;
    fetchUserStats();
    loadMissionData();
  }, [userId, isLoading]);

  useEffect(() => {
    if (!startMissionId) return;
    setAutoStartId(Number(startMissionId));
  }, [startMissionId]);

  // ── Fetch stats utilisateur ───────────────────────────────
  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nom, prenom, username, xp, gold, id_level, energie, avatar_url")
        .eq("id_user", userId)
        .single();

      if (error || !data) return;

      const xpTotal          = data.xp ?? 0;
      const niveau           = Math.floor(xpTotal / 500) + 1;
      const xpInCurrentLevel = xpTotal % 500;
      const displayName      = data.username ?? data.prenom ?? data.nom ?? ctxUsername ?? "Joueur";

      // ✅ FIX : on ne met l'avatar que si avatar_url existe vraiment
      if (data.avatar_url) {
        setSelectedModel(data.avatar_url);
      } else {
        setSelectedModel(null);
      }

      setUserStats({
        userName: displayName,
        level:    niveau,
        xp:       xpInCurrentLevel,
        maxXp:    500,
        coins:    data.gold    ?? 0,
        energie:  data.energie ?? 100,
      });
    } catch (err: any) {
      console.error("Erreur fetchUserStats:", err.message);
    }
  };

  // ── Missions ──────────────────────────────────────────────
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

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.topRow}>

            {/* ✅ Pièces d'or avec GoldCoin (plus de 🪙) */}
            <View style={styles.coinsBadge}>
              <GoldCoin size={18} />
              <Text style={styles.coinsText}>{userStats.coins.toLocaleString()}</Text>
            </View>

            <View style={styles.headerIcons}>
              <NotifIcone onPress={() => router.push("/frontend/screens/NotificationsScreen")} />
              <SettingIcone onPress={() => console.log("Settings")} />
            </View>
          </View>

          <View style={styles.profileRow}>
            {/* ── Avatar : vrai avatar OU placeholder cliquable → Boutique ── */}
            <View style={styles.avatarWrapper}>
              {selectedModel ? (
                // Avatar choisi → on l'affiche
                <AvatarCrd model={selectedModel} bgColor={COLORS.coinsBadgeBg} />
              ) : (
                // ✅ Aucun avatar → placeholder cliquable → Boutique
                <TouchableOpacity
                  style={styles.avatarPlaceholder}
                  onPress={() => router.push("/frontend/screens/BoutiqueScreen")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.avatarEmoji}>🧑</Text>
                  <Text style={styles.avatarPlaceholderHint}>Choisir →</Text>
                </TouchableOpacity>
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
                <Text style={styles.streakText}>
                  🔥 {stats.streak} jour{stats.streak > 1 ? "s" : ""} de suite !
                </Text>
              )}
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
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.screenBg },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  header:    { paddingTop: 30, paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  topRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },

  // ✅ Badge coins sans emoji 🪙
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.coinsBadgeBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    ...SHADOWS.light,
  },
  coinsText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },

  headerIcons: { flexDirection: "row", gap: 8 },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 16 },

  // Avatar wrapper
  avatarWrapper: {
    width: 80,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.coinsBadgeBg,
    ...SHADOWS.medium,
  },

  // ✅ Placeholder cliquable quand aucun avatar n'est défini
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: "#f0ecff",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  avatarEmoji:           { fontSize: 36 },
  avatarPlaceholderHint: { fontSize: 8, color: "#6d28d9", fontWeight: "800", textAlign: "center" },

  levelBadge: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: COLORS.modalTitle,
    zIndex: 10,
  },
  levelText: { color: COLORS.modalTitle, fontSize: 10, fontWeight: "700" },

  infoBlock:   { flex: 1 },
  greetingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting:    { color: COLORS.greetingColor, fontSize: 14, flex: 1 },
  greetingName:{ color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  timeIcon:    { fontSize: 20 },

  xpBarBg:  { height: 8, backgroundColor: COLORS.xpBarBg, borderRadius: 10, marginTop: 10, overflow: "hidden" },
  xpBarFill:{ height: "100%", borderRadius: 10 },
  xpText:   { color: COLORS.xpTextColor, fontSize: 11, marginTop: 4 },
  streakText:{ color: COLORS.streakColor, fontSize: 12, fontWeight: "700", marginTop: 4 },

  tabsRow:      { flexDirection: "row", marginHorizontal: 16, marginTop: 8, backgroundColor: COLORS.tabBarBg, borderRadius: 30, padding: 4 },
  tabBtn:       { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText:      { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  tabTextActive:{ color: COLORS.modalTitle },
});