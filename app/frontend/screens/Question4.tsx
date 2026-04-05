import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import QuestionCard from "../components/QuestionCard";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";

export default function Question4Screen() {
  const router = useRouter();
  const [followPlan, setFollowPlan] = useState<string | null>(null);

  const options = [
    "Pas du tout",
    "Pas vraiment",
    "Moyennement",
    "Plutôt",
    "Tout à fait",
  ];

  return (
    <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={styles.container}>
      <WaveBackground />

      {/* HEADER */}
      <View style={styles.header}>
  <BackButton />

  <View style={styles.headerCenter}>
    <Text style={styles.progressText}>Question 4 of 5</Text>

    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: "80%" }]} />
    </View>
  </View>

  <View style={{ width: 26 }} />
</View>

      {/* CARD */}
      <View style={styles.cardWrapper}>
        <QuestionCard
          question="As-tu suivi ton plan d’étude aujourd’hui ?"
          options={options}
          selectedValue={followPlan}
          onSelect={setFollowPlan}
          layout="scale"
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!followPlan}
          onPress={() => router.push("/question5")}
          style={[
            styles.nextButton,
            { opacity: followPlan ? 1 : 0.5 },
          ]}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    marginTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  progressText: {
    fontWeight: "600",
    color: "#6949a8",
    marginBottom: 8,
  },

  progressBar: {
    height: 8,
    width: "70%",
    backgroundColor: "#E0D7F5",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#6949a8",
    borderRadius: 10,
  },

 cardWrapper: {
  flex: 1,
  justifyContent: "flex-start",
  marginTop: 80, // 🔥 augmente ici (essaie 60, 80, 100 selon ton design)
},
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  backButton: {
    backgroundColor: "#E0D7F5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },

  backText: {
    color: "#6949a8",
    fontWeight: "600",
  },

  nextButton: {
    backgroundColor: "#6949a8",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 20,
  },

  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
});