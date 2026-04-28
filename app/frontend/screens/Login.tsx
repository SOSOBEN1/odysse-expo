import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import styles from "../styles/LoginStyle";

const AVATAR_MAP: Record<string, any> = {
  avatar_1: require("../assets/Avatar3D/fille1.glb"),
  avatar_2: require("../assets/Avatar3D/fille3Corrige.glb"),
  avatar_3: require("../assets/Avatar3D/garcon1.glb"),
  avatar_4: require("../assets/Avatar3D/garcon2.glb"),
  avatar_5: require("../assets/Avatar3D/garcon4.glb"),
};

export default function LoginScreen() {
  const router = useRouter();
  const { setUserId, setUsername } = useUser();
  const { setSelectedModel }       = useAvatar();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const stars = [
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id_user, avatar_url, username, prenom, nom")
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

      // ✅ Sync avatar
      const avatarKey = data.avatar_url ?? "avatar_1";
      if (AVATAR_MAP[avatarKey]) {
        setSelectedModel(AVATAR_MAP[avatarKey]);
      }

      // ✅ Sync userId + username dans contexte + AsyncStorage
      setUserId(data.id_user);
      setUsername(data.username ?? data.prenom ?? data.nom ?? "Joueur");

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

      <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/frontend/screens/start")}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}> Bienvenue</Text>
        </View>
        <Text style={styles.subtitle}>Poursuivez votre aventure</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <UsernameInput
          value={email} onChange={setEmail}
          placeholder="Enter Email Address" icon="mail"
        />

        <Text style={[styles.label, { marginTop: 15 }]}>Password</Text>
        <UsernameInput
          value={password} onChange={setPassword}
          placeholder="Enter Password" icon="lock" secure
        />

        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.remember} onPress={() => setRemember(!remember)}>
            <View style={[styles.checkbox, remember && styles.checkboxActive, { marginRight: 4 }]}>
              {remember && (
                <Feather name="check" size={12} color="#fff" style={{ alignSelf: "center" }} />
              )}
            </View>
            <Text style={styles.rememberText}>Se souvenir de moi</Text>
          </TouchableOpacity>
         <TouchableOpacity onPress={() => router.push("/frontend/screens/forget-password")}>
  <Text style={styles.forgot}>Mot de passe oublié?</Text>
</TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buttonWrapper} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={["#6949a8", "#9574e0", "#baaae7"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Connexion..." : "Se connecter"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 15 }}>
          <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
          <Link href="/frontend/screens/Register" style={[styles.registerLink, { textDecorationLine: "underline" }]}>
            S'inscrire
          </Link>
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome5 name="google" size={22} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome5 name="apple" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.stars, { pointerEvents: "none" }]}>
        {stars.map((star, i) => (
          <MaterialIcons
            key={i} name="auto-awesome" size={star.size} color="#fff"
            style={{
              position: "absolute",
              ...(star.top    !== undefined ? { top: star.top }       : {}),
              ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
              ...(star.left   !== undefined ? { left: star.left }     : {}),
              ...(star.right  !== undefined ? { right: star.right }   : {}),
              opacity: star.opacity,
            }}
          />
        ))}
      </View>
    </LinearGradient>
  );
}