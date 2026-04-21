
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import { COLORS } from "../styles/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { setUserId } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id_user")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (error || !data) {
        Alert.alert("Erreur", "Email ou mot de passe incorrect");
        return;
      }

      await supabase
        .from("users")
        .update({ dernier_login: new Date().toISOString() })
        .eq("id_user", data.id_user);

      setUserId(data.id_user);

      router.push("/frontend/screens/QuestionPeriodicScreen");
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
      <BackButton onPress={() => router.push("/frontend/screens/start")} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}> Welcome</Text>
        </View>
        <Text style={styles.subtitle}>Let's continue your journey</Text>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <UsernameInput
          value={email}
          onChange={setEmail}
          placeholder="Enter Email Address"
          icon="mail"
        />

        <Text style={[styles.label, { marginTop: 15 }]}>Password</Text>
        <UsernameInput
          value={password}
          onChange={setPassword}
          placeholder="Enter Password"
          icon="lock"
          secure
        />

        {/* Options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.remember} onPress={() => setRemember(!remember)}>
            <View style={[styles.checkbox, remember && styles.checkboxActive, { marginRight: 4 }]}>
              {remember && (
                <Feather name="check" size={12} color="#fff" style={{ alignSelf: "center" }} />
              )}
            </View>
            <Text style={styles.rememberText}>Remember Password</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary, "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Connexion..." : "Sign In"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Register */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 15 }}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Link
            href="/frontend/screens/Register"
            style={[styles.registerLink, { textDecorationLine: "underline" }]}
          >
            Register Now
          </Link>
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome5 name="google" size={22} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome5 name="apple" size={22} color="#000" />
          </TouchableOpacity>
        </View>
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
    marginTop: 40,
    marginBottom: 20,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 20,
    marginTop: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
  },

  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },

  remember: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#aaa",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  checkboxActive: {
    backgroundColor: "#0043a7",
    borderColor: "#0043a7",
  },

  rememberText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "bold",
  },

  forgot: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "bold",
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

  registerText: {
    fontSize: 13,
    textAlign: "center",
    color: COLORS.text,
  },

  registerLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },

  socialBtn: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  stars: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});