import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);

  // Simple fonction pour calculer la force du mot de passe
  const checkStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    setStrength(score);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    checkStrength(text);
  };

  const handleConfirmChange = (text) => {
    setConfirmPassword(text);
  };

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password updated successfully!");
  };

  const strengthColors = ["#ff4d4f", "#ff7a45", "#ffa940", "#73d13d", "#52c41a"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>Your new password must be different from previously used passwords</Text>

      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={handlePasswordChange}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={handleConfirmChange}
      />

      <View style={styles.strengthBarContainer}>
        {strengthColors.map((color, index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              { backgroundColor: index < strength ? color : "#eee" },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>New Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#f5f0ff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#5c3ca8", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#9b87c9", marginBottom: 20 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  strengthBarContainer: { flexDirection: "row", marginBottom: 30, justifyContent: "space-between" },
  strengthBar: { flex: 1, height: 6, borderRadius: 3, marginHorizontal: 2 },
  button: { backgroundColor: "#7f5af0", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default NewPassword;