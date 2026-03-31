import React, { createContext, useContext, useState } from "react";

type AvatarContextType = {
  selectedModel: any | null;
  setSelectedModel: (model: any) => void;
};

const AvatarContext = createContext<AvatarContextType>({
  selectedModel: null,
  setSelectedModel: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<any>(null);
  return (
    <AvatarContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}