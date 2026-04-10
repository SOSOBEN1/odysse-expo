import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";


interface BackButtonProps {
  onPress?: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
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