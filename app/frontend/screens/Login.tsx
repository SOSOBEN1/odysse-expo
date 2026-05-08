import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import styles from "../styles/LoginStyle";

WebBrowser.maybeCompleteAuthSession();

const AVATAR_MAP: Record<string, any> = {
  avatar_1: require("../assets/Avatar3D/fille1.glb"),
  avatar_2: require("../assets/Avatar3D/fille3Corrige.glb"),
  avatar_3: require("../assets/Avatar3D/garcon1.glb"),
  avatar_4: require("../assets/Avatar3D/garcon2.glb"),
  avatar_5: require("../assets/Avatar3D/garcon4.glb"),
};

const INTERVAL_MS         = 12 * 60 * 60 * 1000;
const SECURE_EMAIL_KEY    = "remember_email";
const SECURE_REMEMBER_KEY = "remember_me";
const SECURE_PASSWORD_KEY = "remember_password";

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

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedRemember = await SecureStore.getItemAsync(SECURE_REMEMBER_KEY);
        if (savedRemember === "true") {
          const savedEmail    = await SecureStore.getItemAsync(SECURE_EMAIL_KEY);
          const savedPassword = await SecureStore.getItemAsync(SECURE_PASSWORD_KEY);
          if (savedEmail)    setEmail(savedEmail);
          if (savedPassword) setPassword(savedPassword);
          setRemember(true);
        }
      } catch (e) {
        console.warn("Erreur chargement remember me:", e);
      }
    };
    loadSaved();
  }, []);

  const handleRememberToggle = async () => {
    const newValue = !remember;
    setRemember(newValue);
    if (!newValue) {
      try {
        await SecureStore.deleteItemAsync(SECURE_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SECURE_REMEMBER_KEY);
        await SecureStore.deleteItemAsync(SECURE_PASSWORD_KEY);
      } catch (e) {
        console.warn("Erreur suppression remember me:", e);
      }
    }
  };

  // ── Sync profil après OAuth ──
  const syncProfileAndRedirect = async (authUserId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id_user, avatar_url, username, prenom, nom")
      .eq("auth_id", authUserId)
      .single();

    if (error || !data) {
      Alert.alert("Erreur Profil", error?.message ?? "data null");
      return;
    }

    await supabase
      .from("users")
      .update({ dernier_login: new Date().toISOString() })
      .eq("auth_id", authUserId);

    const avatarKey = data.avatar_url ?? "avatar_1";
    if (AVATAR_MAP[avatarKey]) setSelectedModel(AVATAR_MAP[avatarKey]);

    setUserId(data.id_user);
    setUsername(data.username ?? data.prenom ?? data.nom ?? "Joueur");

    const { data: statsData } = await supabase
      .from("player_stats")
      .select("last_periodic_questionnaire")
      .eq("id_user", Number(data.id_user))
      .maybeSingle();

    const lastShown = statsData?.last_periodic_questionnaire;
    const needsQuestionnaire =
      !lastShown || Date.now() - new Date(lastShown).getTime() >= INTERVAL_MS;

    if (needsQuestionnaire) {
      router.push("/frontend/screens/QuestionPeriodicScreen");
    } else {
      router.push("/frontend/screens/Dashbord");
    }
  };

  // ── Connexion email/password ──
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        Alert.alert("Erreur Auth", authError?.message ?? "user null");
        return;
      }

      if (remember) {
        try {
          await SecureStore.setItemAsync(SECURE_EMAIL_KEY,    email);
          await SecureStore.setItemAsync(SECURE_REMEMBER_KEY, "true");
          await SecureStore.setItemAsync(SECURE_PASSWORD_KEY, password);
        } catch (e) {
          console.warn("Erreur sauvegarde remember me:", e);
        }
      } else {
        try {
          await SecureStore.deleteItemAsync(SECURE_EMAIL_KEY);
          await SecureStore.deleteItemAsync(SECURE_REMEMBER_KEY);
          await SecureStore.deleteItemAsync(SECURE_PASSWORD_KEY);
        } catch (_) {}
      }

      await syncProfileAndRedirect(authData.user.id);
    } catch (err) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // ── Connexion Google OAuth ──
  const handleGoogleLogin = async () => {
  try {
    // Construis l'URL proxy manuellement
const redirectUrl = "https://auth.expo.io/@aminatoun/odysse";    // ↑ Remplace par ton vrai username Expo et le slug de app.json

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error || !data?.url) {
      Alert.alert("Erreur Google", error?.message ?? "URL manquante");
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log("RESULT TYPE:", result.type);
    console.log("RESULT URL:", result.url);

    if (result.type !== "success" || !result.url) {
      Alert.alert("Annulé", "Connexion Google annulée");
      return;
    }

    const hashPart = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
    const params = Object.fromEntries(new URLSearchParams(hashPart));

    if (params.access_token && params.refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (sessionError || !sessionData.session?.user) {
        Alert.alert("Erreur", "Impossible d'établir la session");
        return;
      }

      await syncProfileAndRedirect(sessionData.session.user.id);
    } else {
      await new Promise(r => setTimeout(r, 1000));
      const { data: fallback } = await supabase.auth.getSession();
      if (fallback.session?.user) {
        await syncProfileAndRedirect(fallback.session.user.id);
      } else {
        Alert.alert("Erreur", "Session introuvable");
      }
    }

  } catch (err) {
    Alert.alert("Erreur", "Connexion Google échouée");
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
          <TouchableOpacity style={styles.remember} onPress={handleRememberToggle}>
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
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
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