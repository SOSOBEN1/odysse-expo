import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, GestureResponderEvent,
  Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import Navbar from "../components/Navbar";
import NeonBackground, { NeonBackgroundRef } from "../components/NeonBackground";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

const { width: SW, height: SH } = Dimensions.get("window");

interface World {
  id_world: number;
  nom: string;
  slug: string;
  subtitle: string;
  cover: string;
  accent: string;
  dark: string;
  light: string;
  totalZones: number;
  unlockedZones: number;
  locked: boolean;
  xpEarned: number;
}

const WORLD_SUBTITLES: Record<string, string> = {
  foret:    "Concentration & pleine conscience",
  ville:    "Gestion du temps & organisation",
  espace:   "Sciences & mathématiques",
  ocean:    "Bien-être & gestion du stress",
  montagne: "Résilience & dépassement de soi",
  japon:    "Méthodes d'étude & discipline",
  lumiere:  "Créativité & inspiration",
};

// ─── AnimStar ─────────────────────────────────────────────────────────────────

function AnimStar({ style, size, delay }: any) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(500),
    ])).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity:   a.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.8] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }],
    }]}>
      <MaterialIcons name="auto-awesome" size={size} color="#c4b5fd" />
    </Animated.View>
  );
}

// ─── WorldCard ────────────────────────────────────────────────────────────────

