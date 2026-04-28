
import LottieView from "lottie-react-native";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../styles/theme";

// ── Mapping badge id → fichier Lottie ────────────────────────
const LOTTIE_MAP: Record<number, any> = {
  1:  null,
  2:  require("../assets/lottie/Fire Flame.json"),
  3:  require("../assets/lottie/Blinking Eye.json"),
  4:  require("../assets/lottie/Target Hit!.json"),
  5:  require("../assets/lottie/Calendar.json"),
  6:  require("../assets/lottie/Energizing.json"),
  7:  require("../assets/lottie/star.json"),
  8:  require("../assets/lottie/Heartbeat pulsing - loader.json"),
  9:  require("../assets/lottie/Graduation Hat.json"),
  10: null,
  11: require("../assets/lottie/trophy.json"),
  12: require("../assets/lottie/Lotus Flower.json"),
};

const LOTTIE_SIZE: Record<number, number> = {
  2: 200, 3: 170, 4: 180, 5: 170,
  6: 200, 7: 180, 8: 170, 9: 180,
  11: 200, 12: 180,
};

const LOTTIE_SPEED: Record<number, number> = {
  2: 1, 3: 0.8, 4: 1, 5: 1,
  6: 1.2, 7: 0.9, 8: 1, 9: 1,
  11: 0.8, 12: 0.7,
};

const FALLBACK_EMOJI: Record<number, string> = {
  1:  "👣",
  10: "🏃",
};

export function AnimatedBadgeDisplay({
  badgeId,
  emoji,
}: {
  badgeId: number;
  emoji: string;
}) {
  const source = LOTTIE_MAP[badgeId];
  const size   = LOTTIE_SIZE[badgeId] ?? 170;
  const speed  = LOTTIE_SPEED[badgeId] ?? 1;

  if (!source) {
    return (
      <View style={styles.fallbackContainer}>
        <LottieView
          source={require("../assets/lottie/star.json")}
          autoPlay
          loop
          speed={0.5}
          style={styles.fallbackBg}
          resizeMode="cover"
        />
        <View style={styles.fallbackCircle}>
          <Text style={styles.fallbackEmoji}>
            {FALLBACK_EMOJI[badgeId] ?? emoji}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.lottieWrapper, { width: size, height: size }]}>
      <LottieView
        source={source}
        autoPlay
        loop
        speed={speed}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lottieWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackContainer: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  fallbackCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: `${COLORS.badgeGold}33`,   // badgeGold + 20% opacité
    borderWidth: 2,
    borderColor: `${COLORS.badgeGold}66`,        // badgeGold + 40% opacité
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackEmoji: {
    fontSize: 58,
  },
});