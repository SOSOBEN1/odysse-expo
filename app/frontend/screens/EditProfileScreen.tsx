import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import AvatarCrd from "../components/AvatarCrd";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";
import { AVATAR_MAP, resolveAvatarModel } from "../constants/avatarMap";
import { useSounds } from "../hooks/useSounds";

const BASE_AVATARS_BY_GENDER: Record<"Feminin" | "Masculin", string[]> = {
  Feminin: ["avatar_1", "avatar_2"],
  Masculin: ["avatar_3", "avatar_4", "avatar_5"],
};

const BOUTIQUE_AVATAR_GENDER: Record<string, "Feminin" | "Masculin"> = {
  avatar_boutique_f_1: "Feminin",
  avatar_boutique_f_2: "Feminin",
  avatar_boutique_f_3: "Feminin",
  avatar_boutique_f_4: "Feminin",
  avatar_boutique_f_5: "Feminin",
  avatar_boutique_f_6: "Feminin",
  avatar_boutique_f_7: "Feminin",
  avatar_boutique_f_8: "Feminin",
  avatar_boutique_f_9: "Feminin",
  avatar_boutique_m_1: "Masculin",
  avatar_boutique_m_2: "Masculin",
  avatar_boutique_m_3: "Masculin",
  avatar_boutique_m_4: "Masculin",
  avatar_boutique_m_5: "Masculin",
  avatar_boutique_m_6: "Masculin",
  avatar_boutique_m_7: "Masculin",
  avatar_boutique_m_8: "Masculin",
};

const BOUTIQUE_ITEM_MAP: Record<string, number> = {
  avatar_boutique_f_1: 1,
  avatar_boutique_f_2: 2,
  avatar_boutique_f_3: 3,
  avatar_boutique_f_4: 4,
  avatar_boutique_f_5: 5,
  avatar_boutique_f_6: 6,
  avatar_boutique_f_7: 7,
  avatar_boutique_f_8: 8,
  avatar_boutique_f_9: 9,
  avatar_boutique_m_1: 10,
  avatar_boutique_m_2: 11,
  avatar_boutique_m_3: 12,
  avatar_boutique_m_4: 13,
  avatar_boutique_m_5: 14,
  avatar_boutique_m_6: 15,
  avatar_boutique_m_7: 16,
  avatar_boutique_m_8: 17,
  avatar_boutique_m_9: 18,
};

const STAR_POSITIONS = [
  { top: 20, left: 20, size: 18, delay: 0 },
  { top: 15, right: 30, size: 12, delay: 200 },
  { top: 55, right: 12, size: 10, delay: 400 },
  { top: 80, left: 60, size: 8, delay: 600 },
  { top: 38, left: 180, size: 14, delay: 300 },
];

type AnimatedStarProps = { style: ViewStyle; size: number; delay?: number };
type SuccessOverlayProps = { visible: boolean; onDone: () => void };

function AnimatedStar({ style, size, delay = 0 }: AnimatedStarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim, delay]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      <MaterialIcons name="auto-awesome" size={size} color="#fff" />
    </Animated.View>
  );
}

