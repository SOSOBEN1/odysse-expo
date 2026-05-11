import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { checkAndUnlockBadges } from "../backend/services/badgeEngine";
import BadgeUnlockedModal from "./frontend/components/BadgeUnlockedModel";
import LevelUpModal from "./frontend/components/LevelUpModal";
import { AvatarProvider } from "./frontend/constants/AvatarContext";
import { StatsProvider } from "./frontend/constants/StatsContext";
import { supabase } from "./frontend/constants/supabase";
import { useNotifications } from './frontend/constants/UseNotifications';
import { UserProvider, useUser } from "./frontend/constants/UserContext";

// ── Nécessaire pour fermer le browser OAuth proprement ───────
WebBrowser.maybeCompleteAuthSession();

// ── Badge meta (emoji) ────────────────────────────────────────
const BADGE_EMOJI: Record<number, string> = {
  1:"👣", 2:"🔥", 3:"👁️", 4:"🎯", 5:"📅", 6:"⚡", 7:"⭐", 8:"❤️",
  9:"🎓", 10:"🏃", 11:"🏆", 12:"🌸", 13:"🌬️", 14:"🧘", 15:"💚",
  16:"😴", 17:"🏋️", 18:"🥗", 19:"🌿", 20:"📖", 21:"🧠", 22:"💡",
  23:"🗺️", 24:"📚", 25:"🗓️", 26:"🍅", 27:"♟️", 28:"🚀", 29:"📐",
  30:"🌟", 31:"💪", 32:"🛡️", 33:"👑", 34:"🦁", 35:"🔍", 36:"⚔️", 37:"💎",
};

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
    if (!userId) return;
    let isMounted = true;

    const checkLevel = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("xp")
          .eq("id_user", userId)
          .single();

        if (!isMounted || !data) return;

        const niveauActuel = calcNiveauFromXP(data.xp ?? 0);

        if (lastNiveauRef.current === null) {
          lastNiveauRef.current = niveauActuel;
          return;
        }

        if (niveauActuel > lastNiveauRef.current) {
          lastNiveauRef.current = niveauActuel;
          setLevelUpModal({ visible: true, newLevel: niveauActuel });
        }
      } catch (e) {
        console.error("[LevelUpWatcher]", e);
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
  const [queue,        setQueue]        = useState<{ id: number; name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [current,      setCurrent]      = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const check = async () => {
      try {
        const unlocked = await checkAndUnlockBadges(userId);
        if (!isMounted || unlocked.length === 0) return;

        const { data } = await supabase
          .from("badges")
          .select("id_badge, nom")
          .in("nom", unlocked);

        if (!isMounted || !data?.length) return;

        const newBadges = data.map((b: any) => ({ id: b.id_badge, name: b.nom }));
        setQueue(prev => [...prev, ...newBadges]);
      } catch {}
    };

    check();
    const interval = setInterval(check, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [userId]);

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

// ── Gestionnaire OAuth deep link ──────────────────────────────
// Écoute le retour de Google OAuth et redirige proprement
function OAuthHandler() {
  const router = useRouter();
  const { setUserId, setUsername } = useUser();

  useEffect(() => {
    // Écoute les changements de session Supabase
    // Quand Google OAuth réussit, onAuthStateChange se déclenche
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const authUserId = session.user.id;

          // Vérifie si le profil existe dans users
          const { data } = await supabase
            .from("users")
            .select("id_user, username, prenom, nom")
            .eq("auth_id", authUserId)
            .maybeSingle();

          if (!data) {
            // Nouveau compte Google → inscription
            router.push({
              pathname: "/frontend/screens/Register",
              params: {
                fromGoogle:  "true",
                authId:      authUserId,
                emailGoogle: session.user.email ?? "",
              },
            });
          }
          // Si profil existe → Login.tsx gère déjà la redirection
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

// ── Layout racine ─────────────────────────────────────────────
export default function RootLayout() {
  useNotifications();

  return (
    <UserProvider>
      <AvatarProvider>
        <StatsProvider>
          <OAuthHandler />
          <Stack screenOptions={{ headerShown: false }} />
          <LevelUpWatcher />
          <BadgeWatcher />
        </StatsProvider>
      </AvatarProvider>
    </UserProvider>
  );
}