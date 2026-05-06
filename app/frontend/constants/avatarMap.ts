// constants/avatarMap.ts
// ─── Map unifiée de tous les avatars (base + boutique) ───────────────────────
// Utilise ce fichier dans TOUS les écrans à la place des AVATAR_MAP locaux :
//   import { AVATAR_MAP, resolveAvatarModel } from "../constants/avatarMap";

export const AVATAR_MAP: Record<string, any> = {
  // ── Avatars de base ────────────────────────────────────────────────────────
  avatar_1: require("../assets/Avatar3D/fille1.glb"),
  avatar_2: require("../assets/Avatar3D/fille3Corrige.glb"),
  avatar_3: require("../assets/Avatar3D/garcon1.glb"),
  avatar_4: require("../assets/Avatar3D/garcon2.glb"),
  avatar_5: require("../assets/Avatar3D/garcon4.glb"),

  // ── Avatars boutique ───────────────────────────────────────────────────────
  avatar_boutique_1: require("../assets/Avatar3D/Girl1Boutique.glb"),
  avatar_boutique_2: require("../assets/Avatar3D/Girl2Boutique.glb"),
  avatar_boutique_3: require("../assets/Avatar3D/Girl3Boutique.glb"),
  avatar_boutique_4: require("../assets/Avatar3D/Girl4Boutique.glb"),
  avatar_boutique_5: require("../assets/Avatar3D/Girl5Boutique.glb"),
  avatar_boutique_6: require("../assets/Avatar3D/Girl6Boutique.glb"),
  avatar_boutique_7: require("../assets/Avatar3D/Girl7Boutique.glb"),
  avatar_boutique_8: require("../assets/Avatar3D/CutieAvatar.glb"),
  avatar_boutique_9: require("../assets/Avatar3D/Cutie1Avatar.glb"),
};

/** Clé de fallback si la clé Supabase est inconnue ou null */
export const DEFAULT_AVATAR_KEY = "avatar_1";

/**
 * Résout une clé avatar (stockée dans Supabase) en modèle GLB.
 * Retourne toujours quelque chose (fallback sur avatar_1).
 *
 * Usage :
 *   const model = resolveAvatarModel(data.avatar_url);
 *   setSelectedModel(model);
 */
export function resolveAvatarModel(avatarKey: string | null | undefined): any {
  if (avatarKey && AVATAR_MAP[avatarKey]) {
    return AVATAR_MAP[avatarKey];
  }
  return AVATAR_MAP[DEFAULT_AVATAR_KEY];
}