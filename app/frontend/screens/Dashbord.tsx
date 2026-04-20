import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Text as SvgText
} from "react-native-svg";
import AvatarCrd from "../components/AvatarCrd";
import Navbar from "../components/Navbar";
import NotifIcone from "../components/NotifIcone";
import PuzzleIcone from "../components/PuzzleIcone";
import SettingIcone from "../components/SettingIcone";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";


// ─── DATA ─────────────────────────────────────────
const USER = {
  userName: "Sonia",
  level: 6,
  xp: 1745,
  maxXp: 1800,
  coins: 1250,
};

// ─── Types ────────────────────────────────────────────────────────────────────


interface Stat {
  label: string;
  percent: number;
  color: string;
  emoji: string;
}
  const stars = [
  { top: 10, left: 10, size: 20, opacity: 0.6 },
  { top: 10, right: 10, size: 12, opacity: 0.4 },
  { bottom: 10, left: 10, size: 15, opacity: 0.5 },
  { bottom: 10, right: 10, size: 10, opacity: 0.35 },
  { top: 30, left: 50, size: 8, opacity: 0.25 },
  { bottom: 40, right: 60, size: 22, opacity: 0.7 },
  { top: 40, right: 50, size: 22, opacity: 0.7 },
  { top: 60, left: 150, size: 14, opacity: 0.45 },
  { bottom: 80, left: 16, size: 18, opacity: 0.55 },
];


interface Mission {
  id: string;
  title: string;
  subtitle: string;
  status: "continue" | "start" | "suggested";
  emoji: string;
}


interface ProgressStat {
  label: string;
  emoji: string;
  percent: number;
  xpReward: number;
  xpBonus: number;
}


// ─── Greeting dynamique ───────────────────────────
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { icon: "☀️", text: "Bonjour" };
  if (hour >= 12 && hour < 18) return { icon: "🌤️", text: "Bon après-midi" };
  if (hour >= 18 && hour < 21) return { icon: "🌅", text: "Bonsoir" };
  return { icon: "🌙", text: "Bonne nuit" };
}


// ─── HEADER MODERNE ───────────────────────────────
// ─── HEADER STYLE MODERNE ───────────────────────────────
const DashboardHeader = () => {
  const { selectedModel } = useAvatar();
  const { icon: timeIcon, text: timeText } = getTimeGreeting();
  const xpPercent = (USER.xp / USER.maxXp) * 100;
    const router = useRouter();


  return (
    <View style={headerStyles.container}>
      {/* Top row: coins + icons */}
      <View style={headerStyles.topRow}>
        <View style={headerStyles.coinsBadge}>
          <Text style={headerStyles.coinIcon}>🪙</Text>
          <Text style={headerStyles.coinsText}>{USER.coins.toLocaleString()}</Text>
        </View>
        <View style={headerStyles.headerIcons}>
          <PuzzleIcone onPress={() => router.push("/frontend/screens/WorldsScreen")} />
          <NotifIcone />
          <SettingIcone />
        </View>
      </View>


      {/* Avatar + Info */}
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
              {timeText}, <Text style={headerStyles.greetingName}>{USER.userName}!</Text>
            </Text>
            <Text style={headerStyles.timeIcon}>{timeIcon}</Text>
          </View>


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


// ─── HEADER STYLES ───────────────────────────────────────
const headerStyles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  coinsText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },



  profileRow: {
    flexDirection: "row",
    gap: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#ede9fe",
    ...SHADOWS.medium,
  },
  avatarPlaceholder: {
    flex: 1,
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
  },
  levelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },


  infoBlock: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
  },
  greetingName: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  timeIcon: { fontSize: 20 },


  xpBarBg: {
    height: 8,
    backgroundColor: "#ddd6fe",
    borderRadius: 10,
    marginTop: 10,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  xpText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
});
// ─── StatsCard ────────────────────────────────────────────────────────────────


const STATS: Stat[] = [
  { label: "Énergie", percent: 65, color: "#F5A623", emoji: "⚡" },
  { label: "Stress", percent: 45, color: "#E84040", emoji: "😰" },
  { label: "Connaissance", percent: 65, color: "#4A90E2", emoji: "📚" },
  { label: "Organisation", percent: 65, color: "#4CAF50", emoji: "🗂️" },
];


