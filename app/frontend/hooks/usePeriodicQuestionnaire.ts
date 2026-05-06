import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";

const INTERVAL_MS     = 12 * 60 * 60 * 1000; // 12 heures
const ONBOARDING_GRACE = 5 * 60 * 1000;       // 5 minutes — délai post-inscription

export function usePeriodicQuestionnaire() {
  const router     = useRouter();
  const { userId } = useUser();

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      try {
        console.log("🔍 userId type:", typeof userId, "value:", userId);

        const { data, error } = await supabase
          .from("player_stats")
          .select("last_periodic_questionnaire, date_maj")
          .eq("id_user", Number(userId))
          .maybeSingle();

        console.log("📊 player_stats data:", data, "error:", error);

        if (error) {
          console.warn("Erreur lecture timestamp périodique:", error.message);
          return;
        }

        // ── Garde onboarding ──────────────────────────────────────
        // Si player_stats vient d'être créé (< 5 min), c'est une
        // inscription récente → on ne redirige pas vers le periodic
        if (data?.date_maj) {
          const age = Date.now() - new Date(data.date_maj).getTime();
          if (age < ONBOARDING_GRACE) {
            console.log("🟢 Inscription récente → pas de redirection périodique");
            return;
          }
        }

        // ── Pas de timestamp → première vraie connexion ───────────
        if (!data || !data.last_periodic_questionnaire) {
          console.log("⚠️ Pas de timestamp → redirection questionnaire");
          router.push("/frontend/screens/QuestionPeriodicScreen" as any);
          return;
        }

        // ── Vérification des 12h ──────────────────────────────────
        const elapsed          = Date.now() - new Date(data.last_periodic_questionnaire).getTime();
        const heuresRestantes  = ((INTERVAL_MS - elapsed) / (1000 * 60 * 60)).toFixed(1);

        console.log(`⏱️ Elapsed: ${(elapsed / 3600000).toFixed(1)}h — Restant: ${heuresRestantes}h`);

        if (elapsed >= INTERVAL_MS) {
          console.log("✅ 12h écoulées → redirection questionnaire");
          router.push("/frontend/screens/QuestionPeriodicScreen" as any);
        } else {
          console.log("🟢 Pas encore 12h → dashboard normal");
        }
      } catch (e) {
        console.warn("Erreur vérification questionnaire périodique:", e);
      }
    };

    check();
  }, [userId]);
}