import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Image,
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import BackButton from "../components/BackButton";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

const { width: SW } = Dimensions.get("window");
const MAP_H = 460;

interface Zone {
  id_zone: number;
  slug: string;
  name: string;
  img: string;
  unlocked: boolean;
  completed: boolean;
}

// Positions fixes sur la carte par slug
const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  clairiere: { x: 0.5, y: 0.1 }, sousbois: { x: 0.25, y: 0.32 },
  cascade:   { x: 0.72, y: 0.32 }, cimes:  { x: 0.5,  y: 0.58 },
  bibliotheque: { x: 0.5, y: 0.1 }, campus: { x: 0.25, y: 0.32 },
  cafe:      { x: 0.72, y: 0.32 }, amphi:   { x: 0.5,  y: 0.58 },
  orbite:    { x: 0.5, y: 0.1 }, nebuleuse: { x: 0.25, y: 0.32 },
  station:   { x: 0.72, y: 0.32 }, trounoir: { x: 0.5, y: 0.58 },
  plage:     { x: 0.5, y: 0.1 }, recif:    { x: 0.25, y: 0.32 },
  fonds:     { x: 0.72, y: 0.32 }, ile:     { x: 0.5,  y: 0.58 },
  vallee:    { x: 0.5, y: 0.1 }, refuge:   { x: 0.25, y: 0.32 },
  glacier:   { x: 0.72, y: 0.32 }, sommet:  { x: 0.5,  y: 0.58 },
  temple:    { x: 0.5, y: 0.1 }, jardinzen: { x: 0.25, y: 0.32 },
  cerisiers: { x: 0.72, y: 0.32 }, fuji:    { x: 0.5,  y: 0.58 },
  aurore:    { x: 0.5, y: 0.1 }, coucher:  { x: 0.25, y: 0.32 },
  arc:       { x: 0.72, y: 0.32 }, etoiles: { x: 0.5,  y: 0.58 },
};

const WORLD_CONNECTIONS: Record<string, [string, string][]> = {
  foret:    [["clairiere","sousbois"],["clairiere","cascade"],["sousbois","cimes"],["cascade","cimes"]],
  ville:    [["bibliotheque","campus"],["bibliotheque","cafe"],["campus","amphi"],["cafe","amphi"]],
  espace:   [["orbite","nebuleuse"],["orbite","station"],["nebuleuse","trounoir"],["station","trounoir"]],
  ocean:    [["plage","recif"],["plage","fonds"],["recif","ile"],["fonds","ile"]],
  montagne: [["vallee","refuge"],["vallee","glacier"],["refuge","sommet"],["glacier","sommet"]],
  japon:    [["temple","jardinzen"],["temple","cerisiers"],["jardinzen","fuji"],["cerisiers","fuji"]],
  lumiere:  [["aurore","coucher"],["aurore","arc"],["coucher","etoiles"],["arc","etoiles"]],
};

const WORLD_SOUNDS: Record<string, any> = {
  foret: require("../assets/sounds/foret.mp3"),
  ville: require("../assets/sounds/ville.mp3"),
  espace: require("../assets/sounds/espace.mp3"),
  ocean: require("../assets/sounds/ocean.mp3"),
  montagne: require("../assets/sounds/montagne.mp3"),
  japon: require("../assets/sounds/japon.mp3"),
  lumiere: require("../assets/sounds/lumiere.mp3"),
};