const StatsCard = () => (
  <View style={[statsStyles.card, SHADOWS.light]}>
    <View style={statsStyles.row}>
      {STATS.map((s) => (
        <View key={s.label} style={statsStyles.item}>
          <CircularProgress percent={s.percent} color={s.color} />
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


const statsStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    marginHorizontal: SIZES.padding,
    padding: 15,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: { alignItems: "center", gap: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  label: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 9, color: "#AAA" },
});
// ─── MissionCard ──────────────────────────────────────────────────────────────


interface MissionCardProps {
  mission: Mission;
}


const MissionCard = ({ mission }: MissionCardProps) => {
  const isContinue = mission.status === "continue";
  const isStart = mission.status === "start";
  const isSuggested = mission.status === "suggested";


  return (
    <View
      style={[
        missionStyles.card,
        isSuggested && missionStyles.suggestedCard,
      ]}
    >
      <View style={missionStyles.iconBox}>
        <Text style={{ fontSize: 20 }}>{mission.emoji}</Text>
      </View>
      <View style={missionStyles.textBox}>
        <Text style={missionStyles.title}>{mission.title}</Text>
        {mission.status === "suggested" && (
          <Text style={missionStyles.suggestedTag}>Suggeree</Text>
        )}
        <Text style={missionStyles.sub}>{mission.subtitle}</Text>
      </View>
      <TouchableOpacity
        style={[
          missionStyles.btn,
          isContinue && missionStyles.btnContinue,
          (isStart || isSuggested) && missionStyles.btnStart,
        ]}
      >
        <Text style={missionStyles.btnText}>
          {isContinue ? "Continuer" : "Demarrer"} ▶
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const missionStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4FF",
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  suggestedCard: {
    backgroundColor: "#F0EBF9",
    borderWidth: 1,
    borderColor: "#DDD5F5",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE8F8",
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  suggestedTag: {
    fontSize: 10,
    color: COLORS.secondary,
    fontStyle: "italic",
    fontWeight: "600",
  },
  sub: { fontSize: 11, color: "#888", marginTop: 1 },
  btn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnContinue: { backgroundColor: COLORS.primary },
  btnStart: { backgroundColor: "#DDD5F5" },
  btnText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
});
// ─── MissionsSection ──────────────────────────────────────────────────────────


const MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "Mission 1:",
    subtitle: "Faire des exercices",
    status: "continue",
    emoji: "📅",
  },
  {
    id: "m2",
    title: "Mission 2:",
    subtitle: "Completer la seance de revision",
    status: "start",
    emoji: "📦",
  },
  {
    id: "m3",
    title: "Mission 3",
    subtitle: "Diminuer votre stress",
    status: "suggested",
    emoji: "📦",
  },
  {
    id: "m4",
    title: "Mission 3",
    subtitle: "Completer la seance de revision",
    status: "suggested",
    emoji: "📦",
  },
];


const MissionsSection = () => (
  <View style={[missionsStyles.card, SHADOWS.light]}>
    <Text style={missionsStyles.title}>Missions du jour</Text>
    {MISSIONS.map((m) => (
      <MissionCard key={m.id} mission={m} />
    ))}
    <TouchableOpacity style={missionsStyles.addBtn}>
      <Text style={missionsStyles.addText}>＋ Ajouter une mission</Text>
    </TouchableOpacity>
  </View>
);


const missionsStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    marginHorizontal: SIZES.padding,
    padding: SIZES.padding,
    marginBottom: 14,
    ...SHADOWS.light,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 14,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    borderStyle: "dashed",
    borderRadius: 30,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
  },
  addText: {
    color: COLORS.secondary,
    fontWeight: "700",
    fontSize: 14,
  },
});
// ─── BossEventBanner ──────────────────────────────────────────────────────────


const BossEventBanner = () => (
  <View style={bossStyles.outer}>
    {/* Top banner */}
    <View style={bossStyles.topBanner}>
      <Text style={{ fontSize: 30 }}>🏆</Text>
      <View style={{ flex: 1 }}>
        <Text style={bossStyles.bossTitle}>Boss Event</Text>
        <Text style={bossStyles.bossSub}>2 actifs 🔥🔥🔥</Text>
      </View>
      <View style={bossStyles.xpChip}>
        <Text style={bossStyles.xpText}>+75 XP</Text>
      </View>
      <TouchableOpacity style={bossStyles.voirBtn}>
        <Text style={bossStyles.voirText}>Voir ▶</Text>
      </TouchableOpacity>
    </View>


    {/* Progression row */}
    <View style={bossStyles.progressRow}>
      <Text style={bossStyles.progLabel}>Progression globale</Text>
      <View style={bossStyles.progTrack}>
        <View style={bossStyles.progFill} />
      </View>
      <Text style={bossStyles.progPct}>45%</Text>
    </View>


    {/* Bottom card */}
    <View style={bossStyles.bottomCard}>
      <View style={bossStyles.circleGauge}>
        <Text style={bossStyles.circleText}>45%</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={bossStyles.bottomRow}>
          <Text style={{ fontSize: 22 }}>🏆</Text>
          <Text style={bossStyles.bottomTitle}>Boss Event</Text>
          <Text style={bossStyles.stars}>⭐⭐⭐ XP</Text>
        </View>
        <View style={bossStyles.bottomRow2}>
          <Text style={bossStyles.bottomSub}>2 actifs</Text>
          <View style={bossStyles.xpChipSmall}>
            <Text style={bossStyles.xpTextSmall}>+75 XP</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);


