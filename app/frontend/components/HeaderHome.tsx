import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  userName: string;
  level: number;
  xp: number;
  maxXp: number;
  coins: number;
  avatarUri?: string;
};

export default function HeaderHome({ userName, level, xp, maxXp, coins, avatarUri }: Props) {
  const xpPercent = (xp / maxXp) * 100;

  return (
    <LinearGradient colors={["#7c3aed", "#a78bfa"]} style={styles.container}>
      {/* Top row: coins + icons */}
      <View style={styles.topRow}>
        <View style={styles.coinsBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </View>
        <View style={styles.icons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileRow}>
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>🧑</Text>
            </View>
          )}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Niv. {level}</Text>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.name}>{userName}!</Text>
          </Text>
          <Text style={styles.sunEmoji}>☀️</Text>

          {/* XP Bar */}
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {xp.toLocaleString()} XP / {maxXp.toLocaleString()} XP
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5b21b6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  coinIcon: { fontSize: 16 },
  coinsText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  icons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff22",
    justifyContent: "center",
    alignItems: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ddd6fe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarEmoji: { fontSize: 36 },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  levelText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  infoBlock: { flex: 1 },
  greeting: { color: "#e9d5ff", fontSize: 16, marginBottom: 4 },
  name: { color: "#fff", fontWeight: "800", fontSize: 17 },
  sunEmoji: { position: "absolute", top: 0, right: 0, fontSize: 18 },
  xpBarBg: {
    height: 8,
    backgroundColor: "#ffffff33",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: "#fde68a",
    borderRadius: 10,
  },
  xpText: { color: "#e9d5ff", fontSize: 11, marginTop: 4 },
});