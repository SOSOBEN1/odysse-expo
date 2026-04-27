import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated, Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import NotifIcone from "../components/NotifIcone";
import SettingIcone from "../components/SettingIcone";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  id: number;
  name: string;
  minutes: number;
  taches: number;
  isMe?: boolean;
}

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  startX: number;
}

const CONFETTI_COLORS = [
  COLORS.gold, COLORS.secondary, "#FF8FAB", "#80DEEA",
  COLORS.primary, COLORS.goldDark, "#CE93D8",
];

function useConfetti(active: boolean) {
  const pieces = useRef<ConfettiPiece[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    pieces.current = Array.from({ length: 28 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 5,
      startX: Math.random() * width,
    }));
    setTick(t => t + 1);

    const animations = pieces.current.map(p => {
      const duration = 1800 + Math.random() * 1200;
      return Animated.parallel([
        Animated.timing(p.y, { toValue: height * 0.6 + Math.random() * 200, duration, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: (Math.random() - 0.5) * 120, duration, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: Math.random() > 0.5 ? 4 : -4, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.stagger(40, animations).start();
  }, [active]);

  return pieces.current;
}

function AvatarPlaceholder({ rank, size = 44 }: { rank: number; size?: number }) {
  const colors: Record<number, [string, string]> = {
    1: [COLORS.goldGradientStart, COLORS.goldGradientEnd],
    2: [COLORS.silverGradientStart, COLORS.silverGradientEnd],
    3: [COLORS.bronzeGradientStart, COLORS.bronzeGradientEnd],
  };
  const [c1, c2] = colors[rank] ?? [COLORS.defaultGradientStart, COLORS.defaultGradientEnd];
  const icons = ["👩", "👦", "🧔", "👱‍♂️", "👧"];
  return (
    <LinearGradient colors={[c1, c2]} style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.45 }}>{icons[(rank - 1) % icons.length]}</Text>
    </LinearGradient>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const badgeColors: Record<number, [string, string]> = {
    1: [COLORS.goldGradientStart, COLORS.goldGradientEnd],
    2: [COLORS.silverGradientStart, COLORS.silverGradientEnd],
    3: [COLORS.bronzeGradientStart, COLORS.bronzeGradientEnd],
  };
  const [c1, c2] = badgeColors[rank] ?? [COLORS.defaultGradientStart, COLORS.defaultGradientEnd];
  return (
    <LinearGradient colors={[c1, c2]} style={styles.rankBadge}>
      <Text style={styles.rankText}>{rank}</Text>
    </LinearGradient>
  );
}

function ParticipantRow({ participant, isFirst, animDelay }: {
  participant: Participant; isFirst?: boolean; animDelay: number;
}) {
  const slideIn = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideIn, { toValue: 0, duration: 400, delay: animDelay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  const isTop3 = participant.id <= 3;

  return (
    <Animated.View style={[styles.rowWrapper, isFirst && styles.firstRowWrapper, { opacity, transform: [{ translateY: slideIn }] }]}>
      <LinearGradient
        colors={isFirst ? ([COLORS.goldGradientEnd, "#FFF8DC"] as [string, string]) : (["#FFFFFF", "#F8F4FF"] as [string, string])}
        style={[styles.row, isFirst && styles.firstRow, participant.isMe && styles.myRow]}
      >
        <RankBadge rank={participant.id} />
        <AvatarPlaceholder rank={participant.id} size={isFirst ? 52 : 44} />
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, isFirst && styles.firstRowName]}>
            {participant.name}{participant.isMe ? " (moi)" : ""}
          </Text>
          <Text style={styles.rowSub}>{participant.taches} tâches terminées</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowTime, isFirst && styles.firstRowTime]}>{participant.minutes} min</Text>
        </View>
        {isTop3 && <View style={styles.coinBadge}><Text style={{ fontSize: 18 }}>🪙</Text></View>}
      </LinearGradient>
    </Animated.View>
  );
}

