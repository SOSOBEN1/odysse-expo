import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";
import { useRouter } from "expo-router";

interface Props {
  onPress?: () => void;
}

export default function SettingIcone({ onPress }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        router.push("../screens/SettingsScreen");
        onPress?.(); // optionnel si tu veux garder callback
      }}
    >
      <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,

    // 👇 ta couleur ici
    backgroundColor: COLORS.card,

    justifyContent: "center",
    alignItems: "center",

    ...SHADOWS.light,
  },
});