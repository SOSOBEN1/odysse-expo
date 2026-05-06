import React, { createContext, useContext, useState } from "react";
import { AVATAR_MAP, resolveAvatarModel, DEFAULT_AVATAR_KEY } from "./avatarMap";

type AvatarContextType = {
  selectedModel: any | null;
  setSelectedModel: (model: any) => void;
  setSelectedKey: (key: string) => void;
};

const AvatarContext = createContext<AvatarContextType>({
  selectedModel: null,
  setSelectedModel: () => {},
  setSelectedKey: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  // On stocke directement le modèle en mémoire — pas besoin de persister
  // car ProfileScreen recharge depuis Supabase à chaque focus
  const [selectedModel, setSelectedModelState] = useState<any>(
    resolveAvatarModel(DEFAULT_AVATAR_KEY)
  );

  const setSelectedModel = (model: any) => {
    setSelectedModelState(model);
  };

  // Utilitaire pratique si tu veux passer une clé directement
  const setSelectedKey = (key: string) => {
    setSelectedModelState(resolveAvatarModel(key));
  };

  return (
    <AvatarContext.Provider value={{ selectedModel, setSelectedModel, setSelectedKey }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}