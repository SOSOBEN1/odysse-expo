

// import { MaterialIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ScrollView, StatusBar, StyleSheet, Text,
//   TouchableOpacity, View,
// } from "react-native";
// import Svg, { Circle, Text as SvgText } from "react-native-svg";
// import AvatarCrd from "../components/AvatarCrd";
// import Navbar from "../components/Navbar";
// import NotifIcone from "../components/NotifIcone";
// import PuzzleIcone from "../components/PuzzleIcone";
// import SettingIcone from "../components/SettingIcone";
// import WaveBackground from "../components/waveBackground";
// import SuggestedMissionsSection from "../components/Suggestedmissionssection"
// import { useAvatar } from "../constants/AvatarContext";
// import { useUser } from "../constants/UserContext";
// import { supabase } from "../constants/supabase";
// import { COLORS, SHADOWS, SIZES } from "../styles/theme";
// import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";
// import { useDerivedStats } from "../hooks/useDerivedStats";
// // ✅ Import du hook périodique
// import { usePeriodicQuestionnaire } from "../hooks/usePeriodicQuestionnaire";
// import { useTodayMissions, TodayMission } from "../hooks/useTodayMissions";


// function computeDerivedStats(base: any) {
//   const clamp = (v: number) => Math.min(100, Math.max(0, v));
//   return {
//     concentration: clamp(base.energie * 0.5 + base.connaissance * 0.5),
//     serenite:      clamp(100 - base.stress),
//     discipline:    clamp(base.organisation * 0.7 + base.connaissance * 0.3),
//   };
// }

// function useAllStats() {
//   const { userId } = useUser();
//   const [stats, setStats] = useState({
//     energie: 50, stress: 50, connaissance: 50, organisation: 50,
//   });

//   useEffect(() => {
//     if (!userId) return;
//     const load = async () => {
//       const { data, error } = await supabase
//         .from("player_stats")
//         .select("energie, stress, connaissance, organisation")
//         .eq("id_user", userId)
//         .maybeSingle();
//       if (!error && data) {
//         setStats({
//           energie:      data.energie      ?? 0,
//           stress:       data.stress       ?? 0,
//           connaissance: data.connaissance ?? 0,
//           organisation: data.organisation ?? 0,
//         });
//       }
//     };
//     load();
//   }, [userId]);

//   return stats;
// }

// interface Stat         { label: string; percent: number; color: string; emoji: string; }
// interface Mission      { id: string; title: string; subtitle: string; status: "continue" | "start" | "suggested"; emoji: string; }
// interface ProgressStat { label: string; emoji: string; percent: number; xpReward: number; xpBonus: number; }
// interface DashboardUser { userName: string; level: number; xp: number; maxXp: number; coins: number; }

// const stars = [
//   { top: 10,    left: 10,   size: 20, opacity: 0.6  },
//   { top: 10,    right: 10,  size: 12, opacity: 0.4  },
//   { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
//   { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
//   { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
//   { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
//   { top: 40,    right: 50,  size: 22, opacity: 0.7  },
//   { top: 60,    left: 150,  size: 14, opacity: 0.45 },
//   { bottom: 80, left: 16,   size: 18, opacity: 0.55 },
// ];

// function getTimeGreeting() {
//   const hour = new Date().getHours();
//   if (hour >= 6  && hour < 12) return { icon: "☀️",  text: "Bonjour" };
//   if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
//   if (hour >= 18 && hour < 21) return { icon: "🌅",  text: "Bonsoir" };
//   return { icon: "🌙", text: "Bonne nuit" };
// }

// function getLevelTitle(niveau: number): string {
//   if (niveau === 1)  return "Débutant curieux 🌱";
//   if (niveau === 2)  return "Apprenti motivé 🔥";
//   if (niveau <= 4)   return "Explorateur de savoir 🗺️";
//   if (niveau <= 6)   return "Apprenti maître ⚡";
//   if (niveau <= 9)   return "Stratège confirmé 🧠";
//   if (niveau <= 14)  return "Expert discipliné 💎";
//   if (niveau <= 19)  return "Maître de l'odyssée 🏆";
//   if (niveau <= 29)  return "Vétéran légendaire 👑";
//   if (niveau <= 39)  return "Élite suprême 🦁";
//   return "Légende vivante ✨";
// }

// function getLevelDescription(niveau: number): string {
//   if (niveau === 1)  return "Chaque mission te rapproche de la maîtrise.";
//   if (niveau === 2)  return "La flamme est allumée, continue !";
//   if (niveau <= 4)   return "Ton potentiel commence à se révéler.";
//   if (niveau <= 6)   return "Place à la discipline et à la régularité.";
//   if (niveau <= 9)   return "Tu penses et agis comme un stratège.";
//   if (niveau <= 14)  return "L'excellence devient une habitude.";
//   if (niveau <= 19)  return "Peu atteignent ce niveau de maîtrise.";
//   if (niveau <= 29)  return "Ton parcours inspire ceux qui commencent.";
//   if (niveau <= 39)  return "La légende se construit mission par mission.";
//   return "Tu es au sommet. Une légende vivante. ✨";
// }


// function useDashboardUser(): DashboardUser {
//   const { userId, username: ctxUsername } = useUser();
//   const [user, setUser] = useState<DashboardUser>({
//     userName: ctxUsername || "Joueur",
//     level: 1, xp: 0, maxXp: 500, coins: 0,
//   });

//   useEffect(() => {
//     if (!userId) return;
//     const fetchUser = async () => {
//       const { data, error } = await supabase
//         .from("users")
//         .select("prenom, nom, username, xp, gold, id_level")
//         .eq("id_user", userId)
//         .single();
//       if (error || !data) return;
//       const xpTotal = data.xp ?? 0;
//       const niveau  = Math.floor(xpTotal / 500) + 1;  // 500 XP = 1 niveau
//       const xpDansNiveau = xpTotal % 500;              // XP dans le niveau actuel (0..499)
//       const maxXp  = 500;
//       setUser({
//         userName: data.username ?? data.prenom ?? data.nom ?? ctxUsername ?? "Joueur",
//         level:    niveau,
//         xp:       xpDansNiveau,
//         maxXp,
//         coins:    data.gold ?? 0,
//       });
//     };
//     fetchUser();
//   }, [userId, ctxUsername]);

//   return user;
// }

// // ─── HEADER ───────────────────────────────────────────────────────────────────
// const DashboardHeader = () => {
//  const { selectedModel }                  = useAvatar();

//   const { icon: timeIcon, text: timeText } = getTimeGreeting();
//   const router                             = useRouter();
//   const USER                               = useDashboardUser();
//   const xpPercent = USER.maxXp > 0 ? (USER.xp / USER.maxXp) * 100 : 0;

