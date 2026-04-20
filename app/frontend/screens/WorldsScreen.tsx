import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  ViewStyle,
} from "react-native";
import Navbar from "../components/Navbar";


const { width: SW } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────────
interface World {
  id: string;
  name: string;
  subtitle: string;
  cover: string;
  accent: string;
  dark: string;
  light: string;
  sound: number; // require() returns a number in RN
  zones: number;
  zonesUnlocked: number;
  locked: boolean;
  xpTotal: number;
}

interface AnimStarProps {
  style: ViewStyle;
  size: number;
  delay: number;
}

interface WorldCardProps {
  world: World;
  index: number;
  onPress: (world: World) => void;
}

// ── Données mondes ───────────────────────────────────────────
export const WORLDS: World[] = [
  {
    id: "foret",
    name: "Monde Forêt",
    subtitle: "Concentration & pleine conscience",
    cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=85",
    accent: "#22c55e",
    dark: "#14532d",
    light: "#dcfce7",
    sound: require("../assets/sounds/foret.mp3"),
    zones: 4,
    zonesUnlocked: 2,
    locked: false,
    xpTotal: 240,
  },
  {
    id: "ville",
    name: "Monde Ville",
    subtitle: "Gestion du temps & organisation",
    cover: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=85",
    accent: "#3b82f6",
    dark: "#1e3a8a",
    light: "#dbeafe",
    sound: require("../assets/sounds/ville.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 280,
  },
  {
    id: "espace",
    name: "Monde Espace",
    subtitle: "Sciences & mathématiques",
    cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=85",
    accent: "#8b5cf6",
    dark: "#4c1d95",
    light: "#ede9fe",
    sound: require("../assets/sounds/espace.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 320,
  },
  {
    id: "ocean",
    name: "Monde Océan",
    subtitle: "Bien-être & gestion du stress",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85",
    accent: "#0ea5e9",
    dark: "#0c4a6e",
    light: "#e0f2fe",
    sound: require("../assets/sounds/ocean.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 260,
  },
  {
    id: "montagne",
    name: "Monde Montagne",
    subtitle: "Résilience & dépassement de soi",
    cover: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85",
    accent: "#f59e0b",
    dark: "#78350f",
    light: "#fef3c7",
    sound: require("../assets/sounds/montagne.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 300,
  },
  {
    id: "japon",
    name: "Monde Japon",
    subtitle: "Méthodes d'étude & discipline",
    cover: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=85",
    accent: "#ec4899",
    dark: "#831843",
    light: "#fce7f3",
    sound: require("../assets/sounds/japon.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 290,
  },
  {
    id: "lumiere",
    name: "Monde Lumière",
    subtitle: "Créativité & inspiration",
    cover: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=85",
    accent: "#f97316",
    dark: "#7c2d12",
    light: "#ffedd5",
    sound: require("../assets/sounds/lumiere.mp3"),
    zones: 4,
    zonesUnlocked: 0,
    locked: true,
    xpTotal: 270,
  },
];

// ── Étoile animée ─────────────────────────────────────────────
function AnimStar({ style, size, delay }: AnimStarProps) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(500),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.8] }),
          transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }],
        },
      ]}
    >
      <MaterialIcons name="auto-awesome" size={size} color="#c4b5fd" />
    </Animated.View>
  );
}

