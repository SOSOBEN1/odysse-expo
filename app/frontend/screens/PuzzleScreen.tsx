import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";

const { width: SW } = Dimensions.get("window");
const GRID_COLS   = 3;
const TOTAL_PIECES = 9;

// ── Data zones (photos réelles) ─────────────────────────────
const ZONE_PUZZLES = {
  clairiere: {
    name: "Clairière",
    worldName: "Monde Forêt",
    img: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=85",
    accent: "#22c55e",
    dark: "#14532d",
    light: "#dcfce7",
    piecesEarned: 4,
  },
  sousbois: {
    name: "Sous-bois",
    worldName: "Monde Forêt",
    img: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=85",
    accent: "#22c55e",
    dark: "#14532d",
    light: "#dcfce7",
    piecesEarned: 2,
  },
  cascade: {
    name: "Cascade",
    worldName: "Monde Forêt",
    img: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=85",
    accent: "#22c55e",
    dark: "#14532d",
    light: "#dcfce7",
    piecesEarned: 0,
  },
  cimes: {
    name: "Cime des arbres",
    worldName: "Monde Forêt",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=85",
    accent: "#22c55e",
    dark: "#14532d",
    light: "#dcfce7",
    piecesEarned: 0,
  },
  plage: {
    name: "Plage",
    worldName: "Monde Océan",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85",
    accent: "#0ea5e9",
    dark: "#0c4a6e",
    light: "#e0f2fe",
    piecesEarned: 1,
  },
  orbite: {
    name: "Orbite",
    worldName: "Monde Espace",
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=85",
    accent: "#8b5cf6",
    dark: "#4c1d95",
    light: "#ede9fe",
    piecesEarned: 0,
  },
  temple: {
    name: "Temple",
    worldName: "Monde Japon",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=85",
    accent: "#ec4899",
    dark: "#831843",
    light: "#fce7f3",
    piecesEarned: 0,
  },
};

// ── Étoile animée ───────────────────────────────────────────
function AnimStar({ style, size = 14, delay = 0, color = "#c4b5fd" }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(400),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity:   a.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.9] }),
      transform: [{ scale: a.interpolate({ inputRange: [0,1], outputRange: [0.6,1.3] }) }],
    }]}>
      <MaterialIcons name="auto-awesome" size={size} color={color} />
    </Animated.View>
  );
}

// ── Cellule de puzzle ───────────────────────────────────────
function PuzzleCell({ index, revealed, entering, imageUri, cellSize, accent }) {
  const sc    = useRef(new Animated.Value(0)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  const row  = Math.floor(index / GRID_COLS);
  const col  = index % GRID_COLS;
  const imgX = -(col * cellSize);
  const imgY = -(row * cellSize);

  useEffect(() => {
    Animated.spring(sc, { toValue: 1, friction: 5, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (revealed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [revealed]);

  useEffect(() => {
    if (entering) {
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 900, useNativeDriver: true }).start();
    }
  }, [entering]);

  return (
    <Animated.View style={[styles.cell, {
      width: cellSize, height: cellSize,
      borderColor: revealed ? accent : "rgba(255,255,255,0.25)",
      transform: [{ scale: sc }],
    }]}>
      {revealed ? (
        <>
          {/* Portion de l'image */}
          <View style={{ width: cellSize, height: cellSize, overflow: "hidden" }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: cellSize * GRID_COLS,
                height: cellSize * GRID_COLS,
                position: "absolute",
                left: imgX,
                top: imgY,
              }}
              resizeMode="cover"
            />
          </View>

          {/* Glow coloré */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            backgroundColor: accent + "22",
            borderRadius: 10,
            opacity: glow,
          }]} />

          {/* Flash blanc à l'entrée */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            backgroundColor: "rgba(255,255,255,0.7)",
            borderRadius: 10,
            opacity: flash,
          }]} />

          {/* Check */}
          <View style={[styles.cellCheck, { backgroundColor: accent }]}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        </>
      ) : (
        <View style={styles.cellLocked}>
          <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.5)" />
        </View>
      )}
    </Animated.View>
  );
}

// ── Barre de progression ────────────────────────────────────
function ProgressBar({ value, total, accent }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: value / total,
      duration: 900,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, {
        backgroundColor: accent,
        width: w.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }),
      }]} />
    </View>
  );
}

