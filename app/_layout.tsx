import { UserProvider } from "./frontend/constants/UserContext";
import { AvatarProvider } from "./frontend/constants/AvatarContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <UserProvider>
      <AvatarProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AvatarProvider>
    </UserProvider>
  );
}