const bossStyles = StyleSheet.create({
  outer: {
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#8A5AD8",
  },
  topBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    backgroundColor: "#7B4FC8",
  },
  bossTitle: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  bossSub: { color: "#EDD9FF", fontSize: 12 },
  xpChip: {
    backgroundColor: "#5A2EA0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpText: { color: "#FFD700", fontWeight: "800", fontSize: 12 },
  voirBtn: {
    backgroundColor: "#FF6B9D",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  voirText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#9B6DE0",
  },
  progLabel: { color: "#FFF", fontWeight: "600", fontSize: 12, flex: 1 },
  progTrack: {
    flex: 2,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progFill: { width: "45%", height: "100%", backgroundColor: "#FFD700", borderRadius: 10 },
  progPct: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  bottomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A3DB8",
    padding: 14,
    gap: 10,
  },
  circleGauge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5A2EA0",
  },
  circleText: { color: "#FFD700", fontWeight: "800", fontSize: 14 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomTitle: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  stars: { color: "#FFD700", fontSize: 12 },
  bottomRow2: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  bottomSub: { color: "#EDD9FF", fontSize: 12 },
  xpChipSmall: {
    backgroundColor: "#FF6B9D",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  xpTextSmall: { color: "#FFF", fontWeight: "800", fontSize: 11 },
});
// ─── GlobalProgressSection ────────────────────────────────────────────────────


const PROGRESS_STATS: ProgressStat[] = [
  { label: "Concentration", emoji: "🔥", percent: 60, xpReward: 15, xpBonus: 10 },
  { label: "Sérénité", emoji: "🌿", percent: 40, xpReward: 15, xpBonus: 10 },
  { label: "Discipline", emoji: "💪", percent: 30, xpReward: 10, xpBonus: 10 },
];


const GlobalProgressSection = () => (
  <View style={[gpStyles.card, SHADOWS.light]}>
    <Text style={gpStyles.title}>Progression globale</Text>
    {/* Master bar */}
    <View style={gpStyles.masterTrack}>
      <View style={gpStyles.masterFill} />
      <Text style={{ position: "absolute", right: 0, fontSize: 12 }}>🎯</Text>
    </View>


    {/* Stat rows */}
    {PROGRESS_STATS.map((s) => (
      <View key={s.label} style={gpStyles.row}>
        <Text style={gpStyles.rowLabel}>
          {s.label} {s.emoji}
        </Text>
        <View style={gpStyles.rowTrack}>
          <View style={[gpStyles.rowFill, { width: `${s.percent}%` as any }]} />
        </View>
        <Text style={gpStyles.rowPct}>{s.percent}%</Text>
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


const gpStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    marginHorizontal: SIZES.padding,
    padding: SIZES.padding,
    marginBottom: 100,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  masterTrack: {
    height: 10,
    backgroundColor: "#DDD5F5",
    borderRadius: 10,
    overflow: "visible",
    marginBottom: 16,
    position: "relative",
  },
  masterFill: {
    width: "55%",
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  rowLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text, width: 110 },
  rowTrack: {
    flex: 1,
    height: 7,
    backgroundColor: "#EEE8F8",
    borderRadius: 10,
    overflow: "hidden",
  },
  rowFill: { height: "100%", backgroundColor: COLORS.secondary, borderRadius: 10 },
  rowPct: { fontSize: 11, fontWeight: "700", color: COLORS.text, width: 32, textAlign: "right" },
  chip: {
    backgroundColor: "#EEE8F8",
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  chipBonus: { backgroundColor: "#E8F5E9" },
  chipBonusText: { fontSize: 10, color: "#4CAF50", fontWeight: "700" },
});
// ─── CircularProgress ─────────────────────────────────────────────────────────


interface CircularProgressProps {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}


const CircularProgress = ({
  percent,
  color,
  size = 70,
  strokeWidth = 7,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - percent / 100);


  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#EEE8F8"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${progress}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
      <SvgText
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight="700"
        fill={COLORS.text}
      >
        {percent}%
      </SvgText>
    </Svg>
  );
};


// ─── SCREEN ───────────────────────────────────────
export default function DashboardScreen() {
  
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />


      {/* Background wave */}
      <WaveBackground height={290} />
       <View style={styles.stars} pointerEvents="none">
    {stars.map((s, i) => (
      <MaterialIcons
        key={i}
        name="auto-awesome"
        size={s.size}
        color="#fff"
        style={{
          position: "absolute",
          ...(s.top !== undefined ? { top: s.top } : {}),
          ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
          ...(s.left !== undefined ? { left: s.left } : {}),
          ...(s.right !== undefined ? { right: s.right } : {}),
          opacity: s.opacity,
        }}
      />
    ))}
  </View>
      


  <ScrollView showsVerticalScrollIndicator={false}>
  <DashboardHeader />
  <View style={{ marginTop: 23 }}>
    <StatsCard />
    <MissionsSection />
    <BossEventBanner />
    <GlobalProgressSection />
  </View>
</ScrollView>

      <Navbar active="home" onChange={(key) => console.log(key)} />
    </View>
  );
}


// ─── STYLES ───────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  stars: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 290, // IMPORTANT: même hauteur que WaveBackground
  overflow: "hidden",
},
});





