import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, LogOut, ShoppingBag } from "lucide-react-native";
import {
  ActivityIndicator,Alert, Animated, Easing, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, ViewStyle
} from "react-native";


import AvatarCrd from "../components/AvatarCrd";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { useUser } from "../constants/UserContext";
import { AVATAR_MAP, resolveAvatarModel } from "../constants/avatarMap";
import { supabase } from "../constants/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps  { emoji: string; value: number; label: string; }
interface BadgeItemProps { emoji: string; label: string; color: string; }
interface StarItem {
  top?: number; bottom?: number; left?: number; right?: number;
  size: number; opacity: number;
}
type AnimatedStarProps = { style: ViewStyle; size: number; delay?: number };

interface UserBadge {
  id_badge: number;
  nom:      string;
  emoji:    string;
  color:    string;
}

// ─── Mapping emoji/couleur par id_badge ───────────────────────────────────────
const BADGE_EMOJI: Record<number, string> = {
  1:  "👣",
  2:  "🔥",
  3:  "👁️",
  4:  "📋",
  5:  "🗂️",
  6:  "🎯",
  7:  "💪",
  8:  "😌",
  9:  "🧠",
  10: "🏃",
};

const BADGE_COLOR: Record<number, string> = {
  1:  "#f9c74f",
  2:  "#f8961e",
  3:  "#4cc9f0",
  4:  "#90be6d",
  5:  "#43aa8b",
  6:  "#7f5af0",
  7:  "#e63946",
  8:  "#06d6a0",
  9:  "#118ab2",
  10: "#ffd166",
};

// ─── Données statiques ────────────────────────────────────────────────────────
const STAR_POSITIONS = [
  { top: 20,  left: 20,  size: 18, delay: 0   },
  { top: 15,  right: 30, size: 12, delay: 200 },
  { top: 55,  right: 12, size: 10, delay: 400 },
  { top: 80,  left: 60,  size: 8,  delay: 600 },
  { top: 38,  left: 180, size: 14, delay: 300 },
];

// ─── AnimatedStar ─────────────────────────────────────────────────────────────
function AnimatedStar({ style, size, delay = 0 }: AnimatedStarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });
  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      <MaterialIcons name="auto-awesome" size={size} color="#fff" />
    </Animated.View>
  );
}


// ─── StatCard ─────────────────────────────────────────────────────────────────
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

// ─── BadgeItem ────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  if (niveau === 1)  return "Tu commences ton odyssée. Chaque mission te rapproche de la maîtrise.";
  if (niveau === 2)  return "La flamme est allumée. Continue, tu es sur la bonne voie !";
  if (niveau <= 4)   return "Tu explores de nouveaux horizons. Ton potentiel se révèle.";
  if (niveau <= 6)   return "Tu maîtrises les bases. Place à la discipline et à la régularité.";
  if (niveau <= 9)   return "Ton cerveau s'optimise. Tu penses et agis comme un stratège.";
  if (niveau <= 14)  return "L'excellence devient une habitude. Tu es une référence.";
  if (niveau <= 19)  return "Tu domines l'odyssée. Peu atteignent ce niveau de maîtrise.";
  if (niveau <= 29)  return "Vétéran aguerri. Ton parcours inspire ceux qui commencent.";
  if (niveau <= 39)  return "Tu fais partie de l'élite. La légende se construit mission par mission.";
  return "Au sommet. Tu es une légende vivante de l'odyssée. ✨";
}

