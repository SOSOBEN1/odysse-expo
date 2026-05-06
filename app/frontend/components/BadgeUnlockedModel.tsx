import LottieView from "lottie-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedBadgeDisplay } from "./Animatedbadgedisplay";
import { COLORS } from "../styles/theme";

// ── Types ─────────────────────────────────────────────────────
interface ConfettiPiece {
  x: number; y: number; color: string;
  size: number; delay: number; rotation: number;
}

interface BadgeUnlockedModalProps {
  visible: boolean;
  badgeId?: number;
  badgeName?: string;
  badgeEmoji?: string;
  onClose: () => void;
}

// ── Confetti ──────────────────────────────────────────────────
function ConfettiPiece({ x, y, color, size, delay, rotation }: ConfettiPiece) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1,        duration: 200,  useNativeDriver: true }),
        Animated.spring(scale,      { toValue: 1,        friction: 4,    useNativeDriver: true }),
        Animated.timing(translateY, { toValue: y,        duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: x,        duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotate,     { toValue: rotation, duration: 1400, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] });

  return (
    <Animated.View style={{
      position: "absolute", top: "50%", left: "50%",
      width: size, height: size, borderRadius: size / 4,
      backgroundColor: color, opacity,
      transform: [{ translateX }, { translateY }, { rotate: rot }, { scale }],
    }} />
  );
}

// ── Spark ─────────────────────────────────────────────────────
function Spark({ x, y, size, delay, color }: {
  x: number; y: number; size: number; delay: number; color: string;
}) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale,   { toValue: 1, friction: 3, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(800),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={{
      position: "absolute", top: y, left: x,
      fontSize: size, color, opacity,
      transform: [{ scale }],
    }}>✦</Animated.Text>
  );
}

// ── Data ──────────────────────────────────────────────────────
const CONFETTI: ConfettiPiece[] = [
  { x: -120, y: 180, color: COLORS.badgeGold,   size: 10, delay: 100, rotation: 2   },
  { x: 100,  y: 200, color: COLORS.badgeDefault, size: 8,  delay: 150, rotation: 3   },
  { x: -80,  y: 220, color: COLORS.badgeOrange,  size: 12, delay: 80,  rotation: 1.5 },
  { x: 130,  y: 170, color: COLORS.badgeCyan,    size: 9,  delay: 200, rotation: 2.5 },
  { x: -150, y: 150, color: COLORS.badgeGreen,   size: 7,  delay: 120, rotation: 3   },
  { x: 80,   y: 240, color: COLORS.badgePink,    size: 11, delay: 60,  rotation: 2   },
  { x: -60,  y: 260, color: COLORS.tertiary,     size: 6,  delay: 180, rotation: 4   },
  { x: 150,  y: 130, color: COLORS.badgeGold,    size: 8,  delay: 250, rotation: 1   },
  { x: 40,   y: 280, color: COLORS.badgeDefault, size: 10, delay: 90,  rotation: 3   },
  { x: -100, y: 300, color: COLORS.badgeCyan,    size: 7,  delay: 140, rotation: 2   },
  { x: 110,  y: 310, color: COLORS.badgeOrange,  size: 9,  delay: 170, rotation: 1.5 },
  { x: -30,  y: 250, color: COLORS.badgeGreen,   size: 8,  delay: 220, rotation: 2.5 },
];

const SPARKS = [
  { x: 20,  y: 20,  size: 16, delay: 0,   color: COLORS.secondary  },
  { x: 255, y: 30,  size: 12, delay: 300, color: COLORS.tertiary   },
  { x: 10,  y: 240, size: 14, delay: 600, color: COLORS.badgeGold  },
  { x: 265, y: 220, size: 10, delay: 150, color: COLORS.iconBg     },
  { x: 140, y: 10,  size: 18, delay: 450, color: COLORS.tertiary   },
  { x: 50,  y: 300, size: 12, delay: 750, color: COLORS.badgeOrange },
  { x: 235, y: 300, size: 14, delay: 200, color: COLORS.badgeCyan  },
];

