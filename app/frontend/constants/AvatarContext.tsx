import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AvatarContextType = {
  selectedModel: any | null;
  setSelectedModel: (model: any) => void;
};

const AvatarContext = createContext<AvatarContextType>({
  selectedModel: null,
  setSelectedModel: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedAvatarModel");
        if (saved) setSelectedModelState(JSON.parse(saved));
      } catch (e) {
        console.warn("Erreur chargement avatar:", e);
      }
    };
    load();
  }, []);

  const setSelectedModel = async (model: any) => {
    try {
      await AsyncStorage.setItem("selectedAvatarModel", JSON.stringify(model));
    } catch (e) {
      console.warn("Erreur sauvegarde avatar:", e);
    }
    setSelectedModelState(model);
  };

  return (
    <AvatarContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}