function WorldCard({ world, index, onPress }: { world: World; index: number; onPress: (w: World) => void }) {
  const slideY    = useRef(new Animated.Value(80)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const scaleIn   = useRef(new Animated.Value(0.94)).current;
  const progressW = useRef(new Animated.Value(0)).current;

  const pct = world.locked ? 0 : world.totalZones > 0
    ? Math.round((world.unlockedZones / world.totalZones) * 100)
    : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,  { toValue: 0, friction: 7, tension: 60, delay: index * 100, useNativeDriver: true }),
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, friction: 6, delay: index * 100, useNativeDriver: true }),
    ]).start();
    if (!world.locked) {
      Animated.timing(progressW, {
        toValue: pct, duration: 900, delay: index * 100 + 400,
        easing: Easing.out(Easing.cubic), useNativeDriver: false,
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
        <View style={styles.coverWrapper}>
          <Image source={{ uri: world.cover }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverOverlay} />
          {world.locked && (
            <View style={styles.lockOverlay}>
              <View style={[styles.lockCircle, { borderColor: "rgba(255,255,255,0.5)" }]}>
                <Ionicons name="lock-closed" size={24} color="#fff" />
              </View>
            </View>
          )}
          <View style={styles.zonesBadge}>
            <MaterialIcons name="place" size={12} color="#fff" />
            <Text style={styles.zonesBadgeText}>
              {world.locked ? `${world.totalZones} zones` : `${world.unlockedZones}/${world.totalZones} zones`}
            </Text>
          </View>
          <View style={[styles.soundBadge, { backgroundColor: world.accent + "cc" }]}>
            <Ionicons name="musical-notes" size={11} color="#fff" />
          </View>
          <View style={styles.coverTitleWrapper}>
            <Text style={styles.coverTitle}>{world.nom}</Text>
            <Text style={styles.coverSubtitle}>{world.subtitle}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          {!world.locked ? (
            <>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, {
                    backgroundColor: world.accent,
                    width: progressW.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                  }]} />
                </View>
                <Text style={[styles.progressPct, { color: world.accent }]}>{pct}%</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={[styles.xpChip, { backgroundColor: world.light }]}>
                  <Text style={[styles.xpChipText, { color: world.dark }]}>
                    ⚡ {world.xpEarned} XP gagnés
                  </Text>
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
              <View style={[styles.xpChip, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                <Text style={[styles.xpChipText, { color: "#9ca3af" }]}>🔒 Verrouillé</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function WorldsScreen() {
  const router        = useRouter();
  const { userId }    = useUser();
  const [worlds,      setWorlds]    = useState<World[]>([]);
  const [userXp,      setUserXp]    = useState(0);
  const [loading,     setLoading]   = useState(true);
  const [activeNav,   setActiveNav] = useState("carte");
  const [soundOn,     setSoundOn]   = useState(false);

  const neonRef    = useRef<NeonBackgroundRef>(null);
  const soundRef   = useRef<Audio.Sound | null>(null);
  const headerY    = useRef(new Animated.Value(-30)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Touch → ripple bridge ────────────────────────────────────
  const handleScreenTouch = (e: GestureResponderEvent) => {
    const nx = e.nativeEvent.pageX / SW;
    const ny = e.nativeEvent.pageY / SH;
    neonRef.current?.sendRipple(nx, ny);
  };

  // ── Sound ────────────────────────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const toggleSound = useCallback(async () => {
    if (!soundOn) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/espace.mp3"),
          { isLooping: true, volume: 0.35 }
        );
        soundRef.current = sound;
        await sound.playAsync();
        setSoundOn(true);
      } catch (e) { console.warn("Sound error:", e); }
    } else {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setSoundOn(false);
    }
  }, [soundOn]);

  // ── Header anim ──────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,    { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Data ─────────────────────────────────────────────────────
  const loadWorlds = useCallback(async () => {
    console.log("userId au chargement:", userId);
    setLoading(true);
    try {
      // XP total de l'utilisateur
      const { data: userRow } = await supabase
        .from("users")
        .select("xp")
        .eq("id_user", userId)
        .single();
      setUserXp(userRow?.xp ?? 0);

      // Mondes
      const { data: worldsData } = await supabase
        .from("world")
        .select("id_world, nom, slug, image_url, accent_color, dark_color, light_color, ordre")
        .order("ordre", { ascending: true });

      if (!worldsData?.length) { setWorlds([]); return; }

      const worldIds = worldsData.map(w => w.id_world);

      // Zones
      const { data: allZones } = await supabase
        .from("zone")
        .select("id_zone, id_world")
        .in("id_world", worldIds);

      const zoneIds = (allZones ?? []).map(z => z.id_zone);

      // Progression zones
      const { data: allProgress } = zoneIds.length
        ? await supabase
            .from("zone_progress")
            .select("id_zone, unlocked")
            .eq("id_user", userId)
            .in("id_zone", zoneIds)
        : { data: [] };

      // Missions (pour lier mission → zone)
      const { data: allMissions } = await supabase
        .from("mission")
        .select("id_mission, id_zone, xp_gain")
        .in("id_zone", zoneIds);

      // Validations done (XP réellement gagné)
      const missionIds = (allMissions ?? []).map(m => m.id_mission);
      const { data: allValidations } = missionIds.length
        ? await supabase
            .from("mission_validation")
            .select("id_mission, xp_obtenu")
            .eq("id_user", userId)
            .eq("statut", "done")
            .in("id_mission", missionIds)
        : { data: [] };

      // Calculs
      const zonesByWorld: Record<number, number[]> = {};
      (allZones ?? []).forEach(z => {
        if (!zonesByWorld[z.id_world]) zonesByWorld[z.id_world] = [];
        zonesByWorld[z.id_world].push(z.id_zone);
      });

      const unlockedSet = new Set(
        (allProgress ?? []).filter(p => p.unlocked).map(p => p.id_zone)
      );

      // XP gagné par mission
      const xpByMission: Record<number, number> = {};
      (allValidations ?? []).forEach(v => {
        xpByMission[v.id_mission] = v.xp_obtenu ?? 0;
      });

      // XP gagné par zone
      const xpEarnedByZone: Record<number, number> = {};
      (allMissions ?? []).forEach(m => {
        if (xpByMission[m.id_mission] !== undefined) {
          xpEarnedByZone[m.id_zone] = (xpEarnedByZone[m.id_zone] ?? 0) + xpByMission[m.id_mission];
        }
      });

      const sortedWorlds = [...worldsData].sort((a, b) => a.ordre - b.ordre);

      const result: World[] = sortedWorlds.map((w, idx) => {
        const zIds     = zonesByWorld[w.id_world] ?? [];
        const unlocked = zIds.filter(id => unlockedSet.has(id)).length;
        const xpEarned = zIds.reduce((sum, id) => sum + (xpEarnedByZone[id] ?? 0), 0);

        let locked = false;
        if (idx > 0) {
          const prevZones = zonesByWorld[sortedWorlds[idx - 1].id_world] ?? [];
          locked = prevZones.filter(id => unlockedSet.has(id)).length < prevZones.length;
        }

        return {
          id_world:     w.id_world,
          nom:          w.nom,
          slug:         w.slug,
          subtitle:     WORLD_SUBTITLES[w.slug] ?? "",
          cover:        w.image_url,
          accent:       w.accent_color ?? "#22c55e",
          dark:         w.dark_color   ?? "#14532d",
          light:        w.light_color  ?? "#dcfce7",
          totalZones:   zIds.length,
          unlockedZones: unlocked,
          locked,
          xpEarned,
        };
      });

      setWorlds(result);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadWorlds(); }, [loadWorlds]);

  const STARS = [
    { top: 14, left: 16,  size: 14, delay: 0   },
    { top: 14, right: 20, size: 10, delay: 400  },
    { top: 60, right: 8,  size: 8,  delay: 700  },
    { top: 80, left: 40,  size: 6,  delay: 200  },
  ];

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleScreenTouch}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <NeonBackground ref={neonRef} />

      {STARS.map((s, i) => (
        <AnimStar key={i} size={s.size} delay={s.delay} style={{
          position: "absolute", zIndex: 2,
          ...(s.top   !== undefined ? { top:   s.top   } : {}),
          ...(s.left  !== undefined ? { left:  s.left  } : {}),
          ...(s.right !== undefined ? { right: s.right } : {}),
        }} />
      ))}

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={styles.headerTitle}>LES MONDES</Text>
          <Text style={styles.headerSub}>Explore et débloque de nouveaux univers</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.soundBtn, soundOn && styles.soundBtnOn]}
            onPress={toggleSound}
            activeOpacity={0.8}
          >
            <Ionicons
              name={soundOn ? "musical-notes" : "musical-notes-outline"}
              size={16}
              color={soundOn ? "#fff" : "#c4b5fd"}
            />
          </TouchableOpacity>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>⚡ {userXp} XP</Text>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {worlds.map((world, i) => (
            <WorldCard
              key={world.id_world}
              world={world}
              index={i}
              onPress={(w) => router.push({
                pathname: "/frontend/screens/WorldMapScreen",
                params: { worldSlug: w.slug },
              })}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <Navbar active={activeNav} onChange={setActiveNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#0d0620" },
  header:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16, zIndex: 5 },
  headerTitle:       { fontSize: 24, fontWeight: "900", color: "#ede9fe", letterSpacing: 0.8 },
  headerSub:         { fontSize: 12, color: "#a78bfa", fontWeight: "600", marginTop: 3 },
  headerRight:       { flexDirection: "row", alignItems: "center", gap: 8 },
  soundBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(167,139,250,0.12)", borderWidth: 1, borderColor: "rgba(167,139,250,0.4)", justifyContent: "center", alignItems: "center" },
  soundBtnOn:        { backgroundColor: "rgba(167,139,250,0.35)", borderColor: "#a78bfa" },
  xpBadge:           { backgroundColor: "rgba(127,90,240,0.85)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(196,181,253,0.3)" },
  xpBadgeText:       { color: "#fff", fontWeight: "800", fontSize: 13 },
  scroll:            { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  worldCard:         { backgroundColor: "rgba(15,8,40,0.75)", borderRadius: 24, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(167,139,250,0.2)", shadowColor: "#7f5af0", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  coverWrapper:      { height: 180, position: "relative" },
  coverImage:        { width: "100%", height: "100%" },
  coverOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,0,20,0.3)" },
  lockOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  lockCircle:        { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", borderWidth: 2 },
  zonesBadge:        { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  zonesBadgeText:    { color: "#fff", fontSize: 11, fontWeight: "700" },
  soundBadge:        { position: "absolute", top: 12, left: 12, width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  coverTitleWrapper: { position: "absolute", bottom: 14, left: 14, right: 14 },
  coverTitle:        { fontSize: 20, fontWeight: "900", color: "#fff", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  coverSubtitle:     { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 2 },
  cardBody:          { paddingHorizontal: 16, paddingVertical: 14 },
  progressRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  progressTrack:     { flex: 1, height: 8, backgroundColor: "rgba(167,139,250,0.15)", borderRadius: 8, overflow: "hidden" },
  progressFill:      { height: "100%", borderRadius: 8 },
  progressPct:       { fontSize: 12, fontWeight: "800", minWidth: 34, textAlign: "right" },
  cardFooter:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpChip:            { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  xpChipText:        { fontSize: 12, fontWeight: "700" },
  lockedHint:        { fontSize: 11, color: "#6b7280", fontWeight: "500", flex: 1, marginRight: 10, fontStyle: "italic" },
  exploreBtn:        { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  exploreBtnText:    { color: "#fff", fontWeight: "800", fontSize: 13 },
});