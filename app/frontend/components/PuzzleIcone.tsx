import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../styles/theme";

interface Props {
  onPress?: () => void;
}

export default function PuzzleIcone({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="extension-puzzle-outline" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
});
