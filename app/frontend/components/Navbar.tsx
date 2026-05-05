import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";
import { useRouter } from "expo-router";

type Props = {
  active: string;
  onChange: (key: string) => void;
  onBeforeNavigate?: (onConfirm: () => void) => void; // ✅ nouveau
};

const items = [
  { key: "home",     label: "Accueil",  icon: "home-outline",   route: "/frontend/screens//Dashbord" },
  { key: "missions", label: "Missions", icon: "flag-outline",    route: "/frontend/screens//Homescreen" },
  { key: "shop",     label: "Boutique", icon: "cart-outline",    route: "/frontend/screens//BoutiqueScreen" },
  { key: "badges",   label: "Badges",   icon: "ribbon-outline",  route: "/frontend/screens//BadgeScreen" },
  { key: "defis",    label: "Defis",    icon: "trophy-outline",  route: "/frontend/screens//Defis" },
  { key: "profile",  label: "Profil",   icon: "person-outline",  route: "/fronend/screens//ProfileScreen" },
];

export default function Navbar({ active, onChange, onBeforeNavigate }: Props) {
  const router = useRouter();

  const handlePress = (item: typeof items[0]) => {
    if (item.key === active) return; // déjà sur cet onglet

    const navigate = () => {
      onChange(item.key);
      router.push(item.route);
    };

    // ✅ Si on est sur missions et qu'il y a une mission en cours → intercepter
    if (active === "missions" && onBeforeNavigate) {
      onBeforeNavigate(navigate);
    } else {
      navigate();
    }
  };

  return (
    <View style={styles.wrapper}>
      <Svg
        width="100%"
        height={180}
        viewBox="0 0 400 180"
        style={styles.wave}
      >
        <Path
          d="M0,60 C100,0 300,180 400,50 L400,170 L0,200 Z"
          fill="rgba(255, 255, 255, 0.62)"
          transform="translate(0,20)"
        />
      </Svg>

      <View style={styles.container}>
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => handlePress(item)}
              style={styles.item}
            >
              <View style={[styles.iconBoxWrapper, isActive && styles.activeIconWrapper]}>
                <Ionicons
                  name={item.icon as any}
                  size={25}
                  color={isActive ? "#fff" : "#6949A8"}
                />
                <Text style={[styles.label, isActive && styles.activeLabel]}>
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
  wrapper:           { position: "absolute", bottom: 0, width: "100%" },
  wave:              { position: "absolute", bottom: 0 },
  container:         { height: 100, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: "transparent", paddingHorizontal: SIZES.padding },
  item:              { alignItems: "center" },
  iconBoxWrapper:    { alignItems: "center", padding: 8, borderRadius: SIZES.radiusLarge },
  activeIconWrapper: { backgroundColor: COLORS.primary, ...SHADOWS.light },
  label:             { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: "600" },
  activeLabel:       { color: COLORS.background, fontWeight: "700" },
});