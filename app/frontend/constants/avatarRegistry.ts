// ⚠️ Les require() DOIVENT être statiques ici — ne jamais les déplacer ou dynamiser
// React Native résout les chemins require() uniquement au build time.

export const AVATAR_REGISTRY: Record<number, any> = {
  1: require("../assets/Avatar3D/fille1Corrige.glb"),
  2: require("../assets/Avatar3D/fille2Corrige.glb"),
  3: require("../assets/Avatar3D/fille3Corrige.glb"),
  4: require("../assets/Avatar3D/garcon1Corrige.glb"),
  5: require("../assets/Avatar3D/garcon2Corrige.glb"),
  6: require("../assets/Avatar3D/garcon3Corrige.glb"),
};

export const AVATARS = [
  { id: 1, gender: "Feminin" },
  { id: 2, gender: "Feminin" },
  { id: 3, gender: "Feminin" },
  { id: 4, gender: "Masculin" },
  { id: 5, gender: "Masculin" },
  { id: 6, gender: "Masculin" },
];
