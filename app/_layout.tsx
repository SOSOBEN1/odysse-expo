import { Slot } from "expo-router";
import { AvatarProvider } from "./frontend/constants/AvatarContext";

export default function Layout() {
  return (
    <AvatarProvider>
      <Slot />
    </AvatarProvider>
  );
}