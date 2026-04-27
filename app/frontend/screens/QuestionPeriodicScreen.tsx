import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../constants/supabase";
import { useRouter } from "expo-router";
import { useUser } from "../constants/UserContext";

import QuestionChoix from "../components/QuestionChoix";
import QuestionYesNo from "../components/QuestionYesNo";
import QuestionStar from "../components/Questionstar";
import QuestionScale from "../components/Questionscale";
import WaveBackground from "../components/waveBackground";
import BackButton from "../components/BackButton";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionOption = {
  id: string;
  label: string;
  value: number;
  impact: number;
  order_index: number;
};

type Question = {
  id: string;
  text: string;
  type: "multiple" | "boolean" | "star" | "scale";
  category: "stress" | "energie" | "organisation" | "connaissance";
  min_value?: number | null;
  max_value?: number | null;
  question_option: QuestionOption[];
};

type Answer = {
  option_id: string | null;
  value: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["stress", "energie", "organisation", "connaissance"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  stress:       "🔴 Stress",
  energie:      "🟡 Énergie",
  organisation: "🟢 Organisation",
  connaissance: "🔵 Connaissance",
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickOnePerCategory(questions: Question[]): Question[] {
  const result: Question[] = [];
  for (const cat of CATEGORIES) {
    const pool = questions.filter((q) => q.category === cat);
    if (pool.length > 0) result.push(pickRandom(pool));
  }
  return result;
}

function clamp(val: number): number {
  return Math.min(100, Math.max(0, val));
}

// ─── Calcul des stats depuis les réponses ────────────────────────────────────
function computeDerivedStats(base: {
  energie: number;
  stress: number;
  connaissance: number;
  organisation: number;
}) {
  return {
    concentration: Math.min(100, Math.max(0, base.energie * 0.4 + base.connaissance * 0.6)),
    serenite: Math.min(100, Math.max(0, 100 - base.stress)),
    discipline: Math.min(100, Math.max(0, base.organisation * 0.7 + base.connaissance * 0.3)),
  };
}

function computeStats(
  questions: Question[],
  answers: Record<string, Answer>
): {
  energie:      number;
  stress:       number;
  connaissance: number;
  organisation: number;
} {
  let energie = 50, stress = 50, connaissance = 50, organisation = 50;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (!ans || ans.value === null) return;

    let impact = 0;

    if (q.type === "star") {
      const note = ans.value ?? 1;
      const max  = q.max_value ?? 5;
      const min  = q.min_value ?? 1;
      // note 1 → impact -4 | note 3 → impact 0 | note 5 → impact +4
      impact = ((note - min) / (max - min)) * 8 - 4;
    } else {
      const option = q.question_option.find((o) => o.value === ans.value);
      impact = option?.impact ?? 0;
    }

    if (q.category === "stress")       stress        = clamp(stress        - impact);
    if (q.category === "energie")      energie       = clamp(energie       + impact);
    if (q.category === "connaissance") connaissance  = clamp(connaissance  + impact);
    if (q.category === "organisation") organisation  = clamp(organisation  + impact);
  });

  return { energie, stress, connaissance, organisation };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuestionPeriodicScreen() {
  const router     = useRouter();
  const { userId } = useUser();

  const [questions,    setQuestions]    = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers,      setAnswers]      = useState<Record<string, Answer>>({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    fetchAndPickQuestions();
  }, []);

  const fetchAndPickQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("question")
        .select(`
          id, text, type, category, min_value, max_value,
          question_option ( id, label, value, impact, order_index )
        `)
        .eq("context", "periodic");

      if (error) throw error;

      const safeData: Question[] = (data ?? []).map((q: any) => ({
        id:              q.id,
        text:            q.text ?? "Question inconnue",
        type:            q.type ?? "multiple",
        category:        q.category ?? "stress",
        min_value:       q.min_value ?? 1,
        max_value:       q.max_value ?? 5,
        question_option: (q.question_option ?? [])
          .map((opt: any) => ({
            id:          opt.id,
            label:       opt.label ?? "Option",
            value:       opt.value ?? 0,
            impact:      opt.impact ?? 0,
            order_index: opt.order_index ?? 0,
          }))
          .sort((a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index),
      }));

      setQuestions(pickOnePerCategory(safeData));
    } catch (err: any) {
      Alert.alert("Erreur", "Impossible de charger les questions");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const progress        = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswer   = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswer =
    currentAnswer !== undefined &&
    currentAnswer !== null &&
    currentAnswer.value !== null &&
    currentAnswer.value !== undefined;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOptionAnswer = (numericValue: number) => {
    if (!currentQuestion) return;
    const opt = currentQuestion.question_option.find((o) => o.value === numericValue);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { option_id: opt?.id ?? null, value: numericValue },
    }));
  };

  const handleBooleanAnswer = (bool: boolean) => {
    if (!currentQuestion) return;
    const targetValue = bool ? 1 : 0;
    const opt = currentQuestion.question_option.find((o) => o.value === targetValue);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { option_id: opt?.id ?? null, value: targetValue },
    }));
  };

  const handleStarAnswer = (numericValue: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { option_id: null, value: numericValue },
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

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
const saveAnswers = async () => {
  if (!userId) {
    Alert.alert("Erreur", "Utilisateur non connecté");
    return;
  }

  setSaving(true);

  try {
    // ── 1. réponses brutes ──────────────────────────────
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

    if (insertError) throw insertError;

    // ── 2. stats de base uniquement ─────────────────────
    const stats = computeStats(questions, answers);

    // ── 3. UPDATE DB SANS STATS DÉRIVÉES ────────────────
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

    if (statsError) throw statsError;

    // ── 4. historique ───────────────────────────────────
    await supabase.from("stat_history").insert({
      id_user: userId,
      energie: stats.energie,
      stress: stats.stress,
      connaissance: stats.connaissance,
      organisation: stats.organisation,
      cause: "Questionnaire périodique",
    });

    router.push("/frontend/screens/Dashbord");

  } catch (err: any) {
    Alert.alert("Erreur", err.message ?? "Une erreur est survenue");
  } finally {
    setSaving(false);
  }
};
  // ── Render question ────────────────────────────────────────────────────────

  const renderQuestion = () => {
    if (!currentQuestion) return <Text>Aucune question disponible</Text>;

    switch (currentQuestion.type) {
      case "multiple":
        return (
          <QuestionChoix
            question={currentQuestion.text}
            options={currentQuestion.question_option}
            onSelect={handleOptionAnswer}
            selectedValue={currentAnswer?.value}
          />
        );
      case "boolean":
        return (
          <QuestionYesNo
            question={currentQuestion.text}
            onSelect={handleBooleanAnswer}
            selectedValue={
              currentAnswer?.value === undefined || currentAnswer?.value === null
                ? null
                : currentAnswer.value === 1
            }
          />
        );
      case "star":
        return (
          <QuestionStar
            question={currentQuestion.text}
            min_value={currentQuestion.min_value ?? 1}
            max_value={currentQuestion.max_value ?? 5}
            onSelect={handleStarAnswer}
            selectedValue={currentAnswer?.value}
          />
        );
      case "scale":
        return (
          <QuestionScale
            question={currentQuestion.text}
            options={currentQuestion.question_option}
            onSelect={handleOptionAnswer}
            selectedValue={currentAnswer?.value}
          />
        );
      default:
        return null;
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6949a8", fontWeight: "600" }}>Chargement...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (questions.length === 0) {
    return (
      <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6949a8", fontWeight: "600" }}>
            Aucune question disponible
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={["#ffffff", "#EDE7FF"]} style={{ flex: 1 }}>
      <WaveBackground />

      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.categoryLabel}>
            {CATEGORY_LABELS[currentQuestion.category]}
          </Text>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} / {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.cardWrapper}>{renderQuestion()}</View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={handleBack}
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
  categoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9e86d4",
    marginBottom: 4,
    letterSpacing: 0.5,
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
    marginTop: 60,
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