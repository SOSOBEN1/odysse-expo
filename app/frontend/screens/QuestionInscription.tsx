import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../constants/supabase";
import QuestionChoix from "../components/QuestionChoix";
import QuestionYesNo from "../components/QuestionYesNo";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";
import { useRouter } from "expo-router";
import { useUser } from "../constants/UserContext"; // ✅

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionOption = {
  id: string;
  label: string;
  value: number;
  order_index: number;
};

type Question = {
  id: string;
  text: string;
  type: "multiple" | "boolean";
  question_option: QuestionOption[];
};

type Answer = {
  option_id: string | null;
  value: number | null;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuestionInscriptionScreen() {
  const router = useRouter();
  const { userId } = useUser(); // ✅

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saving, setSaving] = useState(false);

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
      console.error("Erreur fetch questions:", error.message);
    } else {
      setQuestions(data ?? []);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== null &&
    currentAnswer.value !== null &&
    currentAnswer.value !== undefined;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOptionAnswer = (numericValue: number) => {
    if (!currentQuestion) return;
    const opt = currentQuestion.question_option.find((o) => o.value === numericValue);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        option_id: opt?.id ?? null,
        value: numericValue,
      },
    }));
  };

  const handleBooleanAnswer = (bool: boolean) => {
    if (!currentQuestion) return;
    const targetValue = bool ? 1 : 0;
    const opt = currentQuestion.question_option.find((o) => o.value === targetValue);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        option_id: opt?.id ?? null,
        value: targetValue,
      },
    }));
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await saveAnswers();
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const saveAnswers = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    setSaving(true);

    try {
      const rows = questions
        .map((q) => {
          const ans = answers[q.id];
          if (!ans || ans.value === null) return null;

          return {
            user_id: userId,           // ✅ INT depuis UserContext
            question_id: q.id,
            option_id: ans.option_id,
            value: ans.value,
          };
        })
        .filter(Boolean);

      if (rows.length === 0) {
        Alert.alert("Attention", "Aucune réponse à enregistrer");
        return;
      }

      console.log("📤 Envoi onboarding:", JSON.stringify(rows, null, 2));

      const { data, error } = await supabase
        .from("response")
        .insert(rows)
        .select();

      if (error) {
        console.error("❌ Erreur save:", error.message);
        Alert.alert("Erreur", `Impossible d'enregistrer : ${error.message}`);
        return;
      }

      console.log(`✅ ${data.length} réponse(s) onboarding enregistrée(s)`);
      router.push("/frontend/screens/Dashbord");

    } catch (err: any) {
      console.error("💥 Crash saveAnswers:", err.message);
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!questions.length || !currentQuestion) {
    return (
      <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6949a8", fontWeight: "600" }}>Chargement...</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
      <WaveBackground />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} / {questions.length}
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
            options={currentQuestion.question_option}
            onSelect={handleOptionAnswer}
            selectedValue={currentAnswer?.value}
          />
        )}
        {currentQuestion.type === "boolean" && (
          <QuestionYesNo
            question={currentQuestion.text}
            onSelect={handleBooleanAnswer}
            selectedValue={
              currentAnswer?.value === undefined || currentAnswer?.value === null
                ? null
                : currentAnswer.value === 1
            }
          />
        )}
      </View>

      {/* BUTTONS */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          style={[styles.backButton, { opacity: currentIndex === 0 ? 0.4 : 1 }]}
        >
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasAnswer || saving}
          style={[styles.nextButton, { opacity: hasAnswer && !saving ? 1 : 0.5 }]}
        >
          <Text style={styles.nextText}>
            {saving
              ? "Enregistrement..."
              : currentIndex === questions.length - 1
              ? "Terminer"
              : "Suivant"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    marginBottom: 90,
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