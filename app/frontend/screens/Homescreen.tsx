// screens/HomeScreen.ts
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import { useFocusEffect } from "@react-navigation/native";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return { icon: "☀️",  text: "Bonjour" };
  if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
  if (hour >= 18 && hour < 21) return { icon: "🌅",  text: "Bonsoir" };
  return { icon: "🌙", text: "Bonne nuit" };
}

type Mission = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  status: "Terminée" | "En cours" | "En retard";
  date: string;
};

type UserStats = {
  userName: string;
  level: number;
  xp: number;
  maxXp: number;
  coins: number;
  energie: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Missions");
  const [activeNav, setActiveNav] = useState("home");
  const { selectedModel } = useAvatar();
  const { userId } = useUser();
  const { icon: timeIcon, text: timeText } = getTimeGreeting();

  // ✅ Stats utilisateur depuis la DB
  const [userStats, setUserStats] = useState<UserStats>({
    userName: "Sonia",
    level: 1,
    xp: 0,
    maxXp: 500,
    coins: 0,
    energie: 100,
  });

  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState({
    terminated: 0,
    inProgress: 0,
    late: 0,
    streak: 0,
    weekTime: "0h 00",
    successRate: 0,
  });

  // ✅ Rechargement à chaque focus (pour voir les XP gagnés depuis MissionsScreen)
  useFocusEffect(useCallback(() => {
    if (userId) {
      fetchUserStats();
      fetchMissions();
    }
  }, [userId]));

  // ── Fetch stats utilisateur ─────────────────────────────────────────────────
  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nom, prenom, xp, energie, niveau, coins")
        .eq("id_user", userId)
        .single();

      if (error || !data) return;

      const niveau  = data.niveau ?? 1;
      const xp      = data.xp ?? 0;
      // XP requis pour le prochain niveau = niveau * 500
      const maxXp   = niveau * 500;

      setUserStats({
        userName: data.prenom ?? data.nom ?? "Joueur",
        level:    niveau,
        xp:       xp % maxXp,   // XP dans le niveau courant
        maxXp:    maxXp,
        coins:    data.coins ?? 0,
        energie:  data.energie ?? 100,
      });
    } catch (err: any) {
      console.error("Erreur fetchUserStats:", err.message);
    }
  };

  // ── Fetch missions (5 dernières) + stats ────────────────────────────────────
  const fetchMissions = async () => {
    try {
      // 1. Toutes les missions pour les stats
      const { data: allMissions, error: err1 } = await supabase
        .from("mission")
        .select("id_mission, titre, duree_min, statut, date_limite");
      if (err1) throw err1;

      const now = new Date();
      const terminated = (allMissions ?? []).filter(m => m.statut === "done").length;
      const inProgress = (allMissions ?? []).filter(m => m.statut === "running" || m.statut === "paused").length;
      // "late" = deadline dépassée et pas terminée
      const late       = (allMissions ?? []).filter(m =>
        m.statut === "fail" ||
        (m.date_limite && new Date(m.date_limite) < now && m.statut !== "done")
      ).length;

      const total       = terminated + inProgress + late;
      const successRate = total > 0 ? Math.round((terminated / total) * 100) : 0;

      // Temps total de la semaine (missions validées cette semaine)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weekValidations } = await supabase
        .from("mission_validation")
        .select("id_mission, date_debut")
        .eq("id_user", userId ?? 0)
        .gte("date_debut", startOfWeek.toISOString());

      const weekMissionIds = new Set((weekValidations ?? []).map(v => v.id_mission));
      const weekMissions   = (allMissions ?? []).filter(m => weekMissionIds.has(m.id_mission));
      const totalMinutes   = weekMissions.reduce((acc, m) => acc + (m.duree_min ?? 0), 0);
      const weekTime       = `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}`;

      // ✅ Calcul streak : jours consécutifs avec au moins 1 validation
      const { data: allValidations } = await supabase
        .from("mission_validation")
        .select("date_debut")
        .eq("id_user", userId ?? 0)
        .order("date_debut", { ascending: false });

      let streak = 0;
      if (allValidations && allValidations.length > 0) {
        const days = new Set(allValidations.map(v =>
          new Date(v.date_debut).toLocaleDateString("fr-FR")
        ));
        let checkDate = new Date();
        while (days.has(checkDate.toLocaleDateString("fr-FR"))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      setStats({ terminated, inProgress, late, streak, weekTime, successRate });

      // 2. Les 5 dernières missions pour la liste
      const { data: recentData, error: err2 } = await supabase
        .from("mission")
        .select("id_mission, titre, duree_min, statut, date_limite")
        .order("id_mission", { ascending: false })
        .limit(5);
      if (err2) throw err2;

      const mapped: Mission[] = (recentData ?? []).map(m => ({
        id:       String(m.id_mission),
        title:    m.titre ?? "Sans titre",
        tag:      "",
        duration: m.duree_min ? `${Math.floor(m.duree_min / 60)}h${String(m.duree_min % 60).padStart(2, "0")}` : "-",
        status:   mapStatus(m.statut, m.date_limite),
        date:     m.date_limite ? new Date(m.date_limite).toLocaleDateString("fr-FR") : "-",
      }));
      setMissions(mapped);

    } catch (err: any) {
      console.error("❌ Erreur fetch HomeScreen:", err.message);
    }
  };

  const mapStatus = (statut: string, dateLimite: string | null): "Terminée" | "En cours" | "En retard" => {
    if (statut === "done") return "Terminée";
    if (statut === "fail") return "En retard";
    if (dateLimite && new Date(dateLimite) < new Date() && statut !== "done") return "En retard";
    if (statut === "running" || statut === "paused") return "En cours";
    return "En cours";
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
            {/* Barre énergie */}
            <View style={styles.energieBadge}>
              <Text style={styles.energieIcon}>⚡</Text>
              <View style={styles.energieTrack}>
                <View style={[styles.energieFill, { width: `${userStats.energie}%` as any }]} />
              </View>
              <Text style={styles.energieText}>{userStats.energie}</Text>
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
              {/* XP Bar */}
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
              {/* Streak */}
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
              onAdd={() => { fetchMissions(); fetchUserStats(); }}
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
  container:       { flex: 1, backgroundColor: "#f5f3ff" },
  scroll:          { flex: 1 },
  scrollContent:   { paddingBottom: 20 },
  header:          { paddingTop: 30, paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  topRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  coinsBadge:      { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, ...SHADOWS.light },
  coinIcon:        { fontSize: 16 },
  coinsText:       { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  // Énergie
  energieBadge:    { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 6, ...SHADOWS.light },
  energieIcon:     { fontSize: 14 },
  energieTrack:    { width: 50, height: 6, backgroundColor: "#FDE68A", borderRadius: 3, overflow: "hidden" },
  energieFill:     { height: "100%", backgroundColor: "#F59E0B", borderRadius: 3 },
  energieText:     { fontSize: 12, fontWeight: "700", color: "#92400E" },
  headerIcons:     { flexDirection: "row", gap: 8 },
  profileRow:      { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrapper:   { width: 80, height: 100, borderRadius: 20, overflow: "hidden", position: "relative", backgroundColor: "#ede9fe", ...SHADOWS.medium },
  avatarPlaceholder:{ flex: 1, backgroundColor: "#ede9fe", justifyContent: "center", alignItems: "center" },
  avatarEmoji:     { fontSize: 40 },
  levelBadge:      { position: "absolute", bottom: 4, alignSelf: "center", backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: "#fff", zIndex: 10 },
  levelText:       { color: "#fff", fontSize: 10, fontWeight: "700" },
  infoBlock:       { flex: 1 },
  greetingRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting:        { color: "#6b7280", fontSize: 14, flex: 1 },
  greetingName:    { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  timeIcon:        { fontSize: 20 },
  xpBarBg:         { height: 8, backgroundColor: "#ddd6fe", borderRadius: 10, marginTop: 10, overflow: "hidden" },
  xpBarFill:       { height: "100%", borderRadius: 10 },
  xpText:          { color: "#9ca3af", fontSize: 11, marginTop: 4 },
  streakText:      { color: "#F59E0B", fontSize: 12, fontWeight: "700", marginTop: 4 },
  tabsRow:         { flexDirection: "row", marginHorizontal: 16, marginTop: 8, backgroundColor: "#ede9fe", borderRadius: 30, padding: 4 },
  tabBtn:          { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: "center" },
  tabBtnActive:    { backgroundColor: COLORS.primary },
  tabText:         { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  tabTextActive:   { color: "#fff" },
});