// ── Modal ─────────────────────────────────────────────────────
export default function BadgeUnlockedModal({
  visible,
  badgeId    = 0,
  badgeName  = "Badge",
  badgeEmoji = "🏅",
  onClose,
}: BadgeUnlockedModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.3)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const titleSlide      = useRef(new Animated.Value(-30)).current;
  const badgeScale      = useRef(new Animated.Value(0)).current;
  const badgePulse      = useRef(new Animated.Value(1)).current;
  const glowOpacity     = useRef(new Animated.Value(0)).current;
  const btnSlide        = useRef(new Animated.Value(40)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;
  const coinBounce      = useRef(new Animated.Value(-20)).current;
  const coinOpacity     = useRef(new Animated.Value(0)).current;
  const confettiKey     = useRef(0);

  useEffect(() => {
    if (!visible) return;
    confettiKey.current += 1;

    backdropOpacity.setValue(0); cardScale.setValue(0.3);  cardOpacity.setValue(0);
    titleSlide.setValue(-30);    badgeScale.setValue(0);   glowOpacity.setValue(0);
    btnSlide.setValue(40);       btnOpacity.setValue(0);
    coinBounce.setValue(-20);    coinOpacity.setValue(0);  badgePulse.setValue(1);

    Animated.sequence([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(titleSlide,  { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(badgeScale,  { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(coinBounce,  { toValue: 0, friction: 5, useNativeDriver: true }),
        Animated.timing(coinOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnSlide,   { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(badgePulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>

        {CONFETTI.map((c, i) => (
          <ConfettiPiece key={`${confettiKey.current}-${i}`} {...c} />
        ))}
        {SPARKS.map((s, i) => <Spark key={i} {...s} />)}

        <Animated.View style={[styles.card, {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        }]}>

          {/* Lottie subtil en fond */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <LottieView
              source={require("../assets/lottie/star.json")}
              autoPlay
              loop
              speed={0.35}
              style={{ width: "100%", height: "100%", opacity: 0.08 }}
              resizeMode="cover"
            />
          </View>

          <Animated.Text style={[styles.title, { transform: [{ translateY: titleSlide }] }]}>
            Félicitations !
          </Animated.Text>
          <Text style={styles.subtitle}>BADGE DÉBLOQUÉ</Text>
          <Text style={styles.badgeName}>{badgeName}</Text>

          <View style={styles.badgeWrapper}>
            <Animated.View style={[styles.glowCircle, { opacity: glowOpacity }]} />
            <Animated.View style={{
              transform: [{ scale: Animated.multiply(badgeScale, badgePulse) }],
            }}>
              <AnimatedBadgeDisplay badgeId={badgeId} emoji={badgeEmoji} />
            </Animated.View>
            <Animated.View style={[styles.coinBadge, {
              opacity: coinOpacity,
              transform: [{ translateY: coinBounce }],
            }]}>
              <Text style={styles.coinText}>🪙 +10</Text>
            </Animated.View>
          </View>

          <Animated.View style={{
            opacity: btnOpacity,
            transform: [{ translateY: btnSlide }],
            width: "100%",
          }}>
            <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.btnText}>Super ! 🎉</Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBg,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 310,
    backgroundColor: COLORS.modalCard,
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.modalBorder,
    shadowColor: COLORS.modalBorder,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 50,
    elevation: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.modalTitle,
    letterSpacing: 0.5,
    marginBottom: 2,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.modalSubtitle,
    letterSpacing: 3,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.modalBadgeName,
    marginBottom: 14,
    letterSpacing: 0.3,
    textShadowColor: COLORS.modalBadgeName,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    width: 220,
    height: 220,
  },
  glowCircle: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: COLORS.modalGlow,
    shadowColor: COLORS.modalGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 70,
    elevation: 0,
  },
  coinBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.modalCoinBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: COLORS.modalCoinBorder,
    shadowColor: COLORS.modalCoinBorder,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  coinText: {
    color: COLORS.modalCoinText,
    fontWeight: "900",
    fontSize: 13,
  },
  btn: {
    backgroundColor: COLORS.modalBtn,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.modalBtnBorder,
    shadowColor: COLORS.modalBtn,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  btnText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});