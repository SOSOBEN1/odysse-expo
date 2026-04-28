import { supabase } from "../../app/frontend/constants/supabase";

// ─────────────────────────────────────────────────────────────
// 🎯 FINAL REWARD SYSTEM (SOURCE UNIQUE)
// ─────────────────────────────────────────────────────────────

export async function finishMission(
  userId: number,
  missionId: number,
  elapsedSeconds: number
) {
  // 1️⃣ récupérer mission
  const { data: mission, error } = await supabase
    .from("mission")
    .select("*")
    .eq("id_mission", missionId)
    .single();

  if (error || !mission) {
    throw new Error("Mission introuvable");
  }

  // 2️⃣ calcul XP
  const baseXp = mission.xp_gain ?? 0;
  const timeXp = Math.max(10, Math.round(elapsedSeconds / 60) * 2);
  const xp = baseXp + timeXp;

  // 3️⃣ calcul gold
  const gold =
    (mission.difficulte ?? 1) * 10 +
    (mission.priorite ?? 1) * 5;

  // 4️⃣ récupérer user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("xp, gold")
    .eq("id_user", userId)
    .single();

  if (userError || !user) {
    throw new Error("User introuvable");
  }

  // 5️⃣ update user stats
  await supabase
    .from("users")
    .update({
      xp: (user.xp ?? 0) + xp,
      gold: (user.gold ?? 0) + gold,
    })
    .eq("id_user", userId);

  // 6️⃣ update mission status
  await supabase
    .from("mission")
    .update({ statut: "done" })
    .eq("id_mission", missionId);

  // 7️⃣ insert validation
  await supabase.from("mission_validation").insert({
    id_user: userId,
    id_mission: missionId,
    date_fin: new Date().toISOString(),
    xp_obtenu: xp,
  });

  // 8️⃣ badges (si tu as déjà la fonction)
  // await checkAndUnlockBadges(userId);

  return { xp, gold };
}