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
} from "react-native";
import AvatarCrd from "../components/AvatarCrd";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";

// ── Avatars disponibles dans le sélecteur ──────────────────
const AVATAR_OPTIONS = [
  { id: 1, model: require("../assets/Avatar3D/fille1.glb") },
  { id: 2, model: require("../assets/Avatar3D/fille3Corrige.glb") },
  { id: 3, model: require("../assets/Avatar3D/garcon1.glb") },
  { id: 4, model: require("../assets/Avatar3D/garcon2.glb") },
  { id: 5, model: require("../assets/Avatar3D/garcon4.glb") },
];

const STAR_POSITIONS = [
  { top: 20,  left: 20,  size: 18, delay: 0 },
  { top: 15,  right: 30, size: 12, delay: 200 },
  { top: 55,  right: 12, size: 10, delay: 400 },
  { top: 80,  left: 60,  size: 8,  delay: 600 },
  { top: 38,  left: 180, size: 14, delay: 300 },
];

// ── Étoile animée ───────────────────────────────────────────
function AnimatedStar({ style, size, delay = 0 }) {
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

// ── Overlay succès ──────────────────────────────────────────
function SuccessOverlay({ visible, onDone }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const owlY      = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    owlY.setValue(60);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5,   useNativeDriver: true }),
      Animated.spring(owlY,      { toValue: 0, friction: 6,   useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        .start(() => onDone && onDone());
    }, 2200);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[overlayStyles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[overlayStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Hibou success — même composant AvatarCrd mais avec une image PNG */}
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
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  hibou:  { width: 120, height: 120 },
  title:  { fontSize: 20, fontWeight: "900", color: "#2d1a6e", marginTop: 10 },
  sub:    { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginTop: 4, textAlign: "center" },
});

// ── Écran principal ─────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { selectedModel, setSelectedModel } = useAvatar();

  const [username, setUsername]       = useState("SOSO BEN");
  const [pseudo, setPseudo]           = useState("SONIAbenazzouz@gmail.com");
  const [selectedAvatarId, setSelected] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Flottement hibou happy
  const hibouFloat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hibouFloat, { toValue: -10, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(hibouFloat, { toValue: 0,   duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSave = () => {
    const chosen = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId);
    if (chosen) setSelectedModel(chosen.model);
    setShowSuccess(true);
  };

  // Modèle actuellement affiché en grand (celui sélectionné ou le contexte)
  const previewModel = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId)?.model ?? selectedModel;

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
            position: "absolute",
            zIndex: 5,
            ...(s.top   !== undefined ? { top: s.top }     : {}),
            ...(s.left  !== undefined ? { left: s.left }   : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
          }}
        />
      ))}

      {/* Header */}
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
        {/* ── Avatar principal en grand ── */}
        <View style={styles.mainAvatarWrapper}>
          <View style={styles.mainAvatarCircle}>
            {previewModel ? (
              <AvatarCrd model={previewModel} bgColor="#f0edff" />
            ) : null}
          </View>
        </View>

        {/* ── Sélecteur miniatures .glb ── */}
        <View style={styles.avatarPickerCard}>
          <View style={styles.avatarPickerRow}>
            {AVATAR_OPTIONS.map((av) => (
              <TouchableOpacity
                key={av.id}
                onPress={() => setSelected(av.id)}
                style={[
                  styles.avatarThumb,
                  selectedAvatarId === av.id && styles.avatarThumbSelected,
                ]}
                activeOpacity={0.8}
              >
                {/* ✅ AvatarCrd avec le .glb directement */}
                <AvatarCrd model={av.model} bgColor="#e8e2ff" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bouton Changer Avatar → SetUpProfileScreen */}
          <TouchableOpacity
            style={styles.changeAvatarBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/setup-profile")}
          >
            <LinearGradient
              colors={["#7f5af0", "#bbaaff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.changeAvatarGradient}
            >
              <Text style={styles.changeAvatarText}>Changer Avatar</Text>
              <MaterialIcons name="auto-awesome" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Formulaire ── */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Username</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#c0b8e0"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Pseudo</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={pseudo}
              onChangeText={setPseudo}
              placeholderTextColor="#c0b8e0"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* ── Sauvegarder ── */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <LinearGradient
            colors={["#7f5af0", "#bbaaff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
            <MaterialIcons name="auto-awesome" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Hibou flottant ── */}
        <View style={styles.hibouSection}>
          <Animated.Image
            source={require("../assets/Hibou/happy.png")}
            style={[styles.hibouImage, { transform: [{ translateY: hibouFloat }] }]}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Overlay succès */}
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
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.3 },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
    alignItems: "center",
  },

  /* Avatar principal */
  mainAvatarWrapper: { alignItems: "center", marginBottom: 16 },
  mainAvatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "#f0edff",
    borderWidth: 3, borderColor: "#e0d9ff",
    overflow: "hidden",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 8,
  },

  /* Picker */
  avatarPickerCard: {
    width: "100%",
    backgroundColor: "#f0edff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  avatarPickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  avatarThumb: {
    width: 52, height: 52, borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  avatarThumbSelected: {
    borderColor: "#7f5af0",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },

  changeAvatarBtn: {
    borderRadius: 30, overflow: "hidden", width: "100%",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  changeAvatarGradient: {
    flexDirection: "row", paddingVertical: 13,
    alignItems: "center", justifyContent: "center",
  },
  changeAvatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  /* Formulaire */
  formCard: {
    width: "100%", backgroundColor: "#f0edff",
    borderRadius: 22, padding: 18, marginBottom: 16,
  },
  fieldLabel: { fontSize: 13, color: "#9b87c9", fontWeight: "700", marginBottom: 6 },
  inputBox: { backgroundColor: "#e8e2ff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontSize: 15, color: "#2d1a6e", fontWeight: "700" },

  /* Sauvegarder */
  saveBtn: {
    width: "100%", borderRadius: 30, overflow: "hidden", marginBottom: 20,
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  saveBtnGradient: {
    flexDirection: "row", paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },

  /* Hibou */
  hibouSection: { width: "100%", alignItems: "flex-start", marginTop: 10 },
  hibouImage: { width: 180, height: 160 },
}); 