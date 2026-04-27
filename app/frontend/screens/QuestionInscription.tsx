import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackButton from "../components/BackButton";
import QuestionChoix from "../components/QuestionChoix";
import QuestionYesNo from "../components/QuestionYesNo";
import WaveBackground from "../components/waveBackground";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import type { Answer, Question } from "../utils/statsCalculator";
import { computeStatsFromAnswers } from "../utils/statsCalculator";
// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuestionInscriptionScreen() {
  const router = useRouter();
  const { userId } = useUser();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("question")
        .select(
          `
          id,
          text,
          type,
          category,
          min_value,
          max_value,
          question_option (
            id,
            label,
            value,
            impact,
            order_index
          )
        `
        )
        .eq("context", "onboarding")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erreur fetch questions:", error.message);
        Alert.alert("Erreur", "Impossible de charger les questions");
      } else {
        setQuestions(data ?? []);
      }
    } catch (err) {
      console.error("Erreur:", err);
      Alert.alert("Erreur", "Une erreur est survenue");
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== null &&
    currentAnswer.value !== null &&
    currentAnswer.value !== undefined;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOptionAnswer = (numericValue: number) => {
    if (!currentQuestion) return;
    const opt = currentQuestion.question_option?.find(
      (o) => o.value === numericValue
    );
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
    const opt = currentQuestion.question_option?.find(
      (o) => o.value === targetValue
    );
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

  // ── Save Answers + Stats ───────────────────────────────────────────────────

  const saveAnswers = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    setSaving(true);

    try {
      // ── 1. Sauvegarde des réponses ──────────────────────────────
      const rows = questions
        .map((q) => {
          const ans = answers[q.id];
          if (!ans || ans.value === null) return null;

          return {
            user_id: userId,
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

      const { error: insertError } = await supabase
        .from("response")
        .insert(rows);

      if (insertError) {
        console.error("❌ Erreur insertion réponses:", insertError);
        throw new Error(insertError.message);
      }

      console.log(`✅ ${rows.length} réponse(s) onboarding enregistrée(s)`);

      // ── 2. Calcul des stats à partir des réponses ───────────────
      const stats = computeStatsFromAnswers(questions, answers);

      console.log("📊 Stats calculées pour onboarding:", stats);

      // ── 3. Sauvegarde des stats dans player_stats ───────────────
      const { error: statsError } = await supabase
        .from("player_stats")
        .upsert(
          {
            id_user: userId,
            energie: stats.energie,
            stress: stats.stress,
            connaissance: stats.connaissance,
            organisation: stats.organisation,
            date_maj: new Date().toISOString(),
          },
          { onConflict: "id_user" }
        );

      if (statsError) {
        console.error("❌ Erreur sauvegarde stats:", statsError);
        throw new Error(statsError.message);
      }

      console.log("✅ Stats initiales sauvegardées");

      // ── 4. Ajout dans l'historique des stats ────────────────────
      const { error: historyError } = await supabase
        .from("stat_history")
        .insert({
          id_user: userId,
          energie: stats.energie,
          stress: stats.stress,
          connaissance: stats.connaissance,
          organisation: stats.organisation,
          cause: "Initialisation inscription",
          date: new Date().toISOString(),
        });

      if (historyError) {
        console.warn("⚠️ Erreur historique (non bloquante):", historyError);
      } else {
        console.log("✅ Historique des stats enregistré");
      }

      // ── 5. Redirection vers le dashboard ────────────────────────
      Alert.alert("Succès", "Profil créé avec succès !", [
        { text: "OK", onPress: () => router.push("/frontend/screens/Dashbord") },
      ]);
    } catch (err: any) {
      console.error("💥 Erreur saveAnswers:", err);
      Alert.alert("Erreur", err.message ?? "Une erreur est survenue");
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
            options={currentQuestion.question_option || []}
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
          style={[
            styles.backButton,
            { opacity: currentIndex === 0 ? 0.4 : 1 },
          ]}
        >
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasAnswer || saving}
          style={[
            styles.nextButton,
            { opacity: hasAnswer && !saving ? 1 : 0.5 },
          ]}
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