//   return (
//     <View style={headerStyles.container}>
//       <View style={headerStyles.topRow}>
//         <View style={headerStyles.coinsBadge}>
//           <Text style={headerStyles.coinIcon}>🪙</Text>
//           <Text style={headerStyles.coinsText}>{USER.coins.toLocaleString()}</Text>
//         </View>
//         <View style={headerStyles.headerIcons}>
//           <PuzzleIcone onPress={() => router.push("/frontend/screens/WorldsScreen")} />
//           <NotifIcone onPress={() => {
//   router.push("/frontend/screens/NotificationsScreen");
// }} /> 
//           <SettingIcone />
//         </View>
//       </View>

//       <View style={headerStyles.profileRow}>
//         <View style={headerStyles.avatarWrapper}>
//           {selectedModel ? (
//             <AvatarCrd model={selectedModel} />
//           ) : (
//             <View style={headerStyles.avatarPlaceholder}>
//               <Text style={headerStyles.avatarEmoji}>🧑</Text>
//             </View>
//           )}
//           <View style={headerStyles.levelBadge}>
//             <Text style={headerStyles.levelText}>Niv. {USER.level}</Text>
//           </View>
//         </View>

//         <View style={headerStyles.infoBlock}>
//           <View style={headerStyles.greetingRow}>
//             <Text style={headerStyles.greeting}>
//               {timeText},{" "}
//               <Text style={headerStyles.greetingName}>{USER.userName}!</Text>
//             </Text>
//             <Text style={headerStyles.timeIcon}>{timeIcon}</Text>
//           </View>
//           <Text style={headerStyles.levelTitle}>{getLevelTitle(USER.level)}</Text>
//           <Text style={headerStyles.levelDesc}>{getLevelDescription(USER.level)}</Text>
//           <View style={headerStyles.xpBarBg}>
//             <LinearGradient
//               colors={[COLORS.secondary, COLORS.primary]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={[headerStyles.xpBarFill, { width: `${xpPercent}%` }]}
//             />
//           </View>
//           <Text style={headerStyles.xpText}>
//             {USER.xp.toLocaleString()} XP / {USER.maxXp.toLocaleString()} XP
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// const headerStyles = StyleSheet.create({
//   container:         { paddingTop: 30, paddingHorizontal: SIZES.padding, paddingBottom: 20 },
//   topRow:            { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
//   coinsBadge:        { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.coinsBadgeBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, ...SHADOWS.light },
//   coinIcon:          { fontSize: 16 },
//   coinsText:         { color: COLORS.primary, fontWeight: "700" },
//   headerIcons:       { flexDirection: "row", gap: 8 },
//   profileRow:        { flexDirection: "row", gap: 16 },
//   avatarWrapper:     { width: 80, height: 100, borderRadius: 20, overflow: "hidden", backgroundColor: COLORS.coinsBadgeBg, position: "relative", ...SHADOWS.medium },
//   avatarPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
//   avatarEmoji:       { fontSize: 40 },
//   levelBadge:        { position: "absolute", bottom: 4, alignSelf: "center", backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
//   levelText:         { color: COLORS.modalTitle, fontSize: 10, fontWeight: "700" },
//   infoBlock:         { flex: 1 },
//   greetingRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   greeting:          { fontSize: 14, color: COLORS.greetingColor, flex: 1 },
//   greetingName:      { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
//   timeIcon:          { fontSize: 20 },
//   levelTitle:        { fontSize: 11, color: COLORS.levelTitleColor, fontWeight: "700", marginTop: 2 },
//   levelDesc:         { fontSize: 10, color: COLORS.levelTitleColor, opacity: 0.75, fontStyle: "italic", marginTop: 1 },
//   xpBarBg:           { height: 8, backgroundColor: COLORS.xpBarBg, borderRadius: 10, marginTop: 8, overflow: "hidden" },
//   xpBarFill:         { height: "100%", borderRadius: 10 },
//   xpText:            { fontSize: 11, color: COLORS.xpTextColor, marginTop: 4 },
// });

// // ─── CircularProgress ─────────────────────────────────────────────────────────
// const CircularProgress = ({ percent, color, size = 70, strokeWidth = 7 }: { percent: number; color: string; size?: number; strokeWidth?: number }) => {
//   const radius       = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const progress     = circumference * (1 - percent / 100);
//   return (
//     <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//       <Circle cx={size/2} cy={size/2} r={radius} stroke={COLORS.circleTrack} strokeWidth={strokeWidth} fill="none" />
//       <Circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
//         strokeDasharray={`${circumference}`} strokeDashoffset={`${progress}`}
//         strokeLinecap="round" rotation="-90" origin={`${size/2}, ${size/2}`} />
//       <SvgText x={size/2} y={size/2+5} textAnchor="middle" fontSize={13} fontWeight="700" fill={COLORS.text}>
//         {percent}%
//       </SvgText>
//     </Svg>
//   );
// };

// // ─── StatsCard ────────────────────────────────────────────────────────────────
// const StatsCard = () => {
//   const stats = useAllStats();

//   const STATS: Stat[] = [
//     { label: "Énergie",      percent: stats.energie      ?? 0, color: COLORS.statEnergie,      emoji: "⚡" },
//     { label: "Stress",       percent: stats.stress       ?? 0, color: COLORS.statStress,       emoji: "😰" },
//     { label: "Connaissance", percent: stats.connaissance ?? 0, color: COLORS.statConnaissance, emoji: "📚" },
//     { label: "Organisation", percent: stats.organisation ?? 0, color: COLORS.statOrganisation, emoji: "🗂️" },
//   ];

//   return (
//     <View style={[statsStyles.card, SHADOWS.light]}>
//       <View style={statsStyles.row}>
//         {STATS.map((s) => (
//           <View key={s.label} style={statsStyles.item}>
//             <CircularProgress percent={Math.round(s.percent)} color={s.color} />
//             <View style={statsStyles.labelRow}>
//               <Text style={{ fontSize: 11 }}>{s.emoji}</Text>
//               <Text style={statsStyles.label}>{s.label}</Text>
//             </View>
//             <Text style={statsStyles.sub}>Niveau actuel</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const statsStyles = StyleSheet.create({
//   card:     { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: 15, marginBottom: 20 },
//   row:      { flexDirection: "row", justifyContent: "space-between" },
//   item:     { alignItems: "center", gap: 4 },
//   labelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
//   label:    { fontSize: 11, fontWeight: "700", color: COLORS.text },
//   sub:      { fontSize: 9, color: COLORS.statSubColor },
// });

// // ─── MissionCard ──────────────────────────────────────────────────────────────
// const MissionCard = ({ mission }: { mission: TodayMission }) => {
//   const isContinue = mission.status === "continue";
//   const isDone     = mission.status === "done";
//   const isFail     = mission.status === "fail";

//   return (
//     <View style={[
//       missionStyles.card,
//       isDone && missionStyles.doneCard,
//       isFail && missionStyles.failCard,
//     ]}>
//       <View style={missionStyles.iconBox}>
//         <Text style={{ fontSize: 20 }}>{mission.emoji}</Text>
//       </View>

