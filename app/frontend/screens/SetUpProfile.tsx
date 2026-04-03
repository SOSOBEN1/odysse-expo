import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import UsernameInput from "../components/UsernameInput";
import styles from "../styles/SetUpProfileStyle";
import WaveBackground from "../components/waveBackground";
import { Link,useRouter } from "expo-router";


export default function SetUpProfileScreen() {
   const router = useRouter();
  const [username, setUsername] = useState("");
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
    // tu peux ajouter autant d'étoiles que tu veux
  ];
  return (
  <LinearGradient
  colors={["#ffffff", "#dcd2f9"]}
  style={styles.container}
>
  {/* 🌊 Wave background */}
  <WaveBackground />

  {/* Back */}
  <TouchableOpacity style={styles.backBtn}  onPress={() => router.push("/frontend/screens/Register")}>
    <Ionicons name="arrow-back" size={20} color="#6949a8" />
  </TouchableOpacity>

  {/* Header */}
  <View style={styles.header}>
    
    {/* LOGO + TITLE */}
    <View style={styles.titleRow}>
 
      <Text style={styles.title}> Set Up Profile</Text>
    </View>

    <Text style={styles.subtitle}>
      Create Your Initial Profile To Get Started
    </Text>
  </View>

      {/* Card */}
      <View style={[styles.card, { marginTop: 18 }]}> 
        <Text style={styles.label}>Choose Avatar</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#2c2c54" />
          </View>

          <TouchableOpacity style={styles.editIcon} onPress={() => router.push("/frontend/screens/SetupProfileScreen")}>
            <Feather name="edit-2" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label} >Choose UserName</Text>

        <UsernameInput
          value={username}
          onChange={setUsername}
          placeholder="Enter Username"
        />

        <TouchableOpacity style={styles.buttonWrapper}>
  <LinearGradient
    colors={["#6949a8", "#9574e0", "#baaae7"]}
    start={{ x: 0, y: 0 }}   // 👈 gauche
    end={{ x: 1, y: 0 }}     // 👈 droite
    style={styles.button}
  >
    <Text style={styles.buttonText}>Continue</Text>
  </LinearGradient>
</TouchableOpacity>
      </View>

   {/* ✨ Stars */}
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