function TrophyRow() {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.trophyRow}>
      <Text style={[styles.trophy, styles.trophySilver]}>🥈</Text>
      <Text style={[styles.trophy, styles.trophyGold]}>🥇</Text>
      <Text style={[styles.trophy, styles.trophyBronze]}>🥉</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ClassementScreen() {
  const { userId } = useUser();
  const params = useLocalSearchParams();
  const router = useRouter();
  const id_defi = params.defiId ? Number(params.defiId) : 0;
  const defi_nom = params.defiNom ? String(params.defiNom) : "Défi terminé";

  const [navActive, setNavActive] = useState("defis");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiPieces = useConfetti(true);

  useEffect(() => { chargerClassement(); }, []);

  const chargerClassement = async () => {
    setLoading(true);

    const { data: parts } = await supabase
      .from("defi_participants")
      .select("id_user, xp_total, score, minutes_etudies")
      .eq("id_defi", id_defi)
      .order("score", { ascending: false });

    if (!parts || parts.length === 0) { setLoading(false); return; }

    const userIds = parts.map((p: any) => p.id_user);
    const { data: users } = await supabase
      .from("users").select("id_user, nom, prenom").in("id_user", userIds);

    const { data: missions } = await supabase
      .from("mission").select("id_mission").eq("id_defi", id_defi);
    const missionIds = (missions ?? []).map((m: any) => m.id_mission);

    const mapped: Participant[] = await Promise.all(
      parts.map(async (p: any, i: number) => {
        const user = (users ?? []).find((u: any) => u.id_user === p.id_user);
        let taches = 0;
        if (missionIds.length > 0) {
          const { data: validations } = await supabase
            .from("mission_validation").select("id_mission")
            .eq("id_user", p.id_user).eq("statut", "done").in("id_mission", missionIds);
          taches = (validations ?? []).length;
        }
        return {
          id: i + 1,
          name: user ? `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() : "Inconnu",
          minutes: p.minutes_etudies ?? 0,
          taches,
          isMe: p.id_user === userId,
        };
      })
    );

    setParticipants(mapped);
    setLoading(false);
  };

  const monRang = participants.findIndex(p => p.isMe) + 1;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#E8DFFA", "#D4C5F5", "#EDE8FB"]} style={StyleSheet.absoluteFill} />

      {confettiPieces.map((p, i) => {
        const rotate = p.rotate.interpolate({ inputRange: [-4, 4], outputRange: ["-720deg", "720deg"] });
        return (
          <Animated.View key={i} pointerEvents="none" style={[styles.confettiPiece, {
            left: p.startX, top: -20, width: p.size, height: p.size,
            backgroundColor: p.color, borderRadius: i % 3 === 0 ? p.size / 2 : 2,
            opacity: p.opacity, transform: [{ translateX: p.x }, { translateY: p.y }, { rotate }],
          }]} />
        );
      })}

      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{defi_nom}</Text>
        <View style={styles.headerActions}>
          <NotifIcone onPress={() => {}} />
          <SettingIcone onPress={() => {}} />
        </View>
      </View>

      <TouchableOpacity style={styles.sessionPill}>
        <Text style={styles.sessionText}>Défi terminé 🎉</Text>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeText}>Classement final</Text>
        </View>
      </TouchableOpacity>

      <TrophyRow />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {participants.slice(0, 4).map((p, i) => (
            <ParticipantRow key={p.id} participant={p} isFirst={i === 0} animDelay={i * 80} />
          ))}

          {participants.length > 4 && (
            <>
              <Text style={styles.sectionLabel}>Autres participants</Text>
              {participants.slice(4).map((p, i) => (
                <ParticipantRow key={p.id} participant={p} animDelay={400 + i * 80} />
              ))}
            </>
          )}

          {monRang > 0 && (
            <View style={styles.myRankBanner}>
              <Text style={styles.myRankText}>
                Vous êtes <Text style={styles.myRankHighlight}>{monRang}</Text>
                <Text style={styles.myRankSup}>{monRang === 1 ? "er" : "ème"}</Text>
              </Text>
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <Navbar active={navActive} onChange={setNavActive} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: COLORS.background },
  header:           { flexDirection: "row", alignItems: "center", paddingHorizontal: SIZES.padding, paddingTop: 52, paddingBottom: 8 },
  headerTitle:      { flex: 1, fontSize: 22, fontWeight: "800", color: COLORS.text, marginLeft: 12 },
  headerActions:    { flexDirection: "row", gap: 8 },
  sessionPill:      { flexDirection: "row", alignItems: "center", alignSelf: "center", backgroundColor: "#fff", borderRadius: SIZES.radiusFull, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4, gap: 8, ...SHADOWS.light },
  sessionText:      { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sessionBadge:     { backgroundColor: COLORS.primaryPale, borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 2 },
  sessionBadgeText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  trophyRow:        { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", marginTop: 16, marginBottom: 4, gap: 8 },
  trophy:           { fontSize: 36 },
  trophyGold:       { fontSize: 52 },
  trophySilver:     { fontSize: 38, marginBottom: 4 },
  trophyBronze:     { fontSize: 32, marginBottom: 2 },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: SIZES.padding, paddingTop: 4 },
  rowWrapper:       { marginBottom: 10, borderRadius: SIZES.radius, overflow: "hidden", ...SHADOWS.light },
  firstRowWrapper:  { ...SHADOWS.purple },
  row:              { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, gap: 10, borderRadius: SIZES.radius },
  firstRow:         { paddingVertical: 16, borderWidth: 1.5, borderColor: COLORS.goldGradientStart + "55" },
  myRow:            { borderWidth: 1.5, borderColor: `${COLORS.primary}50` },
  rankBadge:        { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  rankText:         { fontSize: 15, fontWeight: "800", color: "#fff" },
  avatarCircle:     { justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  rowInfo:          { flex: 1 },
  rowName:          { fontSize: 15, fontWeight: "700", color: COLORS.text },
  firstRowName:     { fontSize: 17, color: COLORS.goldDark },
  rowSub:           { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  rowRight:         { alignItems: "flex-end" },
  rowTime:          { fontSize: 14, fontWeight: "700", color: COLORS.text },
  firstRowTime:     { fontSize: 16, color: COLORS.goldDark },
  coinBadge:        { marginLeft: 2 },
  sectionLabel:     { textAlign: "center", fontSize: 13, fontWeight: "600", color: COLORS.textLight, marginVertical: 12 },
  myRankBanner:     { alignItems: "center", marginTop: 16, backgroundColor: COLORS.primaryPale, borderRadius: SIZES.radiusFull, paddingVertical: 10, paddingHorizontal: 28, alignSelf: "center", ...SHADOWS.light },
  myRankText:       { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  myRankHighlight:  { fontSize: 20, fontWeight: "900", color: COLORS.primary },
  myRankSup:        { fontSize: 12, color: COLORS.primary },
  confettiPiece:    { position: "absolute", zIndex: 99 },
});