//       <View style={missionStyles.textBox}>
//         <Text style={missionStyles.title}>{mission.title}</Text>
//         <Text style={missionStyles.sub}>{mission.subtitle}</Text>
//         <Text style={missionStyles.xpText}>+{mission.xp_gain} XP</Text>
//       </View>

//       {isDone ? (
//         <View style={missionStyles.doneChip}>
//           <Text style={missionStyles.doneText}>✓ Fait</Text>
//         </View>
//       ) : isFail ? (
//         <View style={missionStyles.failChip}>
//           <Text style={missionStyles.failText}>✗ Raté</Text>
//         </View>
//       ) : (
//         <TouchableOpacity
//           style={[
//             missionStyles.btn,
//             isContinue ? missionStyles.btnContinue : missionStyles.btnStart,
//           ]}
//         >
//           <Text style={missionStyles.btnText}>
//             {isContinue ? "Continuer ▶" : "Démarrer ▶"}
//           </Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const missionStyles = StyleSheet.create({
//   card:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.missionCardBg, borderRadius: SIZES.radius, padding: 12, marginBottom: 10, gap: 10 },
//   doneCard:     { opacity: 0.7 },
//   failCard:     { opacity: 0.5 },
//   iconBox:      { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.missionIconBg, alignItems: "center", justifyContent: "center" },
//   textBox:      { flex: 1 },
//   title:        { fontSize: 13, fontWeight: "700", color: COLORS.text },
//   sub:          { fontSize: 11, color: COLORS.missionSubColor, marginTop: 1 },
//   xpText:       { fontSize: 10, color: COLORS.levelTitleColor, fontWeight: "600", marginTop: 2 },
//   btn:          { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
//   btnContinue:  { backgroundColor: COLORS.primary },
//   btnStart:     { backgroundColor: COLORS.missionBtnStart },
//   btnText:      { fontSize: 11, fontWeight: "700", color: COLORS.modalTitle },
//   doneChip:     { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
//   doneText:     { fontSize: 11, fontWeight: "700", color: "#4CAF50" },
//   failChip:     { backgroundColor: "#FFEBEE", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
//   failText:     { fontSize: 11, fontWeight: "700", color: "#E84040" },
// });

// const MISSIONS: Mission[] = [
//   { id: "m1", title: "Mission 1:", subtitle: "Faire des exercices",             status: "continue",  emoji: "📅" },
//   { id: "m2", title: "Mission 2:", subtitle: "Compléter la séance de révision", status: "start",     emoji: "📦" },
//   { id: "m3", title: "Mission 3",  subtitle: "Diminuer votre stress",           status: "suggested", emoji: "📦" },
//   { id: "m4", title: "Mission 4",  subtitle: "Compléter la séance de révision", status: "suggested", emoji: "📦" },
// ];

// export const MissionsSection = () => {
//   const router = useRouter();
//   const { missions, loading, error } = useTodayMissions();

//   return (
//     <View style={[missionsStyles.card, SHADOWS.light]}>
//       <Text style={missionsStyles.title}>Missions du jour</Text>

//       {loading ? (
//         <Text style={missionsStyles.infoText}>Chargement…</Text>
//       ) : error ? (
//         <Text style={missionsStyles.infoText}>❌ {error}</Text>
//       ) : missions.length === 0 ? (
//         <Text style={missionsStyles.infoText}>Aucune mission pour aujourd'hui 🎉</Text>
//       ) : (
//         missions.map((m) => <MissionCard key={m.id_validation} mission={m} />)
//       )}

//       <TouchableOpacity
//         style={missionsStyles.addBtn}
//          onPress={() => router.push("/frontend/screens/Missions?openCreate=true")} // ← ici
//       >
//         <Text style={missionsStyles.addText}>＋ Ajouter une mission</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const missionsStyles = StyleSheet.create({
//   card:     { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: SIZES.padding, marginBottom: 14, ...SHADOWS.light },
//   title:    { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 14 },
//   infoText: { color: COLORS.missionSubColor, fontSize: 13, textAlign: "center", marginBottom: 10 },
//   addBtn:   { borderWidth: 1.5, borderColor: COLORS.secondary, borderStyle: "dashed", borderRadius: 30, paddingVertical: 11, alignItems: "center", marginTop: 4 },
//   addText:  { color: COLORS.secondary, fontWeight: "700", fontSize: 14 },
// });


// // ─── BossEventBanner ──────────────────────────────────────────────────────────
// // ─── BossEventBanner ──────────────────────────────────────────────────────────
// const BossEventBanner = () => {
//   const { userId } = useUser();
//   const router = useRouter();
//   const [bossData, setBossData] = useState({
//     activeCount: 0,
//     progression: 0,
//     totalXp: 0,
//     loading: true,
//   });

//   useEffect(() => {
//     if (!userId) return;
//     const load = async () => {
//       try {
//         const { data: bossEvents, error } = await supabase
//           .from("boss_events")
//           .select(`
//             id_boss,
//             nom,
//             mission (
//               id_mission,
//               id_user,
//               xp_gain,
//               mission_validation ( statut )
//             )
//           `)
//           .order("created_at", { ascending: false });

//         if (error) throw error;

//         let totalMissions = 0;
//         let doneMissions  = 0;
//         let activeCount   = 0;
//         let totalXp       = 0;

//         (bossEvents ?? []).forEach((boss: any) => {
//           const userMissions = (boss.mission ?? []).filter(
//             (m: any) => String(m.id_user) === String(userId)
//           );
//           if (userMissions.length === 0) return;

//           activeCount++;

//           userMissions.forEach((m: any) => {
//             totalMissions++;
//             const isDone = (m.mission_validation ?? []).some(
//               (v: any) => v.statut === "done"
//             );
//             if (isDone) {
//               doneMissions++;
//               totalXp += m.xp_gain ?? 0;
//             }
//           });
//         });

//         const progression = totalMissions > 0
//           ? Math.round((doneMissions / totalMissions) * 100)
//           : 0;

//         setBossData({ activeCount, progression, totalXp, loading: false });

//       } catch (err: any) {
//         console.error("[BossEventBanner]", err.message);
//         setBossData(prev => ({ ...prev, loading: false }));
//       }
//     };

//     load();
//   }, [userId]);

//   if (bossData.loading) return null;

//   // Rien à afficher si l'user n'a aucun boss event
//   if (bossData.activeCount === 0) return null;