function ZoneNode({ zone, index, accent, onPress }: {
  zone: Zone; index: number; accent: string; onPress: (z: Zone) => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, delay: index * 120, useNativeDriver: true }).start();
    if (zone.unlocked && !zone.completed) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.14, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
  }, []);

  const pos  = ZONE_POSITIONS[zone.slug] ?? { x: 0.5, y: 0.5 };
  const SIZE = zone.unlocked ? 72 : 58;
  const left = pos.x * (SW - 32) - SIZE / 2 + 16;
  const top  = pos.y * MAP_H - SIZE / 2;

  return (
    <Animated.View style={{
      position: "absolute", left, top,
      transform: [{ scale: Animated.multiply(scale, zone.unlocked && !zone.completed ? pulse : new Animated.Value(1)) }],
    }}>
      <TouchableOpacity onPress={() => zone.unlocked && onPress(zone)} activeOpacity={zone.unlocked ? 0.85 : 1}>
        {zone.unlocked && !zone.completed && (
          <View style={[styles.nodeHalo, { width: SIZE + 18, height: SIZE + 18, borderRadius: (SIZE + 18) / 2, borderColor: accent + "55", left: -9, top: -9 }]} />
        )}
        <View style={[styles.nodeCircle, {
          width: SIZE, height: SIZE, borderRadius: SIZE / 2,
          borderColor: zone.completed ? accent : zone.unlocked ? accent : "rgba(255,255,255,0.3)",
          borderWidth: zone.unlocked ? 3 : 2,
          shadowColor: zone.unlocked ? accent : "transparent",
        }]}>
          {zone.unlocked
            ? <Image source={{ uri: zone.img }} style={{ width: "100%", height: "100%", borderRadius: SIZE / 2 }} resizeMode="cover" />
            : <View style={[styles.nodeLocked, { borderRadius: SIZE / 2 }]}><Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" /></View>
          }
          {zone.completed && (
            <View style={[styles.doneCheck, { backgroundColor: accent }]}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[styles.nodeLabel, { color: zone.unlocked ? "#fff" : "rgba(255,255,255,0.5)" }]} numberOfLines={1}>
          {zone.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ConnLine({ fromSlug, toSlug, zones, accent }: {
  fromSlug: string; toSlug: string; zones: Zone[]; accent: string;
}) {
  const fp = ZONE_POSITIONS[fromSlug], tp = ZONE_POSITIONS[toSlug];
  if (!fp || !tp) return null;
  const x1 = fp.x * (SW - 32) + 16, y1 = fp.y * MAP_H;
  const x2 = tp.x * (SW - 32) + 16, y2 = tp.y * MAP_H;
  const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const ang = Math.atan2(y2-y1, x2-x1) * (180 / Math.PI);
  const unlocked = zones.find(z => z.slug === fromSlug)?.unlocked && zones.find(z => z.slug === toSlug)?.unlocked;
  return (
    <View style={{ position: "absolute", left: x1, top: y1 - 2.5, width: len, height: 5, borderRadius: 3, backgroundColor: unlocked ? accent + "90" : "rgba(255,255,255,0.18)", transform: [{ rotate: `${ang}deg` }], transformOrigin: "0 50%" }}>
      {unlocked && <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 3, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.4)" }} />}
    </View>
  );
}

export default function WorldMapScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const { worldSlug = "foret" } = useLocalSearchParams<{ worldSlug: string }>();

  const [worldInfo, setWorldInfo] = useState<{ nom: string; bg: string; accent: string } | null>(null);
  const [zones, setZones]         = useState<Zone[]>([]);
  const [loading, setLoading]     = useState(true);

  const soundRef   = useRef<Audio.Sound | null>(null);
  const bgFade     = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(60)).current;

  // ✅ useFocusEffect : recharge les zones CHAQUE FOIS qu'on revient sur cette page
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          // 1. Monde
          const { data: w } = await supabase
            .from("world")
            .select("id_world, nom, image_url, accent_color")
            .eq("slug", worldSlug)
            .single();
          if (!w) return;

          setWorldInfo({ nom: w.nom, bg: w.image_url, accent: w.accent_color ?? "#22c55e" });

          // 2. Zones du monde
          const { data: zonesData } = await supabase
            .from("zone")
            .select("id_zone, nom, slug, image_url")
            .eq("id_world", w.id_world)
            .order("ordre", { ascending: true });
          if (!zonesData?.length) { setZones([]); return; }

          // 3. Progression user sur ces zones
          const { data: progData } = await supabase
            .from("zone_progress")
            .select("id_zone, unlocked, completed")
            .eq("id_user", userId)
            .in("id_zone", zonesData.map(z => z.id_zone));

          const progMap: Record<number, any> = {};
          (progData ?? []).forEach(p => { progMap[p.id_zone] = p; });

          setZones(zonesData.map(z => ({
            id_zone:   z.id_zone,
            slug:      z.slug,
            name:      z.nom,
            img:       z.image_url,
            unlocked:  progMap[z.id_zone]?.unlocked  ?? false,
            completed: progMap[z.id_zone]?.completed ?? false,
          })));
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [worldSlug, userId])
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sf = WORLD_SOUNDS[worldSlug];
        if (!sf) return;
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(sf, { isLooping: true, volume: 0.4 });
        if (mounted) { soundRef.current = sound; await sound.playAsync(); }
      } catch {}
    })();
    Animated.parallel([
      Animated.timing(bgFade,     { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(cardSlide,  { toValue: 0, friction: 7, delay: 400, useNativeDriver: true }),
    ]).start();
    return () => { mounted = false; soundRef.current?.unloadAsync(); };
  }, [worldSlug]);

  if (loading) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color="#7f5af0" /></View>;
  }

  const accent = worldInfo?.accent ?? "#22c55e";
  const connections = WORLD_CONNECTIONS[worldSlug] ?? [];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
        {worldInfo?.bg && <Image source={{ uri: worldInfo.bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
      </Animated.View>

      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{worldInfo?.nom ?? worldSlug}</Text>
          <View style={[styles.soundChip, { backgroundColor: accent + "cc" }]}>
            <Ionicons name="musical-notes" size={11} color="#fff" />
            <Text style={styles.soundChipText}>Son ambiant actif</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.muteBtn} onPress={async () => {
          if (soundRef.current) {
            const s = await soundRef.current.getStatusAsync();
            if (s.isLoaded && s.isPlaying) soundRef.current.pauseAsync();
            else soundRef.current.playAsync();
          }
        }}>
          <Ionicons name="volume-medium" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ height: MAP_H + 40, position: "relative" }}>
          {connections.map(([a, b], i) => (
            <ConnLine key={i} fromSlug={a} toSlug={b} zones={zones} accent={accent} />
          ))}
          {zones.map((zone, i) => (
            <ZoneNode
              key={zone.id_zone} zone={zone} index={i} accent={accent}
              onPress={(z) => router.push({ pathname: "/frontend/screens/ZoneScreen", params: { zoneId: String(z.id_zone), zoneSlug: z.slug } })}
            />
          ))}
        </View>

        <Animated.View style={[styles.statsCard, { transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: accent }]}>{zones.filter(z => z.unlocked).length}/{zones.length}</Text>
              <Text style={styles.statLabel}>Zones débloquées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: accent }]}>{zones.filter(z => z.completed).length}</Text>
              <Text style={styles.statLabel}>Zones complétées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: accent }]}>{zones.filter(z => z.completed).length}/{zones.length}</Text>
              <Text style={styles.statLabel}>🧩 Puzzle</Text>
            </View>
          </View>
          <Text style={styles.statsHint}>Terminez les missions pour débloquer de nouvelles zones !</Text>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12, zIndex: 10 },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle:  { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  soundChip:    { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  soundChipText:{ color: "#fff", fontSize: 10, fontWeight: "700" },
  muteBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  scroll:       { paddingBottom: 20 },
  nodeHalo:     { position: "absolute", borderWidth: 3 },
  nodeCircle:   { overflow: "hidden", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6, position: "relative" },
  nodeLocked:   { width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  doneCheck:    { position: "absolute", bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  nodeLabel:    { fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 5, maxWidth: 80, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  statsCard:    { marginHorizontal: 16, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 24, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  statsRow:     { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  statItem:     { alignItems: "center", gap: 3 },
  statVal:      { fontSize: 22, fontWeight: "900" },
  statLabel:    { fontSize: 11, color: "#9b87c9", fontWeight: "600" },
  statDivider:  { width: 1, height: 40, backgroundColor: "#e8e0ff" },
  statsHint:    { fontSize: 12, color: "#9b87c9", fontWeight: "600", textAlign: "center", lineHeight: 17 },
});