// ─── SCREEN ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const handleLogout = () => {
  Alert.alert(
    "Déconnexion",
    "Tu veux vraiment te déconnecter ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/");
        },
      },
    ]
  );
};
  const router = useRouter();
  const { setSelectedModel } = useAvatar();
  const { userId, username: ctxUsername, isLoading: ctxLoading } = useUser();

  const [avatarKey, setAvatarKey] = useState("avatar_1");
  const [loading,   setLoading]   = useState(true);
  const [badges,    setBadges]    = useState<UserBadge[]>([]);
  const [userData,  setUserData]  = useState({
    username: "", prenom: "", nom: "",
    level: 1, levelTitle: "Explorateur de savoir",
    xp: 0, xpMax: 500, coins: 0,
    badgeCount: 0, missions: 0, defis: 0,
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data: user, error } = await supabase
          .from("users")
          .select("username, prenom, nom, xp, gold, id_level, avatar_url")
          .eq("id_user", userId)
          .single();

        if (error || !user) {
          console.warn("Erreur fetch profil:", error?.message);
          return;
        }

        const key = user.avatar_url && AVATAR_MAP[user.avatar_url]
          ? user.avatar_url
          : "avatar_1";

        setAvatarKey(key);
        setSelectedModel(resolveAvatarModel(key));

        // ── Fetch counts ──────────────────────────────────────────────────────
        const [
          { count: missionsCount },
          { count: defisCount },
          { count: badgesCount },
        ] = await Promise.all([
          supabase.from("mission_validation").select("id_validation", { count: "exact", head: true }).eq("id_user", userId),
          supabase.from("defi_participants").select("id_defi",        { count: "exact", head: true }).eq("id_user", userId),
          supabase.from("user_badges").select("id_badge",             { count: "exact", head: true }).eq("id_user", userId),
        ]);

        // ── Fetch badges réels avec jointure ──────────────────────────────────
        const { data: userBadgesData, error: badgeError } = await supabase
          .from("user_badges")
          .select(`
            id_badge,
            badges ( nom )
          `)
          .eq("id_user", userId)
          .order("date_obtention", { ascending: false })
          .limit(4);

        if (badgeError) {
          console.warn("Erreur fetch badges:", badgeError.message);
        }

        const mappedBadges: UserBadge[] = (userBadgesData ?? []).map((row: any) => ({
          id_badge: row.id_badge,
          nom:      row.badges?.nom ?? "Badge",
          emoji:    BADGE_EMOJI[row.id_badge]  ?? "🏅",
          color:    BADGE_COLOR[row.id_badge]  ?? "#9b87c9",
        }));

        setBadges(mappedBadges);

        // ── XP / niveau ───────────────────────────────────────────────────────
        const xpTotal      = user.xp ?? 0;
        const niveau       = Math.floor(xpTotal / 500) + 1;
        const xpDansNiveau = xpTotal % 500;
        const maxXp        = 500;

        setUserData({
          username:   user.username ?? "",
          prenom:     user.prenom   ?? "",
          nom:        user.nom      ?? "",
          level:      niveau,
          levelTitle: getLevelTitle(niveau),
          xp:         xpDansNiveau,
          xpMax:      maxXp,
          coins:      user.gold     ?? 0,
          badgeCount: badgesCount   ?? 0,
          missions:   missionsCount ?? 0,
          defis:      defisCount    ?? 0,
        });

      } catch (e) {
        console.warn("Erreur loadProfile :", e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  // ── Refresh avatar au focus ───────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!userId || ctxLoading) return;
      const refresh = async () => {
        const { data: user } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id_user", userId)
          .single();
        if (user?.avatar_url && AVATAR_MAP[user.avatar_url]) {
          setAvatarKey(user.avatar_url);
          setSelectedModel(resolveAvatarModel(user.avatar_url));
        }
      };
      refresh();
    }, [userId, ctxLoading])
  );

  const xpPct = Math.min((userData.xp / userData.xpMax) * 100, 100);
  const displayName =
    userData.username ||
    [userData.prenom, userData.nom].filter(Boolean).join(" ") ||
    ctxUsername ||
    "Joueur";

  if (loading || ctxLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#7f5af0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={StyleSheet.absoluteFill} />
      <WaveBackground />

      {/* Étoiles animées */}
      {STAR_POSITIONS.map((s, i) => (
        <AnimatedStar
          key={i}
          size={s.size}
          delay={s.delay}
          style={{
            position: "absolute", zIndex: 5,
            ...(s.top   !== undefined ? { top: s.top }     : {}),
            ...(s.left  !== undefined ? { left: s.left }   : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
          }}
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <View style={styles.mainAvatarWrapper}>
          <View style={styles.mainAvatarCircle}>
            <AvatarCrd model={resolveAvatarModel(avatarKey)} bgColor="#f0edff" />
          </View>
        </View>

        {/* Nom + niveau */}
        <Text style={styles.userName}>{displayName.toUpperCase()}</Text>
        <Text style={styles.userLevel}>Niveau {userData.level} – {userData.levelTitle}</Text>
        <Text style={styles.levelDesc}>{getLevelDescription(userData.level)}</Text>

        {/* Card principale */}
        <View style={styles.card}>

          {/* Barre XP */}
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

          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard emoji="🪙" value={userData.coins}      label="Pièces d'or" />
            <StatCard emoji="🏆" value={userData.badgeCount} label="Badges"      />
            <StatCard emoji="📋" value={userData.missions}   label="Missions"    />
            <StatCard emoji="🎯" value={userData.defis}      label="Défis"       />
          </View>

          {/* Badges */}
          <Text style={styles.badgesTitle}>
            Badges gagnés {userData.badgeCount > 0 ? `(${userData.badgeCount})` : ""}
          </Text>

          {badges.length === 0 ? (
            <Text style={styles.badgesEmpty}>
              Aucun badge encore 🎯 Complète des missions pour en gagner !
            </Text>
          ) : (
            <View style={styles.badgesRow}>
              {badges.map((b) => (
                <BadgeItem
                  key={b.id_badge}
                  emoji={b.emoji}
                  label={b.nom}
                  color={b.color}
                />
              ))}
            </View>
          )}

{/* Bouton modifier profil */}
<TouchableOpacity
  style={styles.editButton}
  onPress={() => router.push("/frontend/screens/EditProfileScreen")}
  activeOpacity={0.85}
>
  <LinearGradient
    colors={["#7f5af0", "#9b87c9"]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={styles.editGradient}
  >
    <Pencil size={18} color="#fff" style={{ marginRight: 8 }} />
    <Text style={styles.editText}>Modifier le profil</Text>
  </LinearGradient>
</TouchableOpacity>

{/* Bouton déconnexion */}
<TouchableOpacity
  style={styles.logoutButton}
  onPress={handleLogout}
  activeOpacity={0.85}
>
  <LogOut size={18} color="#fff" style={{ marginRight: 8 }} />
  <Text style={styles.logoutText}>Se déconnecter</Text>
</TouchableOpacity>

        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Navbar active="profil" onChange={() => {}} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 10,
    zIndex: 10,
  },
 logoutButton: {
  width: "100%",
  borderRadius: 15,
  paddingVertical: 15,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#c0392b",  // rouge sombre, pas flashy
  marginTop: 10,
  elevation: 3,
  shadowColor: "#7b241c",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
},
logoutText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  letterSpacing: 0.4,
},


  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
    alignItems: "center",
  },

  mainAvatarWrapper: { alignItems: "center", marginBottom: 8 },
  mainAvatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#e0d9ff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  userName:    { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 1.5, marginBottom: 4, textAlign: "center" },
  userLevel:   { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginBottom: 6, textAlign: "center" },
  levelDesc:   { fontSize: 11, color: "#a78bca", fontStyle: "italic", textAlign: "center", marginBottom: 16, paddingHorizontal: 24, lineHeight: 16 },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  xpBox:    { backgroundColor: "#f0edff", borderRadius: 18, padding: 14, marginBottom: 16 },
  xpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  xpLabel:  { fontSize: 14, fontWeight: "800", color: "#2d1a6e" },
  xpTrack:  { height: 10, backgroundColor: "#d1c4e9", borderRadius: 10, overflow: "hidden" },
  xpFill:   { height: "100%", borderRadius: 10 },

  statsGrid:   { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
  badgesTitle: { fontSize: 16, fontWeight: "800", color: "#2d1a6e", textAlign: "center", marginBottom: 14, marginTop: 6 },
  badgesEmpty: { fontSize: 12, color: "#9b87c9", textAlign: "center", marginBottom: 20, fontStyle: "italic" },
  badgesRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 },

  editButton:   { width: "100%", borderRadius: 15, overflow: "hidden", elevation: 7, shadowColor: "#6949a8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  editGradient: { flexDirection: "row", paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  editText:     { color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.4 },
});