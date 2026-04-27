import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from "react-native";
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { setUserId } = useUser();

  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]            = useState("");
  const [password,        setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [loading,          setLoading]          = useState(false);

  const stars = [
    { top: 10,    left: 10,  size: 20, opacity: 0.6  },
    { top: 10,    right: 10, size: 12, opacity: 0.4  },
    { bottom: 10, left: 10,  size: 15, opacity: 0.5  },
    { bottom: 10, right: 10, size: 10, opacity: 0.35 },
  ];

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      Alert.alert("Erreur", "L'e-mail doit être une adresse Gmail valide (@gmail.com)");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const parts  = fullName.trim().split(" ");
      const nom    = parts[0];
      const prenom = parts.slice(1).join(" ") || "";

      // ✅ ETAPE 1 : Créer le compte dans Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({ email, password });

      if (authError) {
        Alert.alert("Erreur", authError.message);
        return;
      }

      // ✅ ETAPE 2 : Insérer dans la table users
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .insert([{
          nom,
          prenom,
          email,
          password,
          progression:   0,
          gold:          0,
          date_inscr:    new Date().toISOString().split("T")[0],
          dernier_login: new Date().toISOString(),
        }])
        .select("id_user")
        .single();

      if (dbError) {
        Alert.alert("Erreur", dbError.message);
        return;
      }

      // ✅ ETAPE 3 : Sauvegarder l'id dans le contexte
      setUserId(dbUser.id_user);

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      router.push("/frontend/screens/SetUpProfile");

    } catch (err) {
      Alert.alert("Erreur", "Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <WaveBackground />
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Inscrivez-vous pour commencer l'aventure</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nom complet</Text>
          <UsernameInput value={fullName} onChange={setFullName} placeholder="Entrez votre nom complet" icon="user" />

          <Text style={styles.label}>E-mail</Text>
          <UsernameInput value={email} onChange={setEmail} placeholder="nom@gmail.com" icon="mail" />

          <Text style={styles.label}>Mot de passe</Text>
          <UsernameInput value={password} onChange={setPassword} placeholder="Créez un mot de passe" icon="lock" secure />

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <UsernameInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Répétez le mot de passe" icon="lock" secure />
        </View>

        <TouchableOpacity style={styles.buttonWrapper} onPress={handleRegister} disabled={loading}>
          <LinearGradient
            colors={["#6949a8", "#9574e0", "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{loading ? "Création..." : "Créer mon compte"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.stars} pointerEvents="none">
        {stars.map((star, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={star.size}
            color="#fff"
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

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 15, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f1edff", justifyContent: "center",
    alignItems: "center", marginTop: 40, marginLeft: 15, elevation: 10,
  },
  header:   { marginTop: 10, marginBottom: 20 },
  title:    { fontSize: 28, fontWeight: "700", color: "#000" },
  subtitle: { marginTop: 8, fontSize: 14, color: "#6949a8", fontWeight: "bold" },
  card: {
    backgroundColor: "#fdfdff", borderRadius: 20,
    padding: 20, width: "100%", alignSelf: "center", opacity: 0.95,
  },
  label:         { fontSize: 16, fontWeight: "bold", marginBottom: 10, marginTop: 10, color: "#000" },
  buttonWrapper: { marginTop: 25 },
  button: {
    height: 50, borderRadius: 15, justifyContent: "center",
    alignItems: "center", elevation: 7, width: 240, alignSelf: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  stars:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});