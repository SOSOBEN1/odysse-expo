
// screens/NewPassword.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNewPasswordViewModel } from "../../../backend/viewmodels/useNewPasswordViewModel";
import { useSounds } from "../hooks/useSounds";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";

const { width } = Dimensions.get("window");

const Wave = () => (
  <Svg
    height={220}
    width={width}
    viewBox={`0 0 ${width} 220`}
    style={styles.waveSvg}
  >
    <Path
      d={`M0 0 H${width} V140 C ${width * 0.75} 200 ${width * 0.25} 80 0 140 Z`}
      fill="#dcd3ff"
    />
  </Svg>
);

const NewPassword = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    password,
    confirmPassword,
    strength,
    loading,
    error,
    strengthColors,
    strengthLabel,
    handlePasswordChange,
    setConfirmPassword,
    submit,
  } = useNewPasswordViewModel(userId ?? "");

  const { playSound } = useSounds();

  const handleSubmit = async () => {
    const ok = await submit();
    if (ok) {
      await playSound("changerMDP");
      router.replace("/frontend/screens/Login");
    }
  };

  return (
    <LinearGradient colors={["#cfc3ff", "#f5f0ff"]} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#5c3ca8" />
      </TouchableOpacity>

      <Wave />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topIcon}>
            <Ionicons name="checkmark" size={28} color="#fff" />
          </View>

          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            Votre nouveau mot de passe doit être différent des précédents.
          </Text>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nouveau mot de passe */}
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Entrez un mot de passe"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmer mot de passe */}
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmez le mot de passe"
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            {/* Barre de force */}
            <View style={styles.strengthRow}>
              <Text style={styles.strengthLabel}>Force du mot de passe</Text>
              {strength > 0 && (
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: strengthColors[strength - 1], fontWeight: "700" },
                  ]}
                >
                  {strengthLabel}
                </Text>
              )}
            </View>
            <View style={styles.strengthBarContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        index < strength ? strengthColors[index] : "#eaeaea",
                    },
                  ]}
                />
              ))}
            </View>

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={["#7f5af0", "#bbaaff"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Mise à jour..." : "Mettre à jour"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SIZES.padding,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#ffffffaa",
    padding: 8,
    borderRadius: SIZES.radius,
    zIndex: 10,
  },
  waveSvg: { position: "absolute", top: 0 },
  topIcon: {
    alignSelf: "center",
    backgroundColor: COLORS.secondary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 60,
    ...SHADOWS.light,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 25,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.light,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  label: { color: "#555", marginBottom: 5, marginTop: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  eyeBtn: { paddingHorizontal: 12 },
  strengthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  strengthLabel: { color: "#888", fontSize: 12 },
  strengthBarContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 20,
  },
  strengthBar: { flex: 1, height: 6, borderRadius: 3, marginHorizontal: 2 },
  button: { borderRadius: SIZES.radius, overflow: "hidden" },
  buttonGradient: {
    padding: 15,
    alignItems: "center",
    borderRadius: SIZES.radius,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default NewPassword;