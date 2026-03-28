import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../assets/images/Group.svg";
import WaveBackground from "../components/waveBackground";

// 🔥 fonction safe pour charger les .glb
const getModel = (path) => {
  try {
    return Asset.fromModule(path).uri;
  } catch (e) {
    console.log("Erreur chargement model:", e);
    return null;
  }
};

const avatars = [
  // 👩 FEMININ (6)
  {
    id: 1,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille1Corrige.glb"),
  },
  {
    id: 2,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille2Corrige.glb"),
  },
  {
    id: 3,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille3Corrige.glb"),
  },
  {
    id: 7,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille1Corrige.glb"),
  },
  {
    id: 8,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille2Corrige.glb"),
  },
  {
    id: 9,
    gender: "Feminin",
    model: require("../assets/Avatar3D/fille3Corrige.glb"),
  },

  // 👨 MASCULIN (6)
  {
    id: 4,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon1Corrige.glb")
  },
  {
    id: 5,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon2Corrige.glb"),
  },
  {
    id: 6,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon3Corrige.glb"),
  },
  {
    id: 10,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon4Corrige.glb"),
  },
  {
    id: 11,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon1Corrige.glb"),
  },
  {
    id: 12,
    gender: "Masculin",
    model: require("../assets/Avatar3D/garcon2Corrige.glb"),
  },
];

export default function SetUpProfileScreen() {
  const [gender, setGender] = useState("Masculin");
  const [selected, setSelected] = useState(4);

  const filteredAvatars = avatars.filter((a) => a.gender === gender);

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

  const renderItem = ({ item }) => {
    const isSelected = selected === item.id;

    return (
      <TouchableOpacity
        onPress={() => setSelected(item.id)}
        style={[
          styles.avatarBox,
          isSelected && styles.avatarSelected
        ]}
      >
        {/* ⚠️ 3D désactivé pour éviter crash - à remplacer par votre composant 3D */}
        <View style={styles.placeholder3d}>
          <Ionicons name="cube-outline" size={40} color="#7f5af0" />
        </View>

        {isSelected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#ffffff", "#dcd2f9"]}
      style={styles.container}
    >
      {/* 🌊 Wave background */}
      <WaveBackground />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        {/* LOGO À GAUCHE + TITLE */}
        <View style={styles.titleRow}>
          <Logo width={32} height={32} style={styles.logoImage} />
          <Text style={styles.title}>Set Up Profile</Text>
        </View>

        <Text style={styles.subtitle}>
          Create Your Initial Profile To Get Started
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* BARRE FEMININ/MASCULIN */}
        <View style={styles.genderBar}>
          <TouchableOpacity
            onPress={() => {
              setGender("Feminin");
              const firstFeminin = avatars.find(a => a.gender === "Feminin");
              if (firstFeminin) setSelected(firstFeminin.id);
            }}
            style={[
              styles.genderButton,
              gender === "Feminin" && styles.genderButtonActive,
            ]}
          >
            <Text
              style={[
                styles.genderText,
                gender === "Feminin" && styles.genderTextActive,
              ]}
            >
              Feminin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setGender("Masculin");
              const firstMasculin = avatars.find(a => a.gender === "Masculin");
              if (firstMasculin) setSelected(firstMasculin.id);
            }}
            style={[
              styles.genderButton,
              gender === "Masculin" && styles.genderButtonActive,
            ]}
          >
            <Text
              style={[
                styles.genderText,
                gender === "Masculin" && styles.genderTextActive,
              ]}
            >
              Masculin
            </Text>
          </TouchableOpacity>
        </View>

        {/* GRILLE DES AVATARS 3D */}
        <FlatList
          data={filteredAvatars}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />

        {/* BOUTON SUIVANT PETIT À DROITE */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton}>
            <LinearGradient
              colors={["#7f5af0", "#bbaaff"]}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    position: "absolute",
    top: 54,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffffaa",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    marginTop: 140,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Changé de center à flex-start pour aligner à gauche
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5c3ca8",
    letterSpacing: 0.5,
    marginLeft: 12, // Ajouté un espace entre le logo et le titre
  },
  logoImage: {
    marginLeft:5,
  },
  subtitle: {
    fontSize: 14,
    color: "#9b87c9",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  genderBar: {
    flexDirection: "row",
    backgroundColor: "#f0edff",
    borderRadius: 40,
    padding: 4,
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 36,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#7f5af0",
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7f5af0",
  },
  genderTextActive: {
    color: "#fff",
  },
  grid: {
    paddingBottom: 8,
    marginTop: 12,
  },
  avatarBox: {
    flex: 1,
    margin: 8,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#f8f7ff",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    position: "relative",
  },
  avatarSelected: {
    borderWidth: 2.5,
    borderColor: "#7f5af0",
    backgroundColor: "#f0ecff",
  },
  placeholder3d: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e9e6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  check: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#7f5af0",
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  nextButton: {
    borderRadius: 25,
    overflow: "hidden",
    width: 100,
  },
  nextButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  stars: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});