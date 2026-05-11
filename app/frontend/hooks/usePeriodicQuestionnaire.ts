import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { useUser } from "../constants/UserContext";
import { supabase } from "../constants/supabase";

const INTERVAL_MS      = 12 * 60 * 60 * 1000; // 12 heures
const ONBOARDING_GRACE = 5 * 60 * 1000;        // 5 minutes — délai post-inscription

// Routes d'onboarding : on ne redirige jamais vers le questionnaire depuis ces pages
const ONBOARDING_ROUTES = [
  "/frontend/screens/Register",
  "/frontend/screens/SetUpProfile",
  "/frontend/screens/start",
];

export function usePeriodicQuestionnaire() {
  const router   = useRouter();
  const pathname = usePathname();
  const { userId } = useUser();

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      try {
        // ── Ne pas rediriger si on est sur une page d'onboarding ──
        const isOnboarding = ONBOARDING_ROUTES.some(route => pathname?.includes(route));
        if (isOnboarding) {
          console.log("🟢 Page onboarding détectée → pas de redirection périodique");
          return;
        }

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

        // ── Garde onboarding : player_stats créé il y a < 5 min ──
        if (data?.date_maj) {
          const age = Date.now() - new Date(data.date_maj).getTime();
          if (age < ONBOARDING_GRACE) {
            console.log("🟢 Inscription récente → pas de redirection périodique");
            return;
          }
        }

        // ── Pas de stats du tout → nouvel utilisateur, pas encore passé par SetUpProfile ──
        if (!data) {
          console.log("🟢 Pas de player_stats → nouvel utilisateur, pas de redirection");
          return;
        }

        // ── Pas de timestamp → première vraie connexion ──
        if (!data.last_periodic_questionnaire) {
          console.log("⚠️ Pas de timestamp → redirection questionnaire");
          router.push("/frontend/screens/QuestionPeriodicScreen" as any);
          return;
        }

        // ── Vérification des 12h ──
        const elapsed         = Date.now() - new Date(data.last_periodic_questionnaire).getTime();
        const heuresRestantes = ((INTERVAL_MS - elapsed) / (1000 * 60 * 60)).toFixed(1);
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
  }, [userId, pathname]);
}