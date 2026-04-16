import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../styles/theme";

interface Props {
  onPress?: () => void;
  hasNotification?: boolean;
}

export default function NotifIcone({ onPress, hasNotification = true }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />

      {/* 🔴 badge */}
      {hasNotification && <View style={styles.badge} />}
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

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
});