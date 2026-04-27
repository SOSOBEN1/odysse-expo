
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import { COLORS } from "../styles/theme";

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

      {/* BACK */}
      <BackButton />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Set Up Profile</Text>
        </View>
        <Text style={styles.subtitle}>Create Your Initial Profile To Get Started</Text>
      </View>

      {/* CARD */}
      <View style={[styles.card, { marginTop: 18 }]}>
        <Text style={styles.label}>Choose Avatar</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#2c2c54" />
          </View>
          {/* Bouton edit avatar → ouvre la sélection 3D */}
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
            colors={[COLORS.primary, COLORS.secondary, "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Continue"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stars */}
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  header: {
    marginBottom: 20,
    marginTop: 50,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 20,
    width: "100%",
    alignSelf: "center",
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
    color: COLORS.text,
  },

  avatarContainer: {
    alignItems: "center",
    marginVertical: 10,
    position: "relative",
    width: 80,
    alignSelf: "center",
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.iconBg,
    justifyContent: "center",
    alignItems: "center",
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonWrapper: {
    marginTop: 20,
  },

  button: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 7,
    width: 250,
    alignSelf: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  stars: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#baaae7",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 50,
  },

  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: "#333",
  },
});