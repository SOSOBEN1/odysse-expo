import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

type Props = {
  active: string;
  onChange: (key: string) => void;
};

const items = [
  { key: "home", label: "Accueil", icon: "home-outline" },
  { key: "missions", label: "Missions", icon: "flag-outline" },
  { key: "shop", label: "Boutique", icon: "cart-outline" },
  { key: "badges", label: "Badges", icon: "ribbon-outline" },
  { key: "defis", label: "Defis", icon: "trophy-outline"  },
  { key: "profile", label: "Profil", icon: "person-outline" },
];

export default function Navbar({ active, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      
      {/* 🔥 Wave SVG */}
     <Svg
  width="100%"
  height={180}   // hauteur finale que tu veux
  viewBox="0 0 400 180"  // correspond à la hauteur
  style={styles.wave}
>
  <Path
    d="M0,60 C100,0 300,180 400,15 L400,170 L0,200 Z"
    fill="rgba(255, 255, 255, 0.62)"  transform="translate(0,20)"
  />
</Svg>

      {/* 🔥 Items */}
      <View style={styles.container}>
        {items.map((item) => {
          const isActive = active === item.key;

          return (
       <TouchableOpacity
  key={item.key}
  onPress={() => onChange(item.key)}
  style={styles.item}
>
  <View
    style={[
      styles.iconBoxWrapper,
      isActive && styles.activeIconWrapper, // fond violet englobe icône + label
    ]}
  >
    <Ionicons
      name={item.icon as any}
      size={25}
      color={isActive ? "#fff" : "#6949A8"} // icône
    />
    <Text
      style={[
        styles.label,
        isActive && styles.activeLabel, // label devient blanc si actif
      ]}
    >
      {item.label}
    </Text>
  </View>
</TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  wave: {
    position: "absolute",
    bottom: 0,
  },
  container: {
    height: 100,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  item: {
    alignItems: "center",
  },
  iconBox: {
    padding: 15,
    borderRadius: 22,
  },
  activeIcon: {
    backgroundColor: "#6949A8",
    
    
  },
  label: {
  fontSize: 11,
  color: "#6949A8", // couleur normale violet
  marginTop: 2,
  fontWeight: "bold",
},
activeLabel: {
  color: "#fff", // blanc si actif
  fontWeight: "600",
},
iconBoxWrapper: {
  alignItems: "center",
  padding: 8,
  borderRadius: 25,
},
activeIconWrapper: {
  backgroundColor: "#6949A8", // fond violet pour icône + label
},


});