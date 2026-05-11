import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
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
      const redirectUrl = "https://auth.expo.io/@aminatoun/odysse";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });

      if (error || !data?.url) {
        Alert.alert("Erreur Google", error?.message ?? "URL manquante");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== "success" || !("url" in result) || !result.url) {
        Alert.alert("Annulé", "Connexion Google annulée");
        return;
      }

      const hashPart = (result as { type: "success"; url: string }).url.split("#")[1]
        ?? (result as { type: "success"; url: string }).url.split("?")[1]
        ?? "";
      const params   = Object.fromEntries(new URLSearchParams(hashPart));

      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token:  params.access_token,
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
          validate={(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
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

        {/* ── Séparateur ── */}
        <View style={localStyles.separator}>
          <View style={localStyles.line} />
          <Text style={localStyles.orText}>ou</Text>
          <View style={localStyles.line} />
        </View>

        {/* ── Bouton Google ── */}
        <TouchableOpacity style={localStyles.googleBtn} onPress={handleGoogleLogin}>
          <Svg width={20} height={20} viewBox="0 0 48 48">
            <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </Svg>
          <Text style={localStyles.googleBtnText}>Continuer avec Google</Text>
        </TouchableOpacity>
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

const localStyles = StyleSheet.create({
  separator:     { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  line:          { flex: 1, height: 1, backgroundColor: "#e9d5ff" },
  orText:        { fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  googleBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  googleBtnText: { fontSize: 14, fontWeight: "700", color: "#374151" },
});