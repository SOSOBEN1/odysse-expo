import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import BadgeUnlockedModal from "./frontend/components/BadgeUnlockedModel";
import LevelUpModal from "./frontend/components/LevelUpModal";
import { AvatarProvider } from "./frontend/constants/AvatarContext";
import { supabase } from "./frontend/constants/supabase";
import { UserProvider, useUser } from "./frontend/constants/UserContext";
import { StatsProvider } from "./frontend/constants/StatsContext";
import { checkAndUnlockBadges } from "../backend/services/badgeEngine";

// ── Badge meta (emoji) ────────────────────────────────────────
const BADGE_EMOJI: Record<number, string> = {
  1:"👣", 2:"🔥", 3:"👁️", 4:"🎯", 5:"📅", 6:"⚡", 7:"⭐", 8:"❤️",
  9:"🎓", 10:"🏃", 11:"🏆", 12:"🌸", 13:"🌬️", 14:"🧘", 15:"💚",
  16:"😴", 17:"🏋️", 18:"🥗", 19:"🌿", 20:"📖", 21:"🧠", 22:"💡",
  23:"🗺️", 24:"📚", 25:"🗓️", 26:"🍅", 27:"♟️", 28:"🚀", 29:"📐",
  30:"🌟", 31:"💪", 32:"🛡️", 33:"👑", 34:"🦁", 35:"🔍", 36:"⚔️", 37:"💎",
};

// ── Même formule que levelService.ts : 500 XP = 1 niveau ─────
const XP_PAR_NIVEAU = 500;
function calcNiveauFromXP(xp: number): number {
  return Math.floor(xp / XP_PAR_NIVEAU) + 1;
}

// ── Détecteur global de montée de niveau ─────────────────────
function LevelUpWatcher() {
  const { userId } = useUser();
  const [levelUpModal, setLevelUpModal] = useState({ visible: false, newLevel: 1 });
  const lastNiveauRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("[LevelUpWatcher] userId =", userId);
    if (!userId) return;

    let isMounted = true;

    const checkLevel = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("xp")
          .eq("id_user", userId)
          .single();

        console.log("[LevelUpWatcher] data =", data, "error =", error);
        if (!isMounted || !data) return;

        const niveauActuel = calcNiveauFromXP(data.xp ?? 0);
        console.log("[LevelUpWatcher] xp =", data.xp, "→ niveau =", niveauActuel, "| last =", lastNiveauRef.current);

        if (lastNiveauRef.current === null) {
          lastNiveauRef.current = niveauActuel;
          return;
        }

        if (niveauActuel > lastNiveauRef.current) {
          lastNiveauRef.current = niveauActuel;
          console.log("[LevelUpWatcher] 🎉 LEVEL UP → niveau", niveauActuel);
          setLevelUpModal({ visible: true, newLevel: niveauActuel });
        }
      } catch (e) {
        console.error("[LevelUpWatcher] erreur :", e);
      }
    };

    checkLevel();
    const interval = setInterval(checkLevel, 4000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [userId]);

  return (
    <LevelUpModal
      visible={levelUpModal.visible}
      newLevel={levelUpModal.newLevel}
      onClose={() => setLevelUpModal(prev => ({ ...prev, visible: false }))}
    />
  );
}

// ── Détecteur global de badges ────────────────────────────────
function BadgeWatcher() {
  const { userId } = useUser();

  // File d'attente des badges à afficher un par un
  const [queue,        setQueue]        = useState<{ id: number; name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [current,      setCurrent]      = useState<{ id: number; name: string } | null>(null);

  // Vérifie les badges toutes les 10 secondes
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const check = async () => {
      try {
        const unlocked = await checkAndUnlockBadges(userId);
        if (!isMounted || unlocked.length === 0) return;

        // On a besoin des IDs pour les emojis — on refetch les badges nouvellement obtenus
        const { data } = await supabase
          .from("badges")
          .select("id_badge, nom")
          .in("nom", unlocked);

        if (!isMounted || !data?.length) return;

        const newBadges = data.map((b: any) => ({ id: b.id_badge, name: b.nom }));
        setQueue(prev => [...prev, ...newBadges]);
      } catch (e) {
        // Silencieux
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [userId]);

  // Dépile la file : affiche un badge à la fois
  useEffect(() => {
    if (!modalVisible && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setModalVisible(true);
    }
  }, [queue, modalVisible]);

  if (!current) return null;

  return (
    <BadgeUnlockedModal
      visible={modalVisible}
      badgeId={current.id}
      badgeName={current.name}
      badgeEmoji={BADGE_EMOJI[current.id] ?? "🏅"}
      onClose={() => setModalVisible(false)}
    />
  );
}

// ── Layout racine ─────────────────────────────────────────────
export default function RootLayout() {
  return (
    <UserProvider>
      <AvatarProvider>
        <StatsProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <LevelUpWatcher />
          <BadgeWatcher />
        </StatsProvider>
      </AvatarProvider>
    </UserProvider>
  );
}
