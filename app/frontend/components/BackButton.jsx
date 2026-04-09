import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function BackButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => router.back()}
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

    // shadow comme login
    shadowColor: "#6949a8",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
});