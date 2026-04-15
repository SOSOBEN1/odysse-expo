import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import BackButton from "../components/BackButton";
import SuccessModal from '../components/SuccessModal';
import ZoneUnlockedModal from '../components/ZoneUnlockedModal';

// ── Data zones ──────────────────────────────────────────────
const ZONES_DATA = {
  // FORÊT
  clairiere: {
    name: "Clairière",
    img:  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=900&q=85",
    accent: "#22c55e", dark: "#14532d", light: "#dcfce7",
    puzzlePieces: 3, puzzleUnlocked: 2,
    missions: [
      { id: 1, title: "Méditation 10 min sans distraction", reward: 20, xpLabel: "20 XP", done: true,  diff: "Facile",    icon: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&q=70" },
      { id: 2, title: "Lire 20 pages sans interruption",    reward: 25, xpLabel: "25 XP", done: false, diff: "Moyen",     icon: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=120&q=70" },
      { id: 3, title: "Réviser 1h en pleine nature",        reward: 30, xpLabel: "30 XP", done: false, diff: "Difficile", icon: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=120&q=70" },
    ],
  },
  sousbois: {
    name: "Sous-bois",
    img:  "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=900&q=85",
    accent: "#22c55e", dark: "#14532d", light: "#dcfce7",
    puzzlePieces: 3, puzzleUnlocked: 0,
    missions: [
      { id: 1, title: "Faire une carte mentale de son cours",  reward: 20, xpLabel: "20 XP", done: false, diff: "Facile",    icon: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=120&q=70" },
      { id: 2, title: "Technique Pomodoro : 4 sessions",       reward: 30, xpLabel: "30 XP", done: false, diff: "Moyen",     icon: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=70" },
      { id: 3, title: "Résumer un chapitre en 1 page",         reward: 25, xpLabel: "25 XP", done: false, diff: "Difficile", icon: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=120&q=70" },
    ],
  },
  cascade: {
    name: "Cascade",
    img:  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=900&q=85",
    accent: "#22c55e", dark: "#14532d", light: "#dcfce7",
    puzzlePieces: 4, puzzleUnlocked: 0,
    missions: [
      { id: 1, title: "Exercice de respiration anti-stress",   reward: 15, xpLabel: "15 XP", done: false, diff: "Facile",    icon: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&q=70" },
      { id: 2, title: "Journaliser ses progrès du jour",       reward: 20, xpLabel: "20 XP", done: false, diff: "Facile",    icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=120&q=70" },
      { id: 3, title: "Préparer son planning de la semaine",   reward: 30, xpLabel: "30 XP", done: false, diff: "Moyen",     icon: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=120&q=70" },
      { id: 4, title: "Défis : zéro téléphone pendant 2h",    reward: 40, xpLabel: "40 XP", done: false, diff: "Difficile", icon: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&q=70" },
    ],
  },
};

const DIFF_COLOR = { Facile: "#22c55e", Moyen: "#f59e0b", Difficile: "#ef4444" };

// ── Pièce puzzle avec vraie image ───────────────────────────
function PuzzlePiece({ filled, index, accent, img }) {
  const sc = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(sc, { toValue: 1, friction: 4, delay: index * 160, useNativeDriver: true }).start();
    if (filled) {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
  }, []);

  return (
    <Animated.View style={[styles.puzzlePiece, { transform: [{ scale: sc }], borderColor: filled ? accent : "#e0d9ff", shadowColor: filled ? accent : "transparent", shadowOpacity: glow, shadowRadius: 10, elevation: filled ? 4 : 0 }]}>
      {filled ? (
        <>
          <Image source={{ uri: img }} style={styles.puzzleImg} resizeMode="cover" />
          <View style={[styles.puzzleCheckOverlay, { backgroundColor: accent + "44" }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        </>
      ) : (
        <View style={styles.puzzleEmpty}>
          <Text style={{ fontSize: 18, opacity: 0.4 }}>🧩</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ── Ligne de mission ────────────────────────────────────────
function MissionRow({ mission, accent, onPress }) {
  const sl = useRef(new Animated.Value(40)).current;
  const fa = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sl, { toValue: 0, friction: 6, delay: mission.id * 120, useNativeDriver: true }),
      Animated.timing(fa, { toValue: 1, duration: 400, delay: mission.id * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fa, transform: [{ translateX: sl }] }}>
      <TouchableOpacity
        style={[styles.missionRow, mission.done && styles.missionDone]}
        onPress={() => !mission.done && onPress(mission)}
        activeOpacity={mission.done ? 1 : 0.85}
      >
        {/* Photo miniature */}
        <View style={styles.missionImgBox}>
          <Image source={{ uri: mission.icon }} style={styles.missionImg} resizeMode="cover" />
          {mission.done && (
            <View style={[styles.missionImgOverlay, { backgroundColor: accent + "bb" }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.missionInfo}>
          <Text style={[styles.missionTitle, mission.done && { color: "#9b87c9" }]} numberOfLines={2}>
            {mission.title}
          </Text>
          <View style={styles.missionMeta}>
            <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[mission.diff] + "22" }]}>
              <Text style={[styles.diffPillText, { color: DIFF_COLOR[mission.diff] }]}>{mission.diff}</Text>
            </View>
            <Text style={styles.rewardText}>⚡ {mission.xpLabel}</Text>
            <Text style={styles.rewardText}>🧩 +1 pièce</Text>
          </View>
        </View>

        {/* Action */}
        {mission.done ? (
          <View style={[styles.doneBtn, { backgroundColor: accent }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        ) : (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: accent }]} onPress={() => onPress(mission)} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Écran principal ─────────────────────────────────────────
export default function ZoneScreen() {
  const router = useRouter();
  const { zoneId = "clairiere", worldId = "foret" } = useLocalSearchParams();
  const zoneData = ZONES_DATA[zoneId] ?? ZONES_DATA.clairiere;

  const [missions, setMissions]             = useState(zoneData.missions);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [showUnlocked, setShowUnlocked]     = useState(false);
  const [currentMission, setCurrentMission] = useState(null);
  const [puzzleCount, setPuzzleCount]       = useState(zoneData.puzzleUnlocked);

  // FIX #4 — porte le flag allDone entre le handler et le callback onContinue
  const pendingUnlock = useRef(false);

  const bgFade    = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const progressW = useRef(new Animated.Value(zoneData.puzzleUnlocked / zoneData.puzzlePieces * 100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgFade,    { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, friction: 7, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleMissionPress = (mission) => {
    setCurrentMission(mission);

    const newMissions = missions.map(m => m.id === mission.id ? { ...m, done: true } : m);
    setMissions(newMissions);

    // FIX #4 — calcul sur newMissions, pas sur le state encore périmé
    pendingUnlock.current = newMissions.every(m => m.done);

    // FIX — garde puzzleCount dans les bornes
    const newPuzzle = Math.min(puzzleCount + 1, zoneData.puzzlePieces);
    setPuzzleCount(newPuzzle);
    Animated.timing(progressW, {
      toValue: (newPuzzle / zoneData.puzzlePieces) * 100,
      duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();

    setShowSuccess(true);
  };

  const doneMissions = missions.filter(m => m.done).length;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background photo */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <Image source={{ uri: zoneData.img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{zoneData.name}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlide }] }]}>

          {/* Progression */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progression du puzzle</Text>
              <Text style={[styles.progressPct, { color: zoneData.accent }]}>
                {Math.round((doneMissions / missions.length) * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, {
                backgroundColor: zoneData.accent,
                width: progressW.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              }]} />
            </View>
          </View>

          {/* Pièces puzzle avec images */}
          <View style={styles.puzzleSection}>
            <Text style={styles.puzzleSectionTitle}>Pièces de puzzle {puzzleCount}/{zoneData.puzzlePieces}</Text>
            <View style={styles.puzzleRow}>
              {Array.from({ length: zoneData.puzzlePieces }).map((_, i) => (
                <PuzzlePiece
                  key={i}
                  filled={i < puzzleCount}
                  index={i}
                  accent={zoneData.accent}
                  img={zoneData.img}
                />
              ))}
            </View>
          </View>

          {/* Missions */}
          <Text style={styles.missionsTitle}>Missions de la zone</Text>
          {missions.map((m) => (
            <MissionRow key={m.id} mission={m} accent={zoneData.accent} onPress={handleMissionPress} />
          ))}

          <TouchableOpacity
            style={[styles.allBtn, { borderColor: zoneData.accent }]}
            onPress={() => router.push("/missions")}
            activeOpacity={0.85}
          >
            <Text style={[styles.allBtnText, { color: zoneData.accent }]}>Voir les missions</Text>
            <Ionicons name="arrow-forward" size={15} color={zoneData.accent} />
          </TouchableOpacity>

        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FIX #3/#5 — props corrigées : missionImg + zoneName/zoneImage */}
      <SuccessModal
        visible={showSuccess}
        xp={currentMission?.reward ?? 20}
        missionImg={currentMission?.icon}
        onContinue={() => {
          setShowSuccess(false);
          if (pendingUnlock.current) {
            pendingUnlock.current = false;
            setTimeout(() => setShowUnlocked(true), 500);
          }
        }}
      />
      <ZoneUnlockedModal
        visible={showUnlocked}
        zoneName="Cascade"
        zoneImage="https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80"
        onExplore={() => { setShowUnlocked(false); router.back(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12, zIndex: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  scroll: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 6 },

  card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 26, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8,
  },

  progressSection: { marginBottom: 18 },
  progressHeader:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel:   { fontSize: 13, fontWeight: "700", color: "#2d1a6e" },
  progressPct:     { fontSize: 13, fontWeight: "900" },
  progressTrack:   { height: 10, backgroundColor: "#e8e0ff", borderRadius: 10, overflow: "hidden" },
  progressFill:    { height: "100%", borderRadius: 10 },

  puzzleSection:      { marginBottom: 18 },
  puzzleSectionTitle: { fontSize: 12, fontWeight: "700", color: "#9b87c9", marginBottom: 10 },
  puzzleRow:          { flexDirection: "row", gap: 10 },
  puzzlePiece: {
    width: 68, height: 68, borderRadius: 16,
    overflow: "hidden", borderWidth: 2,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  puzzleImg: { width: "100%", height: "100%" },
  puzzleCheckOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  puzzleEmpty: { width: "100%", height: "100%", backgroundColor: "#ede8ff", justifyContent: "center", alignItems: "center" },

  missionsTitle: { fontSize: 15, fontWeight: "800", color: "#2d1a6e", marginBottom: 12 },

  missionRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8f7ff", borderRadius: 18,
    padding: 10, marginBottom: 10, gap: 10,
  },
  missionDone: { backgroundColor: "#f0fdf4", opacity: 0.85 },

  missionImgBox: { width: 52, height: 52, borderRadius: 14, overflow: "hidden", position: "relative" },
  missionImg: { width: "100%", height: "100%" },
  missionImgOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },

  missionInfo:  { flex: 1 },
  missionTitle: { fontSize: 13, fontWeight: "700", color: "#2d1a6e", marginBottom: 5, lineHeight: 17 },
  missionMeta:  { flexDirection: "row", gap: 5, flexWrap: "wrap", alignItems: "center" },
  diffPill:     { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  diffPillText: { fontSize: 10, fontWeight: "700" },
  rewardText:   { fontSize: 10, color: "#9b87c9", fontWeight: "600" },

  doneBtn:  { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  startBtn: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  startBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  allBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 2, borderRadius: 22,
    paddingVertical: 12, marginTop: 6,
  },
  allBtnText: { fontSize: 14, fontWeight: "800" },
});