//   return (
//     <View style={bossStyles.outer}>
//       <View style={bossStyles.topBanner}>
//         <Text style={{ fontSize: 30 }}>🏆</Text>
//         <View style={{ flex: 1 }}>
//           <Text style={bossStyles.bossTitle}>Boss Event</Text>
//           <Text style={bossStyles.bossSub}>
//             {bossData.activeCount} actif{bossData.activeCount > 1 ? "s" : ""} 🔥
//           </Text>
//         </View>
//         <View style={bossStyles.xpChip}>
//           <Text style={bossStyles.xpText}>+{bossData.totalXp} XP</Text>
//         </View>
//         <TouchableOpacity
//           style={bossStyles.voirBtn}
//           onPress={() => router.push("/frontend/screens/EventsScreen")}
//         >
//           <Text style={bossStyles.voirText}>Voir ▶</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={bossStyles.progressRow}>
//         <Text style={bossStyles.progLabel}>Progression globale</Text>
//         <View style={bossStyles.progTrack}>
//           <View style={[bossStyles.progFill, { width: `${bossData.progression}%` }]} />
//         </View>
//         <Text style={bossStyles.progPct}>{bossData.progression}%</Text>
//       </View>

//       <View style={bossStyles.bottomCard}>
//         <View style={bossStyles.circleGauge}>
//           <Text style={bossStyles.circleText}>{bossData.progression}%</Text>
//         </View>
//         <View style={{ flex: 1, marginLeft: 14 }}>
//           <View style={bossStyles.bottomRow}>
//             <Text style={{ fontSize: 22 }}>🏆</Text>
//             <Text style={bossStyles.bottomTitle}>Boss Event</Text>
//             <Text style={bossStyles.stars}>⭐⭐⭐ XP</Text>
//           </View>
//           <View style={bossStyles.bottomRow2}>
//             <Text style={bossStyles.bottomSub}>
//               {bossData.activeCount} actif{bossData.activeCount > 1 ? "s" : ""}
//             </Text>
//             <View style={bossStyles.xpChipSmall}>
//               <Text style={bossStyles.xpTextSmall}>+{bossData.totalXp} XP</Text>
//             </View>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// const bossStyles = StyleSheet.create({
//   outer:       { marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusLarge, overflow: "hidden", marginBottom: 14, backgroundColor: COLORS.bossOuter },
//   topBanner:   { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, backgroundColor: COLORS.bossTopBanner },
//   bossTitle:   { color: COLORS.modalTitle, fontWeight: "800", fontSize: 16 },
//   bossSub:     { color: COLORS.bossSubText, fontSize: 12 },
//   xpChip:      { backgroundColor: COLORS.bossXpChipBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
//   xpText:      { color: COLORS.bossXpText, fontWeight: "800", fontSize: 12 },
//   voirBtn:     { backgroundColor: COLORS.bossVoirBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
//   voirText:    { color: COLORS.modalTitle, fontWeight: "700", fontSize: 12 },
//   progressRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: COLORS.bossProgressBg },
//   progLabel:   { color: COLORS.modalTitle, fontWeight: "600", fontSize: 12, flex: 1 },
//   progTrack:   { flex: 2, height: 8, backgroundColor: COLORS.bossProgressTrack, borderRadius: 10, overflow: "hidden" },
//   progFill:    { width: "45%", height: "100%", backgroundColor: COLORS.bossProgressFill, borderRadius: 10 },
//   progPct:     { color: COLORS.modalTitle, fontWeight: "800", fontSize: 13 },
//   bottomCard:  { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bossBottomCard, padding: 14, gap: 10 },
//   circleGauge: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: COLORS.bossCircleBorder, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bossCircleBg },
//   circleText:  { color: COLORS.bossXpText, fontWeight: "800", fontSize: 14 },
//   bottomRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
//   bottomTitle: { color: COLORS.modalTitle, fontWeight: "800", fontSize: 15 },
//   stars:       { color: COLORS.bossXpText, fontSize: 12 },
//   bottomRow2:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
//   bottomSub:   { color: COLORS.bossSubText, fontSize: 12 },
//   xpChipSmall: { backgroundColor: COLORS.bossXpChipSmallBg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
//   xpTextSmall: { color: COLORS.modalTitle, fontWeight: "800", fontSize: 11 },
// });

// // ─── GlobalProgressSection ────────────────────────────────────────────────────
// const GlobalProgressSection = () => {
// const { derived } = useDerivedStats();


//   const PROGRESS_STATS: ProgressStat[] = [
//     { label: "Concentration", emoji: "🔥", percent: derived.concentration, xpReward: 15, xpBonus: 10 },
//     { label: "Sérénité",      emoji: "🌿", percent: derived.serenite,      xpReward: 15, xpBonus: 10 },
//     { label: "Discipline",    emoji: "💪", percent: derived.discipline,    xpReward: 10, xpBonus: 10 },
//   ];

//   return (
//     <View style={[gpStyles.card, SHADOWS.light]}>
//       <Text style={gpStyles.title}>Progression globale</Text>
//       <View style={gpStyles.masterTrack}>
//         <View style={gpStyles.masterFill} />
//       </View>
//       {PROGRESS_STATS.map((s) => (
//         <View key={s.label} style={gpStyles.row}>
//           <Text style={gpStyles.rowLabel}>{s.label} {s.emoji}</Text>
//           <View style={gpStyles.rowTrack}>
//             <View style={[gpStyles.rowFill, { width: `${Math.round(s.percent)}%` }]} />
//           </View>
//           <Text style={gpStyles.rowPct}>{Math.round(s.percent)}%</Text>
//           <View style={gpStyles.chip}>
//             <Text style={gpStyles.chipText}>⭐{s.xpReward} XP</Text>
//           </View>
//           <View style={[gpStyles.chip, gpStyles.chipBonus]}>
//             <Text style={gpStyles.chipBonusText}>+{s.xpBonus} XP</Text>
//           </View>
//         </View>
//       ))}
//     </View>
//   );
// };

// const gpStyles = StyleSheet.create({
//   card:          { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: SIZES.padding, marginBottom: 16 },
//   title:         { fontSize: 17, fontWeight: "800", color: COLORS.text, marginBottom: 12 },
//   masterTrack:   { height: 10, backgroundColor: COLORS.masterTrackBg, borderRadius: 10, overflow: "visible", marginBottom: 16 },
//   masterFill:    { width: "55%", height: "100%", backgroundColor: COLORS.masterFill, borderRadius: 10 },
//   row:           { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 },
//   rowLabel:      { fontSize: 12, fontWeight: "600", color: COLORS.text, width: 110 },
//   rowTrack:      { flex: 1, height: 7, backgroundColor: COLORS.progressTrackBg, borderRadius: 10, overflow: "hidden" },
//   rowFill:       { height: "100%", backgroundColor: COLORS.secondary, borderRadius: 10 },
//   rowPct:        { fontSize: 11, fontWeight: "700", color: COLORS.text, width: 32, textAlign: "right" },
//   chip:          { backgroundColor: COLORS.progressTrackBg, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
//   chipText:      { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
//   chipBonus:     { backgroundColor: COLORS.chipBonusBg },
//   chipBonusText: { fontSize: 10, color: COLORS.chipBonusText, fontWeight: "700" },
// });