function SuccessOverlay({ visible, onDone }: SuccessOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const owlY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (!visible) return;

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    owlY.setValue(60);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.spring(owlY, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => onDone());
    }, 2200);

    return () => clearTimeout(t);
  }, [visible, fadeAnim, scaleAnim, owlY, onDone]);

  if (!visible) return null;

  return (
    <Animated.View style={[overlayStyles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[overlayStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.Image
          source={require("../assets/Hibou/success.png")}
          style={[overlayStyles.hibou, { transform: [{ translateY: owlY }] }]}
          resizeMode="contain"
        />
        <MaterialIcons name="auto-awesome" size={28} color="#f9c74f" style={{ marginTop: 8 }} />
        <Text style={overlayStyles.title}>Profil sauvegardé !</Text>
        <Text style={overlayStyles.sub}>Tes modifications ont été enregistrées</Text>
      </Animated.View>
    </Animated.View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(108,63,203,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: 260,
    shadowColor: "#6949a8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  hibou: { width: 120, height: 120 },
  title: { fontSize: 20, fontWeight: "900", color: "#5c3ca8", marginTop: 10 },
  sub: { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginTop: 4, textAlign: "center" },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const { setSelectedModel } = useAvatar();
  const { userId, gender } = useUser();
 const { playSound } = useSounds();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [avatarKey, setAvatarKey] = useState("avatar_1");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownedBoutiqueKeys, setOwnedBoutiqueKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("users")
          .select("username, email, nom, prenom, avatar_url")
          .eq("id_user", userId)
          .single();

        if (error || !data) {
          console.warn("Erreur chargement profil :", error?.message);
          return;
        }

        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setNom(data.nom ?? "");
        setPrenom(data.prenom ?? "");
        setAvatarKey(data.avatar_url ?? "avatar_1");

        const { data: ownedItems } = await supabase
          .from("user_items")
          .select("id_item")
          .eq("id_user", userId);

        const ownedItemIds = new Set((ownedItems ?? []).map((i: any) => i.id_item));
        const owned = new Set(
          Object.entries(BOUTIQUE_ITEM_MAP)
            .filter(([, itemId]) => ownedItemIds.has(itemId))
            .map(([key]) => key)
        );

        setOwnedBoutiqueKeys(owned);
      } catch (e) {
        console.warn("Erreur chargement profil :", e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const hibouFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hibouFloat, {
          toValue: -10,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hibouFloat, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [hibouFloat]);

  const visibleAvatarOptions = [
    ...(gender ? BASE_AVATARS_BY_GENDER[gender as "Feminin" | "Masculin"] : []),
    ...Object.keys(BOUTIQUE_AVATAR_GENDER).filter(
      (key) => BOUTIQUE_AVATAR_GENDER[key] === gender && ownedBoutiqueKeys.has(key)
    ),
  ].map((key) => ({ key }));

  const handleSave = async () => {
    if (!userId) return;

    if (!username.trim() || username.trim().length < 3) {
      setError("Le username doit contenir au moins 3 caractères");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          nom: nom.trim(),
          prenom: prenom.trim(),
          avatar_url: avatarKey,
        })
        .eq("id_user", userId);

      if (updateError) {
        if (updateError.message.includes("unique") || updateError.message.includes("duplicate")) {
          setError("Ce username est déjà pris, choisis-en un autre");
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSelectedModel(resolveAvatarModel(avatarKey));
      playSound("changerMDP"); // 🔊
      setShowSuccess(true);
    } catch {
      setError("Une erreur inattendue est survenue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={StyleSheet.absoluteFill} />
        <Text style={{ color: "#6949a8", fontWeight: "bold", fontSize: 16 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={StyleSheet.absoluteFill} />
      <WaveBackground />

      {STAR_POSITIONS.map((s, i) => (
        <AnimatedStar
          key={i}
          size={s.size}
          delay={s.delay}
          style={{
            position: "absolute",
            zIndex: 5,
            ...(s.top !== undefined ? { top: s.top } : {}),
            ...(s.left !== undefined ? { left: s.left } : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
          }}
        />
      ))}

      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Modifier profil</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainAvatarWrapper}>
          <View style={styles.mainAvatarCircle}>
            <AvatarCrd model={resolveAvatarModel(avatarKey)} bgColor="#f0edff" />
          </View>
        </View>

        <View style={styles.avatarPickerCard}>
          <Text style={styles.sectionTitle}>Choisir un avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPickerRow}>
            {visibleAvatarOptions.map((av) => (
              <TouchableOpacity
                key={av.key}
                onPress={() => setAvatarKey(av.key)}
                style={[styles.avatarThumb, avatarKey === av.key && styles.avatarThumbSelected]}
                activeOpacity={0.8}
              >
                <AvatarCrd model={AVATAR_MAP[av.key]} bgColor="#e8e2ff" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Username</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                setError(null);
              }}
              placeholderTextColor="#c0b8e0"
              placeholder="Ton username"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Prénom</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={(v) => {
                setPrenom(v);
                setError(null);
              }}
              placeholderTextColor="#c0b8e0"
              placeholder="Ton prénom"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Nom</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={(v) => {
                setNom(v);
                setError(null);
              }}
              placeholderTextColor="#c0b8e0"
              placeholder="Ton nom"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email</Text>
          <View style={[styles.inputBox, { opacity: 0.5 }]}>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
              placeholderTextColor="#c0b8e0"
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={["#6949a8", "#9574e0", "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Text>
            <MaterialIcons name="auto-awesome" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.hibouSection}>
          <Animated.Image
            source={require("../assets/Hibou/happy.png")}
            style={[styles.hibouImage, { transform: [{ translateY: hibouFloat }] }]}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <SuccessOverlay visible={showSuccess} onDone={() => setShowSuccess(false)} />
      <Navbar active="profil" onChange={() => {}} />
    </View>
  );
}

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
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#5c3ca8", letterSpacing: 0.3 },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120, alignItems: "center" },
  mainAvatarWrapper: { alignItems: "center", marginBottom: 16 },
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
  avatarPickerCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#5c3ca8", marginBottom: 14 },
  avatarPickerRow: { flexDirection: "row", gap: 10, paddingHorizontal: 4 },
  avatarThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  avatarThumbSelected: { borderColor: "#6949a8" },
  formCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  fieldLabel: { fontSize: 16, color: "#000", fontWeight: "bold", marginBottom: 10 },
  inputBox: {
    backgroundColor: "#f8f7ff",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ece8ff",
  },
  input: { fontSize: 15, color: "#2d1a6e", fontWeight: "600" },
  errorText: {
    color: "#e05c5c",
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  saveBtn: {
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 7,
    shadowColor: "#6949a8",
    shadowOpacity: 0.3,
  },
  saveBtnGradient: { flexDirection: "row", paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.4 },
  hibouSection: { width: "100%", alignItems: "flex-start", marginTop: 10 },
  hibouImage: { width: 180, height: 160 },
});