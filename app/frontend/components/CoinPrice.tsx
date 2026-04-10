import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CoinPriceProps {
  price: number | string;
  colors?: [string, string, ...string[]]; // Tuple pour éviter l'erreur TS
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconSize?: number;
  label?: string; // Ex: "Acheter"
  isMinus?: boolean; // Pour afficher le "-" rouge/violet
}

const CoinPrice = ({ 
  price, 
  colors = ["#82E0AA", "#2ECC71"], 
  containerStyle, 
  textStyle,
  iconSize = 10,
  label,
  isMinus = false
}: CoinPriceProps) => {
  return (
    <LinearGradient 
      colors={colors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 0 }} 
      style={[styles.gradient, containerStyle]}
    >
      {label && <Text style={[styles.text, textStyle]}>{label} </Text>}
      <View style={[styles.coin, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]} />
      <Text style={[styles.text, textStyle]}>
        {isMinus ? ` -${price}` : ` ${price}`}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  coin: { backgroundColor: '#FFD700', marginHorizontal: 3, borderWidth: 1, borderColor: '#FFF59D' },
});

export default CoinPrice;