// components/GoldCoin.tsx
import { View, Text, StyleSheet } from "react-native";

interface GoldCoinProps {
  size?: number;
}

export const GoldCoin = ({ size = 16 }: GoldCoinProps) => (
  <View
    style={[
      styles.coin,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      },
    ]}
  >
    <Text style={[styles.text, { fontSize: size * 0.52 }]}></Text>
  </View>
);

const styles = StyleSheet.create({
  coin: {
    backgroundColor: "#F5C518",
    borderWidth: 1.5,
    borderColor: "#C8960C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C8960C",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  text: {
    color: "#7A5800",
    fontWeight: "900",
    lineHeight: undefined,
    includeFontPadding: false,
  },
});