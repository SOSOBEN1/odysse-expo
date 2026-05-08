// import React, { createContext, useContext, useEffect, useState } from "react";
// import * as SecureStore from "expo-secure-store";

// type UserContextType = {
//   userId: number | null;
//   setUserId: (id: number) => void;
//   username: string;
//   setUsername: (name: string) => void;
//   isLoading: boolean;
// };

// const UserContext = createContext<UserContextType>({
//   userId: null,
//   setUserId: () => {},
//   username: "",
//   setUsername: () => {},
//   isLoading: true,
// });

// export const UserProvider = ({ children }: { children: React.ReactNode }) => {
//   const [userId,    setUserIdState]   = useState<number | null>(null);
//   const [username,  setUsernameState] = useState<string>("");
//   const [isLoading, setIsLoading]     = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const savedId       = await SecureStore.getItemAsync("userId");
//         const savedUsername = await SecureStore.getItemAsync("username");
//         if (savedId)       setUserIdState(Number(savedId));
//         if (savedUsername) setUsernameState(savedUsername);
//       } catch (e) {
//         console.warn("Erreur chargement UserContext:", e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const setUserId = async (id: number) => {
//     try { await SecureStore.setItemAsync("userId", String(id)); } catch {}
//     setUserIdState(id);
//   };

//   const setUsername = async (name: string) => {
//     try { await SecureStore.setItemAsync("username", name); } catch {}
//     setUsernameState(name);
//   };

//   return (
//     <UserContext.Provider value={{ userId, setUserId, username, setUsername, isLoading }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

type UserContextType = {
  userId: number | null;
  setUserId: (id: number) => void;
  username: string;
  setUsername: (name: string) => void;
  gender: string | null;
  setGender: (g: string) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
  username: "",
  setUsername: () => {},
  gender: null,
  setGender: () => {},
  isLoading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [username, setUsernameState] = useState<string>("");
  const [gender, setGenderState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const savedId = await SecureStore.getItemAsync("userId");
        const savedUsername = await SecureStore.getItemAsync("username");
        const savedGender = await SecureStore.getItemAsync("userGender");
        
        if (savedId) setUserIdState(Number(savedId));
        if (savedUsername) setUsernameState(savedUsername);
        if (savedGender) setGenderState(savedGender);
      } catch (e) {
        console.warn("Erreur chargement UserContext:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setUserId = async (id: number) => {
    try { await SecureStore.setItemAsync("userId", String(id)); } catch {}
    setUserIdState(id);
  };

  const setUsername = async (name: string) => {
    try { await SecureStore.setItemAsync("username", name); } catch {}
    setUsernameState(name);
  };

  const setGender = async (g: string) => {
    try { await SecureStore.setItemAsync("userGender", g); } catch {}
    setGenderState(g);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, username, setUsername, gender, setGender, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); // constants/avatarMap.ts
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