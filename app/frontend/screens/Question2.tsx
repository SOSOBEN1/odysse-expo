import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

import QuestionCard from "../components/QuestionCard";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";

export default function Question2Screen() {
  const router = useRouter();
  const [studyTime, setStudyTime] = useState<string | null>(null);

  return (
    <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
      <WaveBackground />

     <View style={styles.header}>
  <BackButton />

  <View style={styles.headerCenter}>
    <Text style={styles.progressText}>Question 2 of 5</Text>

    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: "40%" }]} />
    </View>
  </View>

  <View style={{ width: 26 }} />
</View>

      {/* CARD */}
     <View style={styles.cardWrapper}>
        <QuestionCard
          question="Combien de temps étudies-tu généralement par jour ?"
          options={[
            "Moins de 30 minutes",
            "30 min – 1h",
            "1 – 2 heures",
            "Plus de 2 heures",
          ]}
          selectedValue={studyTime}
          onSelect={setStudyTime}
          layout="list"
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!studyTime}
          onPress={() => router.push("/question3")}
          style={[styles.nextButton, { opacity: studyTime ? 1 : 0.5 }]}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
 cardWrapper: {
  flex: 1,
  justifyContent: "flex-start",
  marginTop: 80, // 🔥 augmente ici (essaie 60, 80, 100 selon ton design)
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

  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 20,
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