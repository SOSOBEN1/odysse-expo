import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

interface BackButtonProps {
  onPress?: () => void;
  fallback?: string; // route de secours si pas d'écran derrière
}

export default function BackButton({ onPress, fallback }: BackButtonProps) {
  const router = useRouter();
  const defaultFallback = "/frontend/screens/start";

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push((fallback ?? defaultFallback) as any);
    }
  };

  return (
    <TouchableOpacity
      style={styles.backBtn}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={20} color="#6949a8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F0FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6949a8",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
});
