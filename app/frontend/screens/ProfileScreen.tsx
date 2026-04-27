import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import AvatarCrd from "../components/AvatarCrd";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";

const AVATAR_MAP: Record<string, any> = {
  avatar_1: require("../assets/Avatar3D/fille1.glb"),
  avatar_2: require("../assets/Avatar3D/fille3Corrige.glb"),
  avatar_3: require("../assets/Avatar3D/garcon1.glb"),
  avatar_4: require("../assets/Avatar3D/garcon2.glb"),
  avatar_5: require("../assets/Avatar3D/garcon4.glb"),
};

interface StatCardProps  { emoji: string; value: number; label: string; }
interface BadgeItemProps { emoji: string; label: string; color: string; }
interface StarItem {
  top?: number; bottom?: number;
  left?: number; right?: number;
  size: number; opacity: number;
}

const BADGES: BadgeItemProps[] = [
  { label: "Maître de la\nTo-Do",   emoji: "📋", color: "#f9c74f" },
  { label: "Planificateur\nExpert", emoji: "⏰", color: "#90be6d" },
  { label: "Organisateur\nPro",     emoji: "📊", color: "#4cc9f0" },
  { label: "Journée\nProductive",   emoji: "☀️", color: "#f8961e" },
];

const stars: StarItem[] = [
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

function getLevelTitle(niveau: number): string {
  if (niveau <= 2)  return "Débutant curieux";
  if (niveau <= 5)  return "Explorateur de savoir";
  if (niveau <= 10) return "Apprenti maître";
  if (niveau <= 20) return "Expert confirmé";
  return "Maître légendaire";
}

function StatCard({ emoji, value, label }: StatCardProps) {
  return (
    <View style={statStyles.card}>
      <View style={statStyles.row}>
        <Text style={statStyles.emoji}>{emoji}</Text>
        <Text style={statStyles.value}>{value}</Text>
      </View>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card:  { width: "48%", backgroundColor: "#f0edff", borderRadius: 18, padding: 14, marginBottom: 10, minHeight: 78, justifyContent: "space-between" },
  row:   { flexDirection: "row", alignItems: "center", gap: 8 },
  emoji: { fontSize: 22 },
  value: { fontSize: 24, fontWeight: "900", color: "#2d1a6e" },
  label: { fontSize: 12, color: "#7f5af0", fontWeight: "600", marginTop: 4 },
});

function BadgeItem({ emoji, label, color }: BadgeItemProps) {
  return (
    <View style={badgeStyles.container}>
      <View style={[badgeStyles.iconBox, { backgroundColor: color + "33", borderColor: color + "55" }]}>
        <Text style={badgeStyles.emoji}>{emoji}</Text>
      </View>
      <Text style={badgeStyles.label}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: { alignItems: "center", width: 70 },
  iconBox:   { width: 60, height: 60, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 5, borderWidth: 1.5 },
  emoji:     { fontSize: 26 },
  label:     { fontSize: 9.5, color: "#5c3ca8", textAlign: "center", fontWeight: "600", lineHeight: 13 },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { selectedModel, setSelectedModel } = useAvatar();
  const { userId, username: ctxUsername, isLoading: ctxLoading } = useUser();

  const [userData, setUserData] = useState({
    username: "", prenom: "", nom: "",
    level: 1, levelTitle: "Explorateur de savoir",
    xp: 0, xpMax: 500, coins: 0,
    badges: BADGES.length, missions: 0, defis: 0,
  });
  const [fetching, setFetching] = useState(false);

  useFocusEffect(useCallback(() => {
    // ── On attend que AsyncStorage soit chargé ──
    if (ctxLoading) return;
    if (!userId) return;

    let cancelled = false;

    const fetchProfile = async () => {
      setFetching(true);
      try {
        const { data: user, error } = await supabase
          .from("users")
          .select("username, prenom, nom, xp, gold, id_level, avatar_url")
          .eq("id_user", userId)
          .single();

        if (cancelled) return;

        if (error || !user) {
          console.warn("Erreur fetch profil:", error?.message);
          return;
        }

        // ── Sync avatar : priorité AvatarContext déjà chargé,
        //    sinon on charge depuis Supabase ──────────────────
        const avatarKey = user.avatar_url ?? "avatar_1";
        if (AVATAR_MAP[avatarKey]) {
          // Toujours sync pour être sûr que c'est le bon avatar
          setSelectedModel(AVATAR_MAP[avatarKey]);
        } else if (!selectedModel) {
          // Fallback sur avatar_1 si rien de valide
          setSelectedModel(AVATAR_MAP["avatar_1"]);
        }

        const { count: missionsCount } = await supabase
          .from("mission")
          .select("id_mission", { count: "exact", head: true })
          .eq("statut", "done");

        if (cancelled) return;

        const niveau = user.id_level ?? 1;
        const xp     = user.xp      ?? 0;
        const maxXp  = niveau * 500;

        setUserData({
          username:   user.username ?? "",
          prenom:     user.prenom   ?? "",
          nom:        user.nom      ?? "",
          level:      niveau,
          levelTitle: getLevelTitle(niveau),
          xp:         xp % maxXp,
          xpMax:      maxXp,
          coins:      user.gold     ?? 0,
          badges:     BADGES.length,
          missions:   missionsCount ?? 0,
          defis:      0,
        });
      } catch (e) {
        console.warn("Erreur fetchProfile :", e);
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchProfile();

    // Cleanup pour éviter les setState sur composant démonté
    return () => { cancelled = true; };

  }, [userId, ctxLoading]));

  const xpPct = Math.min((userData.xp / userData.xpMax) * 100, 100);

  const displayName = userData.username
    || [userData.prenom, userData.nom].filter(Boolean).join(" ")
    || ctxUsername
    || "Joueur";

  // ── Loader ──
  if (ctxLoading || fetching) {
    return (
      <LinearGradient
        colors={["#ffffff", "#dcd2f9"]}
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator size="large" color="#7f5af0" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      <View style={styles.backBtnWrapper}>
        <BackButton />
      </View>

      <View style={styles.stars} pointerEvents="none">
        {stars.map((s, i) => (
          <MaterialIcons
            key={i} name="auto-awesome" size={s.size} color="#fff"
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar + Nom */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {selectedModel ? (
              <AvatarCrd model={selectedModel} bgColor="#f0ecff" />
            ) : (
              // Fallback : si selectedModel est encore null après le fetch,
              // on affiche l'icône personne
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={52} color="#7f5af0" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{displayName.toUpperCase()}</Text>
          <Text style={styles.userLevel}>
            Niveau {userData.level} – {userData.levelTitle}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.xpBox}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>XP : {userData.xp}/{userData.xpMax}</Text>
              <MaterialIcons name="auto-awesome" size={18} color="#7f5af0" />
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={["#7f5af0", "#bbaaff"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${xpPct}%` }]}
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard emoji="🪙" value={userData.coins}    label="Pièces d'or" />
            <StatCard emoji="🏆" value={userData.badges}   label="Badges" />
            <StatCard emoji="📋" value={userData.missions} label="Missions" />
            <StatCard emoji="🎯" value={userData.defis}    label="Défis" />
          </View>

          <Text style={styles.badgesTitle}>Badges gagnés</Text>
          <View style={styles.badgesRow}>
            {BADGES.map((b, i) => (
              <BadgeItem key={i} emoji={b.emoji} label={b.label} color={b.color} />
            ))}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() => router.push("/frontend/screens/EditProfileScreen")}
          >
            <LinearGradient
              colors={["#6949a8", "#9574e0", "#baaae7"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.editGradient}
            >
              <Text style={styles.editText}>Modifier profil</Text>
              <MaterialIcons name="auto-awesome" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Navbar active="profil" onChange={() => {}} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  backBtnWrapper: { position: "absolute", top: 54, left: 20, zIndex: 10 },
  stars:          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  scroll:         { paddingTop: 50, paddingBottom: 120, paddingHorizontal: 20 },
  avatarSection:  { alignItems: "center", marginTop: 70, marginBottom: 20 },
  avatarWrapper: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#7f5af0", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 14,
    elevation: 8, marginBottom: 14, overflow: "hidden",
  },
  avatarPlaceholder: {
    width: "100%", height: "100%",
    backgroundColor: "#f0ecff",
    justifyContent: "center", alignItems: "center",
  },
  userName:    { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 1.5, marginBottom: 4 },
  userLevel:   { fontSize: 13, color: "#9b87c9", fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 28, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
  },
  xpBox:       { backgroundColor: "#f0edff", borderRadius: 18, padding: 14, marginBottom: 16 },
  xpHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  xpLabel:     { fontSize: 14, fontWeight: "800", color: "#2d1a6e" },
  xpTrack:     { height: 10, backgroundColor: "#d1c4e9", borderRadius: 10, overflow: "hidden" },
  xpFill:      { height: "100%", borderRadius: 10 },
  statsGrid:   { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  badgesTitle: { fontSize: 16, fontWeight: "800", color: "#2d1a6e", textAlign: "center", marginBottom: 14, marginTop: 6 },
  badgesRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  editButton: {
    width: "100%", borderRadius: 15, overflow: "hidden", elevation: 7,
    shadowColor: "#6949a8", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  editGradient: { flexDirection: "row", paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  editText:     { color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.4 },
});