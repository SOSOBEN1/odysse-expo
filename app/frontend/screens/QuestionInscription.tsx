import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../constants/supabase";
import QuestionChoix from "../components/QuestionChoix";
import QuestionYesNo from "../components/QuestionYesNo";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";
import { useRouter } from "expo-router";

type Question = {
  id: string;
  text: string;
  type: "multiple" | "boolean";
  question_option?: any[];
};

export default function QuestionInscriptionScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("question")
      .select(`
        id,
        text,
        type,
        question_option (
          id,
          label,
          value,
          order_index
        )
      `)
      .eq("context", "onboarding")
      .order("created_at", { ascending: true });

    if (error) {
      console.log("ERROR:", error);
    } else {
      setQuestions(data || []);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== null;

  const handleAnswer = (answer: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };
const handleNext = () => {
  if (currentIndex < questions.length - 1) {
    setCurrentIndex((prev) => prev + 1);
  } else {
    // ✅ Vérifie le nom exact de ton fichier Dashboard
    router.push("/frontend/screens/Dashbord");
  }
};

 

  if (!questions.length || !currentQuestion) {
    return (
      <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6949a8", fontWeight: "600" }}>Chargement...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
      <WaveBackground />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {/* QUESTION */}
      <View style={styles.cardWrapper}>
        {currentQuestion.type === "multiple" && (
          <QuestionChoix
            question={currentQuestion.text}
            options={currentQuestion.question_option || []}
            onSelect={handleAnswer}
            selectedValue={currentAnswer}
          />
        )}
        {currentQuestion.type === "boolean" && (
          <QuestionYesNo
            question={currentQuestion.text}
            onSelect={handleAnswer}
            selectedValue={currentAnswer}
          />
        )}
      </View>

      {/* BUTTONS */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasAnswer}
          style={[styles.nextButton, { opacity: hasAnswer ? 1 : 0.5 }]}
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
    marginTop: 80,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 90,   // ⬆️ remonté
    marginTop: 10,
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