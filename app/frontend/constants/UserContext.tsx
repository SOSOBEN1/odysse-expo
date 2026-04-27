import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserContextType = {
  userId: number | null;
  setUserId: (id: number) => void;
  username: string;
  setUsername: (name: string) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
  username: "",
  setUsername: () => {},
  isLoading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId,    setUserIdState]   = useState<number | null>(null);
  const [username,  setUsernameState] = useState<string>("");
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const savedId       = await AsyncStorage.getItem("userId");
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedId)       setUserIdState(Number(savedId));
        if (savedUsername) setUsernameState(savedUsername);
      } catch (e) {
        console.warn("Erreur chargement UserContext:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setUserId = async (id: number) => {
    try { await AsyncStorage.setItem("userId", String(id)); } catch {}
    setUserIdState(id);
  };

  const setUsername = async (name: string) => {
    try { await AsyncStorage.setItem("username", name); } catch {}
    setUsernameState(name);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, username, setUsername, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);