// ── Écran principal ─────────────────────────────────────────
export default function PuzzleScreen() {
  const router = useRouter();
  const { zoneId = "clairiere" } = useLocalSearchParams();
  const zone = ZONE_PUZZLES[zoneId] ?? ZONE_PUZZLES.clairiere;

  const [pieces, setPieces]             = useState(zone.piecesEarned);
  const [newlyRevealed, setNewlyRevealed] = useState(null);
  const [activeNav, setActiveNav]       = useState("carte");

  const CELL_SIZE = Math.floor((SW - 32 - 16) / GRID_COLS) - 4;

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(-20)).current;
  const cardFade   = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerY,    { toValue: 0, friction: 7,   useNativeDriver: true }),
      Animated.timing(cardFade,   { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(cardSlide,  { toValue: 0, friction: 7,   delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const isComplete = pieces >= TOTAL_PIECES;

  const STARS = [
    { top: 100, left: 14,  size: 16, delay: 0   },
    { top: 120, right: 16, size: 11, delay: 350  },
    { top: 155, right: 8,  size: 8,  delay: 650  },
    { top: 185, left: 32,  size: 7,  delay: 180  },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Fond */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.bgTop, { backgroundColor: zone.light }]} />
      </View>

      {/* Étoiles */}
      {STARS.map((s, i) => (
        <AnimStar key={i} size={s.size} delay={s.delay} color={zone.accent}
          style={{ position: "absolute", zIndex: 2,
            ...(s.top   ? { top: s.top }   : {}),
            ...(s.left  ? { left: s.left }  : {}),
            ...(s.right ? { right: s.right } : {}),
          }}
        />
      ))}

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerY }] }]}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{zone.name}</Text>
          <Text style={[styles.headerWorld, { color: zone.accent }]}>{zone.worldName}</Text>
        </View>
        <View style={[styles.piecesBadge, { backgroundColor: zone.accent }]}>
          <Text style={styles.piecesBadgeText}>🧩 {pieces}/{TOTAL_PIECES}</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Carte puzzle */}
        <Animated.View style={[styles.puzzleCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>

          {/* Image puzzle */}
          <View style={[styles.puzzleImageContainer, { borderColor: zone.accent + "44" }]}>

            {/* Image de fond floutée (zones verrouillées) */}
            <Image
              source={{ uri: zone.img }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              blurRadius={isComplete ? 0 : 8}
            />

            {/* Overlay sombre sur l'image floutée */}
            {!isComplete && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,10,50,0.35)" }]} />
            )}

            {/* Révélation complète */}
            {isComplete && (
              <View style={styles.completeBanner}>
                <Text style={styles.completeBannerText}>🎉 Zone révélée !</Text>
              </View>
            )}

            {/* Grille de pièces */}
            {!isComplete && (
              <View style={styles.grid}>
                {Array.from({ length: TOTAL_PIECES }).map((_, i) => (
                  <PuzzleCell
                    key={i}
                    index={i}
                    revealed={i < pieces}
                    entering={i === newlyRevealed}
                    imageUri={zone.img}
                    cellSize={CELL_SIZE}
                    accent={zone.accent}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Progression */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {pieces}/{TOTAL_PIECES} pièces débloquées
              </Text>
              <Text style={[styles.progressPct, { color: zone.accent }]}>
                {Math.round((pieces / TOTAL_PIECES) * 100)}%
              </Text>
            </View>
            <ProgressBar value={pieces} total={TOTAL_PIECES} accent={zone.accent} />
          </View>

          {/* Bouton missions */}
          <TouchableOpacity
            style={[styles.missionsBtn, { backgroundColor: zone.accent, borderColor: zone.accent + "88" }]}
            onPress={() => router.push({ pathname: "/zone", params: { zoneId } })}
            activeOpacity={0.85}
          >
            <View style={styles.missionsBtnIcon}>
              <Ionicons name="rocket" size={16} color={zone.accent} />
            </View>
            <Text style={styles.missionsBtnText}>Continuer les missions</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: zone.light, borderColor: zone.accent + "33" }]}>
            <Ionicons name="information-circle" size={18} color={zone.accent} />
            <Text style={[styles.infoText, { color: zone.dark }]}>
              Complète les missions de cette zone pour débloquer toutes les pièces et révéler la photo !
            </Text>
          </View>

        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsRow, { opacity: cardFade }]}>
          <View style={[styles.statCard, { borderColor: zone.accent + "33" }]}>
            <Text style={[styles.statVal, { color: zone.accent }]}>{pieces}</Text>
            <Text style={styles.statLabel}>Gagnées</Text>
          </View>
          <View style={[styles.statCard, { borderColor: zone.accent + "33" }]}>
            <Text style={[styles.statVal, { color: "#f59e0b" }]}>{TOTAL_PIECES - pieces}</Text>
            <Text style={styles.statLabel}>Restantes</Text>
          </View>
          <View style={[styles.statCard, { borderColor: zone.accent + "33" }]}>
            <Text style={[styles.statVal, { color: "#22c55e" }]}>
              {Math.round((pieces / TOTAL_PIECES) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Complété</Text>
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Navbar active={activeNav} onChange={setActiveNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },

  bgTop: {
    height: 260,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 10,
    zIndex: 5,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.2 },
  headerWorld: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  piecesBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  piecesBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  scroll: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 6 },

  /* Carte puzzle */
  puzzleCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    padding: 16,
  },

  /* Image container */
  puzzleImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    borderWidth: 2,
  },
  completeBanner: {
    position: "absolute",
    bottom: 14, left: 0, right: 0,
    alignItems: "center",
  },
  completeBannerText: {
    fontSize: 20, fontWeight: "900", color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, overflow: "hidden",
  },

  /* Grille */
  grid: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 6,
    gap: 4,
    alignContent: "flex-start",
  },

  /* Cellule */
  cell: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    margin: 2,
  },
  cellCheck: {
    position: "absolute",
    bottom: 3, right: 3,
    width: 16, height: 16, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  cellLocked: {
    flex: 1,
    backgroundColor: "rgba(60,20,120,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Progression */
  progressSection: { marginBottom: 14 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel:  { fontSize: 13, fontWeight: "800", color: "#2d1a6e" },
  progressPct:    { fontSize: 13, fontWeight: "900" },
  progressTrack:  { height: 10, backgroundColor: "#e8e0ff", borderRadius: 10, overflow: "hidden" },
  progressFill:   { height: "100%", borderRadius: 10 },

  /* Bouton missions */
  missionsBtn: {
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    borderWidth: 2,
  },
  missionsBtnIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  missionsBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  /* Info */
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18, padding: 14,
    alignItems: "center", gap: 4,
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderWidth: 1,
  },
  statVal:   { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 10, color: "#9b87c9", fontWeight: "600", textAlign: "center" },
});