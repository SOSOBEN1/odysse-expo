import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

export default function SetUpProfileScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const stars = [
    { top: 10, left: 10, size: 20, opacity: 0.6 },
    { top: 10, right: 10, size: 12, opacity: 0.4 },
    { bottom: 10, left: 10, size: 15, opacity: 0.5 },
    { bottom: 10, right: 10, size: 10, opacity: 0.35 },
    { top: 30, left: 50, size: 8, opacity: 0.25 },
    { bottom: 40, right: 60, size: 22, opacity: 0.7 },
    { top: 40, right: 50, size: 22, opacity: 0.7 },
    { top: 60, left: 150, size: 14, opacity: 0.45 },
    { bottom: 80, left: 16, size: 18, opacity: 0.55 },
  ];

const handleContinue = async () => {
  if (!username.trim()) {
    Alert.alert("Erreur", "Entre un nom d'utilisateur");
    return;
  }

  if (!userId) {
    Alert.alert("Erreur", "Session introuvable, recommence l'inscription");
    return;
  }

  setLoading(true);
  try {
    const { error } = await supabase
      .from("users")
      .update({ username: username.trim() })
      .eq("id_user", userId);

    if (error) {
      Alert.alert("Erreur", error.message);
      return;
    }

    // ✅ Maintenant on va aux questions
    router.push("/frontend/screens/QuestionInscription");
  } catch (err) {
    Alert.alert("Erreur", "Une erreur est survenue");
  } finally {
    setLoading(false);
  }
};

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Set Up Profile</Text>
        </View>
        <Text style={styles.subtitle}>Create Your Initial Profile To Get Started</Text>
      </View>

      <View style={[styles.card, { marginTop: 18 }]}>
        <Text style={styles.label}>Choose Avatar</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#2c2c54" />
          </View>
         // Bouton edit avatar → ouvre la sélection 3D
<TouchableOpacity
  style={styles.editIcon}
  onPress={() => router.push("/frontend/screens/SetupProfileScreen")}
>
  <Feather name="edit-2" size={14} color="#fff" />
</TouchableOpacity>
        </View>

        <Text style={styles.label}>Choose Username</Text>

        <UsernameInput
          value={username}
          onChange={setUsername}
          placeholder="Enter Username"
        />

        <TouchableOpacity style={styles.buttonWrapper} onPress={handleContinue} disabled={loading}>
          <LinearGradient
            colors={["#6949a8", "#9574e0", "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Continue"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={[styles.stars, { pointerEvents: "none" }]}>
        {stars.map((star, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={star.size}
            color="#fff"
            style={{
              position: "absolute",
              ...(star.top !== undefined ? { top: star.top } : {}),
              ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
              ...(star.left !== undefined ? { left: star.left } : {}),
              ...(star.right !== undefined ? { right: star.right } : {}),
              opacity: star.opacity,
            }}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: "absolute", top: 54, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#ffffffaa", justifyContent: "center",
    alignItems: "center", zIndex: 10,
  },
  header: { marginTop: 120, marginBottom: 15, paddingHorizontal: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", color: "#5c3ca8" },
  subtitle: { fontSize: 14, color: "#9b87c9" },
  card: {
    backgroundColor: "#fff", borderRadius: 28,
    padding: 20, marginHorizontal: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 6,
  },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 10, marginTop: 10, color: "#000" },
  avatarContainer: { alignItems: "center", marginVertical: 10, position: "relative", width: 80, alignSelf: "center" },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e8e0ff", justifyContent: "center", alignItems: "center",
  },
  editIcon: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: "#6949a8", borderRadius: 12,
    width: 24, height: 24, justifyContent: "center", alignItems: "center",
  },
  buttonWrapper: { marginTop: 20 },
  button: {
    height: 50, borderRadius: 15, justifyContent: "center",
    alignItems: "center", elevation: 7,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  stars: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
});