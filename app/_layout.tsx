import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { checkAndUnlockBadges } from "../backend/services/badgeEngine";
import BadgeUnlockedModal from "./frontend/components/BadgeUnlockedModel";
import LevelUpModal from "./frontend/components/LevelUpModal";
import MissionStatusModal from "./frontend/components/MissionStatusModals";
import { AvatarProvider } from "./frontend/constants/AvatarContext";
import { MissionStatusProvider, useMissionStatus } from "./frontend/constants/MissionStatusContext";
import { StatsProvider } from "./frontend/constants/StatsContext";
import { supabase } from "./frontend/constants/supabase";
import { useNotifications } from './frontend/constants/UseNotifications';
import { UserProvider, useUser } from "./frontend/constants/UserContext";
import { useBackgroundMusic } from './frontend/hooks/useBackgroundMusic';

WebBrowser.maybeCompleteAuthSession();

const BADGE_EMOJI: Record<number, string> = {
  1:"👣", 2:"🔥", 3:"👁️", 4:"🎯", 5:"📅", 6:"⚡", 7:"⭐", 8:"❤️",
  9:"🎓", 10:"🏃", 11:"🏆", 12:"🌸", 13:"🌬️", 14:"🧘", 15:"💚",
  16:"😴", 17:"🏋️", 18:"🥗", 19:"🌿", 20:"📖", 21:"🧠", 22:"💡",
  23:"🗺️", 24:"📚", 25:"🗓️", 26:"🍅", 27:"♟️", 28:"🚀", 29:"📐",
  30:"🌟", 31:"💪", 32:"🛡️", 33:"👑", 34:"🦁", 35:"🔍", 36:"⚔️", 37:"💎",
};

// ── Gold par badge ─────────────────────────────────────────────
const BADGE_GOLD: Record<number, number> = {
  1:25, 2:50,  3:25,  4:50,  5:25,  6:25,  7:50,  8:25,
  9:100, 10:100, 11:200, 12:50, 13:50, 14:50, 15:100,
  16:100, 17:50, 18:25, 19:150, 20:25, 21:50, 22:100,
  23:100, 24:150, 25:25, 26:50, 27:100, 28:100, 29:150,
  30:200, 31:25, 32:25, 33:200, 34:200, 35:25, 36:25, 37:200,
};

const XP_PAR_NIVEAU = 500;
function calcNiveauFromXP(xp: number): number {
  return Math.floor(xp / XP_PAR_NIVEAU) + 1;
}

// ── Watcher global modal mission ──────────────────────────────
function MissionStatusWatcher() {
  const { statusModal, closeStatusModal } = useMissionStatus();
  return (
    <MissionStatusModal
      visible={statusModal.visible}
      type={statusModal.type}
      missionTitle={statusModal.missionTitle}
      dateLimit={statusModal.dateLimit}
      xp={statusModal.xp}
      coins={statusModal.coins}
      onClose={closeStatusModal}
    />
  );
}

// ── Détecteur global de montée de niveau ─────────────────────
function LevelUpWatcher() {
  const { userId } = useUser();
  const [levelUpModal, setLevelUpModal] = useState<{
    visible: boolean; newLevel: number; goldBonus: number; getsPotion: boolean;
  }>({ visible: false, newLevel: 1, goldBonus: 0, getsPotion: false });
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

          try {
            const goldBonus = niveauActuel <= 3  ? 50
                            : niveauActuel <= 6  ? 100
                            : niveauActuel <= 9  ? 175
                            : 250;

            const { data: uData } = await supabase
              .from("users").select("gold").eq("id_user", userId).maybeSingle();
            await supabase.from("users")
              .update({ gold: (uData?.gold ?? 0) + goldBonus })
              .eq("id_user", userId);

            const getsPotion = [3, 5, 7, 10].includes(niveauActuel) || niveauActuel > 10;
            if (getsPotion) {
              const { data: pData } = await supabase
                .from("user_potions").select("quantite")
                .eq("id_user", userId).eq("potion_type", "energie").maybeSingle();
              await supabase.from("user_potions").upsert(
                { id_user: userId, potion_type: "energie", quantite: (pData?.quantite ?? 0) + 1, updated_at: new Date().toISOString() },
                { onConflict: "id_user,potion_type" }
              );
            }

            setLevelUpModal({ visible: true, newLevel: niveauActuel, goldBonus, getsPotion: !!getsPotion });
          } catch {
            setLevelUpModal({ visible: true, newLevel: niveauActuel, goldBonus: 0, getsPotion: false });
          }
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
      goldBonus={levelUpModal.goldBonus}
      getsPotion={levelUpModal.getsPotion}
      onClose={() => setLevelUpModal(prev => ({ ...prev, visible: false }))}
    />
  );
}

// ── Détecteur global de badges ────────────────────────────────
function BadgeWatcher() {
  const { userId } = useUser();
  const [queue, setQueue]               = useState<{ id: number; name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [current, setCurrent]           = useState<{ id: number; name: string } | null>(null);

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
      goldReward={BADGE_GOLD[current.id] ?? 30}
      onClose={() => setModalVisible(false)}
    />
  );
}

// ── Gestionnaire OAuth ────────────────────────────────────────
function OAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== 'SIGNED_IN' || !session?.user) return

        // Ignorer connexions email/password
        const provider = session.user.app_metadata?.provider
        if (provider !== 'google') return

        const authUserId = session.user.id

        const { data } = await supabase
          .from("users")
          .select("id_user")
          .eq("auth_id", authUserId)
          .maybeSingle()

        if (!data) {
          router.push({
            pathname: "/frontend/screens/Register",
            params: {
              fromGoogle:  "true",
              authId:      authUserId,
              emailGoogle: session.user.email ?? "",
            },
          })
        }
        // Si profil existe → Login.tsx gère via syncProfileAndRedirect
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}

// ── Layout racine ─────────────────────────────────────────────
export default function RootLayout() {
  useNotifications()
  useBackgroundMusic()

  return (
    <UserProvider>
      <AvatarProvider>
        <StatsProvider>
          <MissionStatusProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <LevelUpWatcher />
            <BadgeWatcher />
            <MissionStatusWatcher />
          </MissionStatusProvider>
        </StatsProvider>
      </AvatarProvider>
    </UserProvider>
  );
}