// // ─── SCREEN ───────────────────────────────────────────────────────────────────
// export default function DashboardScreen() {
//   usePeriodicQuestionnaire();

//   // ── Handler mission suggérée démarrée ─────────────────────
//   const handleSuggestedMissionStart = (mission: MissionSuggestion) => {
//     console.log("Mission suggérée démarrée:", mission.title);
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
//       <WaveBackground height={290} />

//       <View style={styles.stars} pointerEvents="none">
//         {stars.map((s, i) => (
//           <MaterialIcons
//             key={i} name="auto-awesome" size={s.size} color={COLORS.modalTitle}
//             style={{
//               position: "absolute",
//               ...(s.top    !== undefined ? { top: s.top }       : {}),
//               ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
//               ...(s.left   !== undefined ? { left: s.left }     : {}),
//               ...(s.right  !== undefined ? { right: s.right }   : {}),
//               opacity: s.opacity,
//             }}
//           />
//         ))}
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
//         <DashboardHeader />
//         <View style={{ marginTop: 23 }}>
//           <StatsCard />
           
//           <MissionsSection />
//           <SuggestedMissionsSection
//             maxSuggestions={4}
//             onMissionStart={handleSuggestedMissionStart}
//           />
//           <BossEventBanner />

//           {/* ── Suggestions intelligentes basées sur les stats ── */}
         

//           <GlobalProgressSection />
//         </View>
//       </ScrollView>

//       <Navbar active="home" onChange={(key) => console.log(key)} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container:     { flex: 1, backgroundColor: COLORS.screenBg },
//   stars:         { position: "absolute", top: 0, left: 0, right: 0, height: 290, overflow: "hidden" },
//   scrollContent: { paddingBottom: 100 },
// });
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import AvatarCrd from "../components/AvatarCrd";
import Navbar from "../components/Navbar";
import NotifIcone from "../components/NotifIcone";
import PuzzleIcone from "../components/PuzzleIcone";
import SettingIcone from "../components/SettingIcone";
import WaveBackground from "../components/waveBackground";
import SuggestedMissionsSection from "../components/Suggestedmissionssection"
import { useAvatar } from "../constants/AvatarContext";
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import type { MissionSuggestion } from "../utils/MissionSuggestionEngine";
import { useDerivedStats } from "../hooks/useDerivedStats";
// ✅ Import du hook périodique
import { usePeriodicQuestionnaire } from "../hooks/usePeriodicQuestionnaire";
import { useTodayMissions, TodayMission } from "../hooks/useTodayMissions";
import { useStats } from "../constants/StatsContext";


function computeDerivedStats(base: any) {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return {
    concentration: clamp(base.energie * 0.5 + base.connaissance * 0.5),
    serenite:      clamp(100 - base.stress),
    discipline:    clamp(base.organisation * 0.7 + base.connaissance * 0.3),
  };
}

// ✅ useAllStats maintenant délègue au contexte global (se met à jour après chaque mission)
function useAllStats() {
  return useStats().stats;
}

interface Stat         { label: string; percent: number; color: string; emoji: string; }
interface Mission      { id: string; title: string; subtitle: string; status: "continue" | "start" | "suggested"; emoji: string; }
interface ProgressStat { label: string; emoji: string; percent: number; xpReward: number; xpBonus: number; }
interface DashboardUser { userName: string; level: number; xp: number; maxXp: number; coins: number; }

