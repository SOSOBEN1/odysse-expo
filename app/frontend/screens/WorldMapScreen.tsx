import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
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

const { width: SW } = Dimensions.get("window");
const MAP_H = 460;

// ── Types ────────────────────────────────────────────────────
interface Zone {
  id: string;
  name: string;
  img: string;
  unlocked: boolean;
  done: boolean;
  missions: number;
  x: number;
  y: number;
}

interface WorldData {
  bg: string;
  accent: string;
  dark: string;
  light: string;
  sound: number; // require() returns a number in React Native
  zones: Zone[];
  connections: [string, string][];
}

// ── Zones par monde ─────────────────────────────────────────
const ZONES_BY_WORLD: Record<string, WorldData> = {
  foret: {
    bg: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=85",
    accent: "#22c55e", dark: "#14532d", light: "#dcfce7",
    sound: require("../assets/sounds/foret.mp3"),
    zones: [
      { id: "clairiere",   name: "Clairière",      img: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=80", unlocked: true,  done: true,  missions: 3, x: 0.5,  y: 0.1  },
      { id: "sousbois",    name: "Sous-bois",       img: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&q=80", unlocked: true,  done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "cascade",     name: "Cascade",         img: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.72, y: 0.32 },
      { id: "cimes",       name: "Cime des arbres", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.58 },
    ],
    connections: [["clairiere","sousbois"],["clairiere","cascade"],["sousbois","cimes"],["cascade","cimes"]],
  },
  ville: {
    bg: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&q=85",
    accent: "#3b82f6", dark: "#1e3a8a", light: "#dbeafe",
    sound: require("../assets/sounds/ville.mp3"),
    zones: [
      { id: "bibliotheque", name: "Bibliothèque",   img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "campus",       name: "Campus",          img: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "cafe",         name: "Café étudiant",   img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.72, y: 0.32 },
      { id: "amphi",        name: "Amphithéâtre",    img: "https://images.unsplash.com/photo-1597534458220-9fb4969f2df5?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.5,  y: 0.58 },
    ],
    connections: [["bibliotheque","campus"],["bibliotheque","cafe"],["campus","amphi"],["cafe","amphi"]],
  },
  espace: {
    bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=85",
    accent: "#8b5cf6", dark: "#4c1d95", light: "#ede9fe",
    sound: require("../assets/sounds/espace.mp3"),
    zones: [
      { id: "orbite",    name: "Orbite",          img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "nebuleuse", name: "Nébuleuse",        img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "station",   name: "Station spatiale", img: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.72, y: 0.32 },
      { id: "trounoir",  name: "Trou noir",        img: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400&q=80", unlocked: false, done: false, missions: 5, x: 0.5,  y: 0.58 },
    ],
    connections: [["orbite","nebuleuse"],["orbite","station"],["nebuleuse","trounoir"],["station","trounoir"]],
  },
  ocean: {
    bg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85",
    accent: "#0ea5e9", dark: "#0c4a6e", light: "#e0f2fe",
    sound: require("../assets/sounds/ocean.mp3"),
    zones: [
      { id: "plage",   name: "Plage",          img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "recif",   name: "Récif corallien", img: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "fonds",   name: "Grands fonds",    img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.72, y: 0.32 },
      { id: "ile",     name: "Île isolée",      img: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.58 },
    ],
    connections: [["plage","recif"],["plage","fonds"],["recif","ile"],["fonds","ile"]],
  },
  montagne: {
    bg: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85",
    accent: "#f59e0b", dark: "#78350f", light: "#fef3c7",
    sound: require("../assets/sounds/montagne.mp3"),
    zones: [
      { id: "vallee",  name: "Vallée",    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "refuge",  name: "Refuge",    img: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "glacier", name: "Glacier",   img: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.72, y: 0.32 },
      { id: "sommet",  name: "Sommet",    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80", unlocked: false, done: false, missions: 5, x: 0.5,  y: 0.58 },
    ],
    connections: [["vallee","refuge"],["vallee","glacier"],["refuge","sommet"],["glacier","sommet"]],
  },
  japon: {
    bg: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=900&q=85",
    accent: "#ec4899", dark: "#831843", light: "#fce7f3",
    sound: require("../assets/sounds/japon.mp3"),
    zones: [
      { id: "temple",    name: "Temple",       img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "jardinzen", name: "Jardin zen",   img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "cerisiers", name: "Cerisiers",    img: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.72, y: 0.32 },
      { id: "fuji",      name: "Mont Fuji",    img: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.5,  y: 0.58 },
    ],
    connections: [["temple","jardinzen"],["temple","cerisiers"],["jardinzen","fuji"],["cerisiers","fuji"]],
  },
  lumiere: {
    bg: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=900&q=85",
    accent: "#f97316", dark: "#7c2d12", light: "#ffedd5",
    sound: require("../assets/sounds/lumiere.mp3"),
    zones: [
      { id: "aurore",   name: "Aurore boréale",    img: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.5,  y: 0.1  },
      { id: "coucher",  name: "Coucher de soleil",  img: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.25, y: 0.32 },
      { id: "arc",      name: "Arc-en-ciel",        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", unlocked: false, done: false, missions: 3, x: 0.72, y: 0.32 },
      { id: "etoiles",  name: "Nuit étoilée",       img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80", unlocked: false, done: false, missions: 4, x: 0.5,  y: 0.58 },
    ],
    connections: [["aurore","coucher"],["aurore","arc"],["coucher","etoiles"],["arc","etoiles"]],
  },
};

// ── Node zone sur la carte ──────────────────────────────────
interface ZoneNodeProps {
  zone: Zone;
  index: number;
  accent: string;
  onPress: (zone: Zone) => void;
}

function ZoneNode({ zone, index, accent, onPress }: ZoneNodeProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, delay: index * 120, useNativeDriver: true }).start();
    if (zone.unlocked && !zone.done) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.14, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const SIZE  = zone.unlocked ? 72 : 58;
  const left  = zone.x * (SW - 32) - SIZE / 2 + 16;
  const top   = zone.y * MAP_H - SIZE / 2;

  return (
    <Animated.View style={{ position: "absolute", left, top, transform: [{ scale: Animated.multiply(scale, zone.unlocked && !zone.done ? pulse : new Animated.Value(1)) }] }}>
      <TouchableOpacity onPress={() => zone.unlocked && onPress(zone)} activeOpacity={zone.unlocked ? 0.85 : 1}>

        {/* Halo pulsant */}
        {zone.unlocked && !zone.done && (
          <View style={[styles.nodeHalo, { width: SIZE + 18, height: SIZE + 18, borderRadius: (SIZE + 18) / 2, borderColor: accent + "55", left: -9, top: -9 }]} />
        )}

        {/* Cercle principal avec photo */}
        <View style={[
          styles.nodeCircle,
          {
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            borderColor: zone.done ? accent : zone.unlocked ? accent : "rgba(255,255,255,0.3)",
            borderWidth: zone.unlocked ? 3 : 2,
            shadowColor: zone.unlocked ? accent : "transparent",
          },
        ]}>
          {zone.unlocked ? (
            <Image source={{ uri: zone.img }} style={{ width: "100%", height: "100%", borderRadius: SIZE / 2 }} resizeMode="cover" />
          ) : (
            <View style={[styles.nodeLocked, { borderRadius: SIZE / 2 }]}>
              <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          )}

          {/* Check si terminé */}
          {zone.done && (
            <View style={[styles.doneCheck, { backgroundColor: accent }]}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </View>
          )}
        </View>

        {/* Label */}
        <Text style={[styles.nodeLabel, { color: zone.unlocked ? "#fff" : "rgba(255,255,255,0.5)" }]} numberOfLines={1}>
          {zone.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Ligne de connexion ──────────────────────────────────────
interface ConnLineProps {
  from: Zone;
  to: Zone;
  accent: string;
}

function ConnLine({ from, to, accent }: ConnLineProps) {
  const x1 = from.x * (SW - 32) + 16;
  const y1 = from.y * MAP_H;
  const x2 = to.x   * (SW - 32) + 16;
  const y2 = to.y   * MAP_H;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx) * (180 / Math.PI);
  const unlocked = from.unlocked && to.unlocked;

  return (
    <View style={{
      position: "absolute", left: x1, top: y1 - 2.5,
      width: len, height: 5, borderRadius: 3,
      backgroundColor: unlocked ? accent + "90" : "rgba(255,255,255,0.18)",
      transform: [{ rotate: `${ang}deg` }],
      transformOrigin: "0 50%",
    }}>
      {unlocked && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 3,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.4)",
        }} />
      )}
    </View>
  );
}

// ── Écran ───────────────────────────────────────────────────
export default function WorldMapScreen() {
  const router = useRouter();
  const { worldId = "foret" } = useLocalSearchParams<{ worldId: string }>();
  const world = ZONES_BY_WORLD[worldId] ?? ZONES_BY_WORLD.foret;

  const soundRef   = useRef<Audio.Sound | null>(null);
  const bgFade     = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(60)).current;

  // Charger et jouer le son d'ambiance
  useEffect(() => {
    let mounted = true;
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(world.sound, {
          isLooping: true,
          volume: 0.4,
        });
        if (mounted) {
          soundRef.current = sound;
          await sound.playAsync();
        }
      } catch (e) {
        console.log("Son non disponible:", e);
      }
    };
    loadSound();

    Animated.parallel([
      Animated.timing(bgFade,     { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(cardSlide,  { toValue: 0, friction: 7, delay: 400, useNativeDriver: true }),
    ]).start();

    return () => {
      mounted = false;
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const getZone = (id: string): Zone | undefined => world.zones.find((z) => z.id === id);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Photo de fond avec fade */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        <Image source={{ uri: world.bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {/* Overlay sombre */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{worldId.charAt(0).toUpperCase() + worldId.slice(1)}</Text>
          <View style={[styles.soundChip, { backgroundColor: world.accent + "cc" }]}>
            <Ionicons name="musical-notes" size={11} color="#fff" />
            <Text style={styles.soundChipText}>Son ambiant actif</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.muteBtn}
          onPress={async () => {
            if (soundRef.current) {
              const status = await soundRef.current.getStatusAsync();
              if (status.isLoaded && status.isPlaying) soundRef.current.pauseAsync();
              else soundRef.current.playAsync();
            }
          }}
        >
          <Ionicons name="volume-medium" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Carte avec zones */}
        <View style={{ height: MAP_H + 40, position: "relative" }}>
          {/* Lignes */}
          {world.connections.map(([a, b], i) => {
            const from = getZone(a), to = getZone(b);
            if (!from || !to) return null;
            return <ConnLine key={i} from={from} to={to} accent={world.accent} />;
          })}

          {/* Zones */}
          {world.zones.map((zone, i) => (
            <ZoneNode
              key={zone.id}
              zone={zone}
              index={i}
              accent={world.accent}
              // onPress={(z) => router.push({ pathname: "/zone", params: { worldId, zoneId: z.id } })}
              onPress={(z)=> router.push("/frontend/screens/ZoneScreen")}

            />
          ))}
        </View>

        {/* Footer stats */}
        <Animated.View style={[styles.statsCard, { transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: world.accent }]}>
                {world.zones.filter(z => z.unlocked).length}/{world.zones.length}
              </Text>
              <Text style={styles.statLabel}>Zones débloquées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: world.accent }]}>
                {world.zones.filter(z => z.done).length}
              </Text>
              <Text style={styles.statLabel}>Zones complétées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: world.accent }]}>
                {world.zones.filter(z => z.done).length}/{world.zones.length}
              </Text>
              <Text style={styles.statLabel}>🧩 Puzzle</Text>
            </View>
          </View>

          <Text style={styles.statsHint}>
            Terminez les missions pour débloquer de nouvelles zones !
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12,
    zIndex: 10,
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  soundChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  soundChipText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  muteBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },

  scroll: { paddingBottom: 20 },

  nodeHalo:   { position: "absolute", borderWidth: 3 },
  nodeCircle: {
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
    position: "relative",
  },
  nodeLocked: {
    width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center",
  },
  doneCheck: {
    position: "absolute", bottom: -3, right: -3,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  nodeLabel: {
    fontSize: 10, fontWeight: "700", textAlign: "center",
    marginTop: 5, maxWidth: 80,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  statsCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  statItem: { alignItems: "center", gap: 3 },
  statVal:  { fontSize: 22, fontWeight: "900" },
  statLabel:{ fontSize: 11, color: "#9b87c9", fontWeight: "600" },
  statDivider: { width: 1, height: 40, backgroundColor: "#e8e0ff" },
  statsHint: {
    fontSize: 12, color: "#9b87c9", fontWeight: "600",
    textAlign: "center", lineHeight: 17,
  },
});
