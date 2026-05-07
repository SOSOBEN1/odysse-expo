export const AVATAR_MAP: Record<string, any> = {
  // ── Avatars de base ─────────────────────────────────────────────────────
  avatar_1: require("../assets/Avatar3D/fille1.glb"),
  avatar_2: require("../assets/Avatar3D/fille3Corrige.glb"),
  avatar_3: require("../assets/Avatar3D/garcon1.glb"),
  avatar_4: require("../assets/Avatar3D/garcon2.glb"),
  avatar_5: require("../assets/Avatar3D/garcon4.glb"),

  // ── Boutique Féminin ─────────────────────────────────────────────────────
  avatar_boutique_f_1: require("../assets/Avatar3D/Girl1Boutique.glb"),
  avatar_boutique_f_2: require("../assets/Avatar3D/Girl2Boutique.glb"),
  avatar_boutique_f_3: require("../assets/Avatar3D/Girl3Boutique.glb"),
  avatar_boutique_f_4: require("../assets/Avatar3D/Girl4Boutique.glb"),
  avatar_boutique_f_5: require("../assets/Avatar3D/Girl5Boutique.glb"),
  avatar_boutique_f_6: require("../assets/Avatar3D/Girl6Boutique.glb"),
  avatar_boutique_f_7: require("../assets/Avatar3D/Girl7Boutique.glb"),
  avatar_boutique_f_8: require("../assets/Avatar3D/CutieAvatar.glb"),
  avatar_boutique_f_9: require("../assets/Avatar3D/Cutie1Avatar.glb"),

  // ── Boutique Masculin ────────────────────────────────────────────────────
  // 🔁 Remplace ces fichiers par tes vrais GLB masculins boutique
  avatar_boutique_m_1: require("../assets/Avatar3D/boutiquegarcon1.glb"),
  avatar_boutique_m_2: require("../assets/Avatar3D/Boy1.glb"),
  avatar_boutique_m_3: require("../assets/Avatar3D/Boy2boutique.glb"),
  avatar_boutique_m_4: require("../assets/Avatar3D/Boy3boutique.glb"),
  avatar_boutique_m_5: require("../assets/Avatar3D/Boy4boutique.glb"),
  avatar_boutique_m_6: require("../assets/Avatar3D/Boy5boutique.glb"),
  avatar_boutique_m_7: require("../assets/Avatar3D/Boy6boutique.glb"),
  avatar_boutique_m_8: require("../assets/Avatar3D/Boy7boutique.glb"),

};

/** Genre de chaque avatar boutique — utilisé pour filtrer par genre utilisateur */
export const AVATAR_BOUTIQUE_GENDER: Record<string, "Feminin" | "Masculin"> = {
  avatar_boutique_f_1: "Feminin",
  avatar_boutique_f_2: "Feminin",
  avatar_boutique_f_3: "Feminin",
  avatar_boutique_f_4: "Feminin",
  avatar_boutique_f_5: "Feminin",
  avatar_boutique_f_6: "Feminin",
  avatar_boutique_f_7: "Feminin",
  avatar_boutique_f_8: "Feminin",
  avatar_boutique_f_9: "Feminin",
  avatar_boutique_m_1: "Masculin",
  avatar_boutique_m_2: "Masculin",
  avatar_boutique_m_3: "Masculin",
  avatar_boutique_m_4: "Masculin",
  avatar_boutique_m_5: "Masculin",
  avatar_boutique_m_6: "Masculin",
  avatar_boutique_m_7: "Masculin",
  avatar_boutique_m_8: "Masculin",
  avatar_boutique_m_9: "Masculin",
};

export const DEFAULT_AVATAR_KEY = "avatar_1";

export function resolveAvatarModel(avatarKey: string | null | undefined): any {
  if (avatarKey && AVATAR_MAP[avatarKey]) return AVATAR_MAP[avatarKey];
  return AVATAR_MAP[DEFAULT_AVATAR_KEY];
}