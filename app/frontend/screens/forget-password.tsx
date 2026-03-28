import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PhoneInput from "../components/PhoneInput";
import WaveBackground from "../components/waveBackground";
import styles from "../styles/LoginStyle";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

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

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      {/* Header avec flèche à gauche et cadenas centré */}
      <View style={localStyles.headerRow}>
        {/* Bouton retour à gauche */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#6949a8" />
        </TouchableOpacity>

        {/* Espace vide pour centrer le cadenas */}
        <View style={localStyles.placeholder} />

        {/* Cadenas centré */}
        <View style={localStyles.lockCircle}>
          <Text style={localStyles.lockIcon}>🔒</Text>
        </View>

        {/* Espace vide pour équilibrer */}
        <View style={localStyles.placeholder} />
      </View>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Forgot Password ?</Text>
        </View>
        <Text style={styles.subtitle}>
          Enter your phone number to receive a verification code.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Phone Number</Text>
        <PhoneInput value={phone} onChange={setPhone} />
      </View>

      <TouchableOpacity 
        style={styles.buttonWrapper}
        onPress={() => {
          if (phone.trim()) {
            router.push("/verify");
          } else {
            alert("Please enter your phone number");
          }
        }}
      >
        <LinearGradient
          colors={["#6949a8", "#9574e0", "#baaae7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Send Code</Text>
        </LinearGradient>
      </TouchableOpacity>

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

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  lockCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1edff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  lockIcon: {
    fontSize: 20,
  },
});