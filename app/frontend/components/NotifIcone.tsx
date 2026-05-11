import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

interface Props {
  onPress?: () => void;
  count?: number;
}

export default function NotifIcone({ onPress, count = 0 }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: "center", alignItems: "center",
    ...SHADOWS.light,
  },
  badge: {
    position: "absolute", top: 2, right: 2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#FF3B30",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});