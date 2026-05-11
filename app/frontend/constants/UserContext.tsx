import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type UserContextType = {
  userId:      number | null;
  setUserId:   (id: number)   => Promise<void>;
  username:    string;
  setUsername: (name: string) => Promise<void>;
  gender:      string | null;
  setGender:   (g: string)    => Promise<void>;
  isLoading:   boolean;
};

const UserContext = createContext<UserContextType>({
  userId:      null,
  setUserId:   async () => {},
  username:    "",
  setUsername: async () => {},
  gender:      null,
  setGender:   async () => {},
  isLoading:   true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId,    setUserIdState]   = useState<number | null>(null);
  const [username,  setUsernameState] = useState<string>("");
  const [gender,    setGenderState]   = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const savedId       = await SecureStore.getItemAsync("userId");
        const savedUsername = await SecureStore.getItemAsync("username");
        const savedGender   = await SecureStore.getItemAsync("userGender");

        if (savedId)       setUserIdState(Number(savedId));
        if (savedUsername) setUsernameState(savedUsername);
        if (savedGender)   setGenderState(savedGender);
      } catch (e) {
        console.warn("Erreur chargement UserContext:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setUserId = async (id: number): Promise<void> => {
    try { await SecureStore.setItemAsync("userId", String(id)); } catch {}
    setUserIdState(id);
  };

  const setUsername = async (name: string): Promise<void> => {
    try { await SecureStore.setItemAsync("username", name); } catch {}
    setUsernameState(name);
  };

  const setGender = async (g: string): Promise<void> => {
    try { await SecureStore.setItemAsync("userGender", g); } catch {}
    setGenderState(g);
  };

  return (
    <UserContext.Provider value={{
      userId, setUserId,
      username, setUsername,
      gender, setGender,
      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);