// ── Carte monde ───────────────────────────────────────────────
function WorldCard({ world, index, onPress }: WorldCardProps) {
  const slideY  = useRef(new Animated.Value(80)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,  { toValue: 0, friction: 7, tension: 60, delay: index * 100, useNativeDriver: true }),
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, friction: 6, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const pct = world.locked ? 0 : Math.round((world.zonesUnlocked / world.zones) * 100);
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!world.locked) {
      Animated.timing(progressWidth, {
        toValue: pct,
        duration: 900,
        delay: index * 100 + 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, []);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideY }, { scale: scaleIn }] }}>
      <TouchableOpacity
        style={styles.worldCard}
        onPress={() => !world.locked && onPress(world)}
        activeOpacity={world.locked ? 0.95 : 0.88}
      >
        {/* Cover photo */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: world.cover }} style={styles.coverImage} resizeMode="cover" />

          {/* Overlay — LinearGradient remplacé par une View semi-transparente (pas de CSS 'background' en RN) */}
          <View style={styles.coverOverlay} />

          {/* Cadenas si verrouillé */}
          {world.locked && (
            <View style={styles.lockOverlay}>
              <View style={[styles.lockCircle, { borderColor: "rgba(255,255,255,0.5)" }]}>
                <Ionicons name="lock-closed" size={24} color="#fff" />
              </View>
            </View>
          )}

          {/* Badge zones en haut à droite */}
          <View style={styles.zonesBadge}>
            <MaterialIcons name="place" size={12} color="#fff" />
            <Text style={styles.zonesBadgeText}>
              {world.locked ? `${world.zones} zones` : `${world.zonesUnlocked}/${world.zones} zones`}
            </Text>
          </View>

          {/* Son badge */}
          <View style={[styles.soundBadge, { backgroundColor: world.accent + "cc" }]}>
            <Ionicons name="musical-notes" size={11} color="#fff" />
          </View>

          {/* Titre sur la photo */}
          <View style={styles.coverTitleWrapper}>
            <Text style={styles.coverTitle}>{world.name}</Text>
            <Text style={styles.coverSubtitle}>{world.subtitle}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          {!world.locked ? (
            <>
              {/* Barre de progression animée */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: world.accent,
                        width: progressWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPct, { color: world.accent }]}>{pct}%</Text>
              </View>

              {/* XP total */}
              <View style={styles.cardFooter}>
                <View style={[styles.xpChip, { backgroundColor: world.light }]}>
                  <Text style={[styles.xpChipText, { color: world.dark }]}>⚡ {world.xpTotal} XP à gagner</Text>
                </View>
                <TouchableOpacity
                  style={[styles.exploreBtn, { backgroundColor: world.accent }]}
                  onPress={() => onPress(world)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.exploreBtnText}>Explorer</Text>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.cardFooter}>
              <Text style={styles.lockedHint}>Terminez les missions précédentes pour débloquer</Text>
              <View style={[styles.xpChip, { backgroundColor: "#f3f4f6" }]}>
                <Text style={[styles.xpChipText, { color: "#6b7280" }]}>🔒 {world.xpTotal} XP</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Écran ─────────────────────────────────────────────────────
export default function WorldsScreen() {
  
  const router     = useRouter();
  const [activeNav, setActiveNav] = useState("carte");
  const headerY    = useRef(new Animated.Value(-30)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,    { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const STARS: Array<{ top?: number; left?: number; right?: number; size: number; delay: number }> = [
    { top: 14, left: 16,  size: 14, delay: 0   },
    { top: 14, right: 20, size: 10, delay: 400  },
    { top: 60, right: 8,  size: 8,  delay: 700  },
    { top: 80, left: 40,  size: 6,  delay: 200  },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Fond subtil */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgTop} />
      </View>

      {/* Étoiles */}
      {STARS.map((s, i) => (
        <AnimStar
          key={i}
          size={s.size}
          delay={s.delay}
          style={{
            position: "absolute",
            zIndex: 2,
            ...(s.top   !== undefined ? { top:   s.top   } : {}),
            ...(s.left  !== undefined ? { left:  s.left  } : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
          }}
        />
      ))}

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={styles.headerTitle}>LES MONDES</Text>
          <Text style={styles.headerSub}>Explore et débloque de nouveaux univers</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpTotalBadge}>
            <Text style={styles.xpTotalText}>⚡ 245 XP</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {WORLDS.map((world, i) => (
          <WorldCard
            key={world.id}
            world={world}
            index={i}
            // onPress={(w: World) => router.push({ pathname: "/world-map", params: { worldId: w.id } })}
            onPress={(w: World) => router.push("/frontend/screens/WorldMapScreen")}
          />
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Navbar active={activeNav} onChange={setActiveNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },

  bgTop: {
    height: 220,
    backgroundColor: "#ede9fe",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    zIndex: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.8 },
  headerSub:   { fontSize: 12, color: "#9b87c9", fontWeight: "600", marginTop: 3 },
  headerRight: { alignItems: "flex-end" },
  xpTotalBadge: {
    backgroundColor: "#7f5af0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xpTotalText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  scroll: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },

  /* Card */
  worldCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  /* Cover photo */
  coverWrapper: { height: 180, position: "relative" },
  coverImage:   { width: "100%", height: "100%" },

  // FIX — suppression de 'background' (propriété CSS web invalide en RN)
  // Utilisez expo-linear-gradient si vous voulez un vrai dégradé
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2,
  },

  zonesBadge: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  zonesBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  soundBadge: {
    position: "absolute", top: 12, left: 12,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },

  coverTitleWrapper: { position: "absolute", bottom: 14, left: 14, right: 14 },
  coverTitle:    { fontSize: 20, fontWeight: "900", color: "#fff", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  coverSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  /* Body */
  cardBody: { paddingHorizontal: 16, paddingVertical: 14 },

  progressRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  progressTrack: { flex: 1, height: 8, backgroundColor: "#e8e0ff", borderRadius: 8, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 8 },
  progressPct:   { fontSize: 12, fontWeight: "800", minWidth: 34, textAlign: "right" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  xpChip:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  xpChipText: { fontSize: 12, fontWeight: "700" },

  lockedHint: { fontSize: 11, color: "#9ca3af", fontWeight: "500", flex: 1, marginRight: 10, fontStyle: "italic" },

  exploreBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  exploreBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