const stars = [
  { top: 10,    left: 10,   size: 20, opacity: 0.6  },
  { top: 10,    right: 10,  size: 12, opacity: 0.4  },
  { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
  { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
  { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
  { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
  { top: 40,    right: 50,  size: 22, opacity: 0.7  },
  { top: 60,    left: 150,  size: 14, opacity: 0.45 },
  { bottom: 80, left: 16,   size: 18, opacity: 0.55 },
];

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return { icon: "☀️",  text: "Bonjour" };
  if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
  if (hour >= 18 && hour < 21) return { icon: "🌅",  text: "Bonsoir" };
  return { icon: "🌙", text: "Bonne nuit" };
}

function getLevelTitle(niveau: number): string {
  if (niveau === 1)  return "Débutant curieux 🌱";
  if (niveau === 2)  return "Apprenti motivé 🔥";
  if (niveau <= 4)   return "Explorateur de savoir 🗺️";
  if (niveau <= 6)   return "Apprenti maître ⚡";
  if (niveau <= 9)   return "Stratège confirmé 🧠";
  if (niveau <= 14)  return "Expert discipliné 💎";
  if (niveau <= 19)  return "Maître de l'odyssée 🏆";
  if (niveau <= 29)  return "Vétéran légendaire 👑";
  if (niveau <= 39)  return "Élite suprême 🦁";
  return "Légende vivante ✨";
}

function getLevelDescription(niveau: number): string {
  if (niveau === 1)  return "Chaque mission te rapproche de la maîtrise.";
  if (niveau === 2)  return "La flamme est allumée, continue !";
  if (niveau <= 4)   return "Ton potentiel commence à se révéler.";
  if (niveau <= 6)   return "Place à la discipline et à la régularité.";
  if (niveau <= 9)   return "Tu penses et agis comme un stratège.";
  if (niveau <= 14)  return "L'excellence devient une habitude.";
  if (niveau <= 19)  return "Peu atteignent ce niveau de maîtrise.";
  if (niveau <= 29)  return "Ton parcours inspire ceux qui commencent.";
  if (niveau <= 39)  return "La légende se construit mission par mission.";
  return "Tu es au sommet. Une légende vivante. ✨";
}


function useDashboardUser(): DashboardUser {
  const { userId, username: ctxUsername } = useUser();
  const [user, setUser] = useState<DashboardUser>({
    userName: ctxUsername || "Joueur",
    level: 1, xp: 0, maxXp: 500, coins: 0,
  });

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("prenom, nom, username, xp, gold, id_level")
        .eq("id_user", userId)
        .single();
      if (error || !data) return;
      const xpTotal = data.xp ?? 0;
      const niveau  = Math.floor(xpTotal / 500) + 1;  // 500 XP = 1 niveau
      const xpDansNiveau = xpTotal % 500;              // XP dans le niveau actuel (0..499)
      const maxXp  = 500;
      setUser({
        userName: data.username ?? data.prenom ?? data.nom ?? ctxUsername ?? "Joueur",
        level:    niveau,
        xp:       xpDansNiveau,
        maxXp,
        coins:    data.gold ?? 0,
      });
    };
    fetchUser();
  }, [userId, ctxUsername]);

  return user;
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const DashboardHeader = () => {
 const { selectedModel }                  = useAvatar();

  const { icon: timeIcon, text: timeText } = getTimeGreeting();
  const router                             = useRouter();
  const USER                               = useDashboardUser();
  const xpPercent = USER.maxXp > 0 ? (USER.xp / USER.maxXp) * 100 : 0;

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.topRow}>
        <View style={headerStyles.coinsBadge}>
          <Text style={headerStyles.coinIcon}>🪙</Text>
          <Text style={headerStyles.coinsText}>{USER.coins.toLocaleString()}</Text>
        </View>
        <View style={headerStyles.headerIcons}>
          <PuzzleIcone onPress={() => router.push("/frontend/screens/WorldsScreen")} />
          <NotifIcone onPress={() => {
  router.push("/frontend/screens/NotificationsScreen");
}} /> 
          <SettingIcone />
        </View>
      </View>

      <View style={headerStyles.profileRow}>
        <View style={headerStyles.avatarWrapper}>
          {selectedModel ? (
            <AvatarCrd model={selectedModel} />
          ) : (
            <View style={headerStyles.avatarPlaceholder}>
              <Text style={headerStyles.avatarEmoji}>🧑</Text>
            </View>
          )}
          <View style={headerStyles.levelBadge}>
            <Text style={headerStyles.levelText}>Niv. {USER.level}</Text>
          </View>
        </View>

        <View style={headerStyles.infoBlock}>
          <View style={headerStyles.greetingRow}>
            <Text style={headerStyles.greeting}>
              {timeText},{" "}
              <Text style={headerStyles.greetingName}>{USER.userName}!</Text>
            </Text>
            <Text style={headerStyles.timeIcon}>{timeIcon}</Text>
          </View>
          <Text style={headerStyles.levelTitle}>{getLevelTitle(USER.level)}</Text>
          <Text style={headerStyles.levelDesc}>{getLevelDescription(USER.level)}</Text>
          <View style={headerStyles.xpBarBg}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[headerStyles.xpBarFill, { width: `${xpPercent}%` }]}
            />
          </View>
          <Text style={headerStyles.xpText}>
            {USER.xp.toLocaleString()} XP / {USER.maxXp.toLocaleString()} XP
          </Text>
        </View>
      </View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container:         { paddingTop: 30, paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  topRow:            { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  coinsBadge:        { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.coinsBadgeBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, ...SHADOWS.light },
  coinIcon:          { fontSize: 16 },
  coinsText:         { color: COLORS.primary, fontWeight: "700" },
  headerIcons:       { flexDirection: "row", gap: 8 },
  profileRow:        { flexDirection: "row", gap: 16 },
  avatarWrapper:     { width: 80, height: 100, borderRadius: 20, overflow: "hidden", backgroundColor: COLORS.coinsBadgeBg, position: "relative", ...SHADOWS.medium },
  avatarPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarEmoji:       { fontSize: 40 },
  levelBadge:        { position: "absolute", bottom: 4, alignSelf: "center", backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  levelText:         { color: COLORS.modalTitle, fontSize: 10, fontWeight: "700" },
  infoBlock:         { flex: 1 },
  greetingRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting:          { fontSize: 14, color: COLORS.greetingColor, flex: 1 },
  greetingName:      { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  timeIcon:          { fontSize: 20 },
  levelTitle:        { fontSize: 11, color: COLORS.levelTitleColor, fontWeight: "700", marginTop: 2 },
  levelDesc:         { fontSize: 10, color: COLORS.levelTitleColor, opacity: 0.75, fontStyle: "italic", marginTop: 1 },
  xpBarBg:           { height: 8, backgroundColor: COLORS.xpBarBg, borderRadius: 10, marginTop: 8, overflow: "hidden" },
  xpBarFill:         { height: "100%", borderRadius: 10 },
  xpText:            { fontSize: 11, color: COLORS.xpTextColor, marginTop: 4 },
});

// ─── CircularProgress ─────────────────────────────────────────────────────────
const CircularProgress = ({ percent, color, size = 70, strokeWidth = 7 }: { percent: number; color: string; size?: number; strokeWidth?: number }) => {
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress     = circumference * (1 - percent / 100);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke={COLORS.circleTrack} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference}`} strokeDashoffset={`${progress}`}
        strokeLinecap="round" rotation="-90" origin={`${size/2}, ${size/2}`} />
      <SvgText x={size/2} y={size/2+5} textAnchor="middle" fontSize={13} fontWeight="700" fill={COLORS.text}>
        {percent}%
      </SvgText>
    </Svg>
  );
};

// ─── StatsCard ────────────────────────────────────────────────────────────────
const StatsCard = () => {
  const stats = useAllStats();

  const STATS: Stat[] = [
    { label: "Énergie",      percent: stats.energie      ?? 0, color: COLORS.statEnergie,      emoji: "⚡" },
    { label: "Stress",       percent: stats.stress       ?? 0, color: COLORS.statStress,       emoji: "😰" },
    { label: "Connaissance", percent: stats.connaissance ?? 0, color: COLORS.statConnaissance, emoji: "📚" },
    { label: "Organisation", percent: stats.organisation ?? 0, color: COLORS.statOrganisation, emoji: "🗂️" },
  ];

  return (
    <View style={[statsStyles.card, SHADOWS.light]}>
      <View style={statsStyles.row}>
        {STATS.map((s) => (
          <View key={s.label} style={statsStyles.item}>
            <CircularProgress percent={Math.round(s.percent)} color={s.color} />
            <View style={statsStyles.labelRow}>
              <Text style={{ fontSize: 11 }}>{s.emoji}</Text>
              <Text style={statsStyles.label}>{s.label}</Text>
            </View>
            <Text style={statsStyles.sub}>Niveau actuel</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const statsStyles = StyleSheet.create({
  card:     { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: 15, marginBottom: 20 },
  row:      { flexDirection: "row", justifyContent: "space-between" },
  item:     { alignItems: "center", gap: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  label:    { fontSize: 11, fontWeight: "700", color: COLORS.text },
  sub:      { fontSize: 9, color: COLORS.statSubColor },
});

// ─── MissionCard ──────────────────────────────────────────────────────────────
const MissionCard = ({ mission }: { mission: TodayMission }) => {
  const isContinue = mission.status === "continue";
  const isDone     = mission.status === "done";
  const isFail     = mission.status === "fail";

  return (
    <View style={[
      missionStyles.card,
      isDone && missionStyles.doneCard,
      isFail && missionStyles.failCard,
    ]}>
      <View style={missionStyles.iconBox}>
        <Text style={{ fontSize: 20 }}>{mission.emoji}</Text>
      </View>

      <View style={missionStyles.textBox}>
        <Text style={missionStyles.title}>{mission.title}</Text>
        <Text style={missionStyles.sub}>{mission.subtitle}</Text>
        <Text style={missionStyles.xpText}>+{mission.xp_gain} XP</Text>
      </View>

      {isDone ? (
        <View style={missionStyles.doneChip}>
          <Text style={missionStyles.doneText}>✓ Fait</Text>
        </View>
      ) : isFail ? (
        <View style={missionStyles.failChip}>
          <Text style={missionStyles.failText}>✗ Raté</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            missionStyles.btn,
            isContinue ? missionStyles.btnContinue : missionStyles.btnStart,
          ]}
        >
          <Text style={missionStyles.btnText}>
            {isContinue ? "Continuer ▶" : "Démarrer ▶"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const missionStyles = StyleSheet.create({
  card:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.missionCardBg, borderRadius: SIZES.radius, padding: 12, marginBottom: 10, gap: 10 },
  doneCard:     { opacity: 0.7 },
  failCard:     { opacity: 0.5 },
  iconBox:      { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.missionIconBg, alignItems: "center", justifyContent: "center" },
  textBox:      { flex: 1 },
  title:        { fontSize: 13, fontWeight: "700", color: COLORS.text },
  sub:          { fontSize: 11, color: COLORS.missionSubColor, marginTop: 1 },
  xpText:       { fontSize: 10, color: COLORS.levelTitleColor, fontWeight: "600", marginTop: 2 },
  btn:          { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  btnContinue:  { backgroundColor: COLORS.primary },
  btnStart:     { backgroundColor: COLORS.missionBtnStart },
  btnText:      { fontSize: 11, fontWeight: "700", color: COLORS.modalTitle },
  doneChip:     { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  doneText:     { fontSize: 11, fontWeight: "700", color: "#4CAF50" },
  failChip:     { backgroundColor: "#FFEBEE", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  failText:     { fontSize: 11, fontWeight: "700", color: "#E84040" },
});

const MISSIONS: Mission[] = [
  { id: "m1", title: "Mission 1:", subtitle: "Faire des exercices",             status: "continue",  emoji: "📅" },
  { id: "m2", title: "Mission 2:", subtitle: "Compléter la séance de révision", status: "start",     emoji: "📦" },
  { id: "m3", title: "Mission 3",  subtitle: "Diminuer votre stress",           status: "suggested", emoji: "📦" },
  { id: "m4", title: "Mission 4",  subtitle: "Compléter la séance de révision", status: "suggested", emoji: "📦" },
];

export const MissionsSection = () => {
  const router = useRouter();
  const { missions, loading, error } = useTodayMissions();

  return (
    <View style={[missionsStyles.card, SHADOWS.light]}>
      <Text style={missionsStyles.title}>Missions du jour</Text>

      {loading ? (
        <Text style={missionsStyles.infoText}>Chargement…</Text>
      ) : error ? (
        <Text style={missionsStyles.infoText}>❌ {error}</Text>
      ) : missions.length === 0 ? (
        <Text style={missionsStyles.infoText}>Aucune mission pour aujourd'hui 🎉</Text>
      ) : (
        missions.map((m) => <MissionCard key={m.id_validation} mission={m} />)
      )}

      <TouchableOpacity
        style={missionsStyles.addBtn}
         onPress={() => router.push("/frontend/screens/Missions?openCreate=true")} // ← ici
      >
        <Text style={missionsStyles.addText}>＋ Ajouter une mission</Text>
      </TouchableOpacity>
    </View>
  );
};

const missionsStyles = StyleSheet.create({
  card:     { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: SIZES.padding, marginBottom: 14, ...SHADOWS.light },
  title:    { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 14 },
  infoText: { color: COLORS.missionSubColor, fontSize: 13, textAlign: "center", marginBottom: 10 },
  addBtn:   { borderWidth: 1.5, borderColor: COLORS.secondary, borderStyle: "dashed", borderRadius: 30, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  addText:  { color: COLORS.secondary, fontWeight: "700", fontSize: 14 },
});


// ─── BossEventBanner ──────────────────────────────────────────────────────────
// ─── BossEventBanner ──────────────────────────────────────────────────────────
const BossEventBanner = () => {
  const { userId } = useUser();
  const router = useRouter();
  const [bossData, setBossData] = useState({
    activeCount: 0,
    progression: 0,
    totalXp: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const { data: bossEvents, error } = await supabase
          .from("boss_events")
          .select(`
            id_boss,
            nom,
            mission (
              id_mission,
              id_user,
              xp_gain,
              mission_validation ( statut )
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        let totalMissions = 0;
        let doneMissions  = 0;
        let activeCount   = 0;
        let totalXp       = 0;

        (bossEvents ?? []).forEach((boss: any) => {
          const userMissions = (boss.mission ?? []).filter(
            (m: any) => String(m.id_user) === String(userId)
          );
          if (userMissions.length === 0) return;

          activeCount++;

          userMissions.forEach((m: any) => {
            totalMissions++;
            const isDone = (m.mission_validation ?? []).some(
              (v: any) => v.statut === "done"
            );
            if (isDone) {
              doneMissions++;
              totalXp += m.xp_gain ?? 0;
            }
          });
        });

        const progression = totalMissions > 0
          ? Math.round((doneMissions / totalMissions) * 100)
          : 0;

        setBossData({ activeCount, progression, totalXp, loading: false });

      } catch (err: any) {
        console.error("[BossEventBanner]", err.message);
        setBossData(prev => ({ ...prev, loading: false }));
      }
    };

    load();
  }, [userId]);

  if (bossData.loading) return null;

  // Rien à afficher si l'user n'a aucun boss event
  if (bossData.activeCount === 0) return null;

  return (
    <View style={bossStyles.outer}>
      <View style={bossStyles.topBanner}>
        <Text style={{ fontSize: 30 }}>🏆</Text>
        <View style={{ flex: 1 }}>
          <Text style={bossStyles.bossTitle}>Boss Event</Text>
          <Text style={bossStyles.bossSub}>
            {bossData.activeCount} actif{bossData.activeCount > 1 ? "s" : ""} 🔥
          </Text>
        </View>
        <View style={bossStyles.xpChip}>
          <Text style={bossStyles.xpText}>+{bossData.totalXp} XP</Text>
        </View>
        <TouchableOpacity
          style={bossStyles.voirBtn}
          onPress={() => router.push("/frontend/screens/EventsScreen")}
        >
          <Text style={bossStyles.voirText}>Voir ▶</Text>
        </TouchableOpacity>
      </View>

      <View style={bossStyles.progressRow}>
        <Text style={bossStyles.progLabel}>Progression globale</Text>
        <View style={bossStyles.progTrack}>
          <View style={[bossStyles.progFill, { width: `${bossData.progression}%` }]} />
        </View>
        <Text style={bossStyles.progPct}>{bossData.progression}%</Text>
      </View>

      <View style={bossStyles.bottomCard}>
        <View style={bossStyles.circleGauge}>
          <Text style={bossStyles.circleText}>{bossData.progression}%</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={bossStyles.bottomRow}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <Text style={bossStyles.bottomTitle}>Boss Event</Text>
            <Text style={bossStyles.stars}>⭐⭐⭐ XP</Text>
          </View>
          <View style={bossStyles.bottomRow2}>
            <Text style={bossStyles.bottomSub}>
              {bossData.activeCount} actif{bossData.activeCount > 1 ? "s" : ""}
            </Text>
            <View style={bossStyles.xpChipSmall}>
              <Text style={bossStyles.xpTextSmall}>+{bossData.totalXp} XP</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const bossStyles = StyleSheet.create({
  outer:       { marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusLarge, overflow: "hidden", marginBottom: 14, backgroundColor: COLORS.bossOuter },
  topBanner:   { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, backgroundColor: COLORS.bossTopBanner },
  bossTitle:   { color: COLORS.modalTitle, fontWeight: "800", fontSize: 16 },
  bossSub:     { color: COLORS.bossSubText, fontSize: 12 },
  xpChip:      { backgroundColor: COLORS.bossXpChipBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  xpText:      { color: COLORS.bossXpText, fontWeight: "800", fontSize: 12 },
  voirBtn:     { backgroundColor: COLORS.bossVoirBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  voirText:    { color: COLORS.modalTitle, fontWeight: "700", fontSize: 12 },
  progressRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 8, backgroundColor: COLORS.bossProgressBg },
  progLabel:   { color: COLORS.modalTitle, fontWeight: "600", fontSize: 12, flex: 1 },
  progTrack:   { flex: 2, height: 8, backgroundColor: COLORS.bossProgressTrack, borderRadius: 10, overflow: "hidden" },
  progFill:    { width: "45%", height: "100%", backgroundColor: COLORS.bossProgressFill, borderRadius: 10 },
  progPct:     { color: COLORS.modalTitle, fontWeight: "800", fontSize: 13 },
  bottomCard:  { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bossBottomCard, padding: 14, gap: 10 },
  circleGauge: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: COLORS.bossCircleBorder, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bossCircleBg },
  circleText:  { color: COLORS.bossXpText, fontWeight: "800", fontSize: 14 },
  bottomRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomTitle: { color: COLORS.modalTitle, fontWeight: "800", fontSize: 15 },
  stars:       { color: COLORS.bossXpText, fontSize: 12 },
  bottomRow2:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  bottomSub:   { color: COLORS.bossSubText, fontSize: 12 },
  xpChipSmall: { backgroundColor: COLORS.bossXpChipSmallBg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  xpTextSmall: { color: COLORS.modalTitle, fontWeight: "800", fontSize: 11 },
});

// ─── GlobalProgressSection ────────────────────────────────────────────────────
const GlobalProgressSection = () => {
const { derived } = useDerivedStats();


  const PROGRESS_STATS: ProgressStat[] = [
    { label: "Concentration", emoji: "🔥", percent: derived.concentration, xpReward: 15, xpBonus: 10 },
    { label: "Sérénité",      emoji: "🌿", percent: derived.serenite,      xpReward: 15, xpBonus: 10 },
    { label: "Discipline",    emoji: "💪", percent: derived.discipline,    xpReward: 10, xpBonus: 10 },
  ];

  return (
    <View style={[gpStyles.card, SHADOWS.light]}>
      <Text style={gpStyles.title}>Progression globale</Text>
      <View style={gpStyles.masterTrack}>
        <View style={gpStyles.masterFill} />
      </View>
      {PROGRESS_STATS.map((s) => (
        <View key={s.label} style={gpStyles.row}>
          <Text style={gpStyles.rowLabel}>{s.label} {s.emoji}</Text>
          <View style={gpStyles.rowTrack}>
            <View style={[gpStyles.rowFill, { width: `${Math.round(s.percent)}%` }]} />
          </View>
          <Text style={gpStyles.rowPct}>{Math.round(s.percent)}%</Text>
          <View style={gpStyles.chip}>
            <Text style={gpStyles.chipText}>⭐{s.xpReward} XP</Text>
          </View>
          <View style={[gpStyles.chip, gpStyles.chipBonus]}>
            <Text style={gpStyles.chipBonusText}>+{s.xpBonus} XP</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const gpStyles = StyleSheet.create({
  card:          { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLarge, marginHorizontal: SIZES.padding, padding: SIZES.padding, marginBottom: 16 },
  title:         { fontSize: 17, fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  masterTrack:   { height: 10, backgroundColor: COLORS.masterTrackBg, borderRadius: 10, overflow: "visible", marginBottom: 16 },
  masterFill:    { width: "55%", height: "100%", backgroundColor: COLORS.masterFill, borderRadius: 10 },
  row:           { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 },
  rowLabel:      { fontSize: 12, fontWeight: "600", color: COLORS.text, width: 110 },
  rowTrack:      { flex: 1, height: 7, backgroundColor: COLORS.progressTrackBg, borderRadius: 10, overflow: "hidden" },
  rowFill:       { height: "100%", backgroundColor: COLORS.secondary, borderRadius: 10 },
  rowPct:        { fontSize: 11, fontWeight: "700", color: COLORS.text, width: 32, textAlign: "right" },
  chip:          { backgroundColor: COLORS.progressTrackBg, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  chipText:      { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  chipBonus:     { backgroundColor: COLORS.chipBonusBg },
  chipBonusText: { fontSize: 10, color: COLORS.chipBonusText, fontWeight: "700" },
});

// ─── SCREEN ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  usePeriodicQuestionnaire();
  const router = useRouter();

  // ── Handler mission suggérée démarrée ─────────────────────
  // La navigation est gérée directement par SuggestedMissionsSection
  // Ce callback peut être utilisé pour d'autres effets (analytics, etc.)
  const handleSuggestedMissionStart = (mission: MissionSuggestion) => {
    // Navigation déjà gérée dans le composant SuggestedMissionsSection
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground height={290} />

      <View style={styles.stars} pointerEvents="none">
        {stars.map((s, i) => (
          <MaterialIcons
            key={i} name="auto-awesome" size={s.size} color={COLORS.modalTitle}
            style={{
              position: "absolute",
              ...(s.top    !== undefined ? { top: s.top }       : {}),
              ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
              ...(s.left   !== undefined ? { left: s.left }     : {}),
              ...(s.right  !== undefined ? { right: s.right }   : {}),
              opacity: s.opacity,
            }}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <DashboardHeader />
        <View style={{ marginTop: 23 }}>
          <StatsCard />
           
          <MissionsSection />
          <SuggestedMissionsSection
            maxSuggestions={4}
            onMissionStart={handleSuggestedMissionStart}
          />
          <BossEventBanner />

          {/* ── Suggestions intelligentes basées sur les stats ── */}
         

          <GlobalProgressSection />
        </View>
      </ScrollView>

      <Navbar active="home" onChange={(key) => console.log(key)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.screenBg },
  stars:         { position: "absolute", top: 0, left: 0, right: 0, height: 290, overflow: "hidden" },
  scrollContent: { paddingBottom: 100 },
});