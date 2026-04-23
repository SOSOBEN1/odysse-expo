import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import { useRouter } from "expo-router";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const router = useRouter(); 

  const checkStrength = (pwd: string) => {  // ← FIX
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setStrength(score);
  };

  const handlePasswordChange = (text: string) => {  // ← FIX
    setPassword(text);
    checkStrength(text);
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
   alert("Password updated successfully!");
    router.push("/frontend/screens/Login");
  };

  const strengthColors = ["#ff4d4f", "#ff7a45", "#ffa940", "#73d13d"];

  return (
    <LinearGradient colors={["#cfc3ff", "#f5f0ff"]} style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color="#5c3ca8" />
      </TouchableOpacity>

      {/* REAL Wave */}
      <Wave />

      {/* Top Icon */}
      <View style={styles.topIcon}>
        <Ionicons name="checkmark" size={28} color="#fff" />
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previously used passwords
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={handlePasswordChange}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.strengthLabel}>Password strength</Text>
        <View style={styles.strengthBarContainer}>
          {strengthColors.map((color, index) => (
            <View
              key={index}
              style={[
                styles.strengthBar,
                { backgroundColor: index < strength ? color : "#eaeaea" },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <LinearGradient
            colors={["#7f5af0", "#bbaaff"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>New Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: "center",
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

  waveSvg: {
    position: "absolute",
    top: 0,
  },

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

  label: {
    color: "#555",
    marginBottom: 5,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
  },

  strengthLabel: {
    marginTop: 10,
    color: "#888",
    fontSize: 12,
  },

  strengthBarContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 20,
  },

  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  button: {
    borderRadius: SIZES.radius,
    overflow: "hidden",
  },

  buttonGradient: {
    padding: 15,
    alignItems: "center",
    borderRadius: SIZES.radius,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default NewPassword;
