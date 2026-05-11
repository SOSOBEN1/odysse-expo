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
import { COLORS } from "../styles/theme";
import { useSounds } from "../hooks/useSounds";

// ── Types ─────────────────────────────────────────────────────
interface LevelUpModalProps {
  visible:    boolean;
  newLevel:   number;
  goldBonus:  number;
  getsPotion: boolean;
  onClose:    () => void;
}

// ── Confetti ──────────────────────────────────────────────────
interface ConfettiPieceProps {
  x: number; y: number; color: string;
  size: number; delay: number; rotation: number;
}

function ConfettiPiece({ x, y, color, size, delay, rotation }: ConfettiPieceProps) {
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

// ── Données confetti ──────────────────────────────────────────
const CONFETTI: ConfettiPieceProps[] = [
  { x: -130, y: 160, color: COLORS.badgeGold,    size: 11, delay: 80,  rotation: 2   },
  { x:  110, y: 190, color: COLORS.secondary,    size: 9,  delay: 140, rotation: 3   },
  { x:  -90, y: 210, color: COLORS.badgeOrange,  size: 13, delay: 60,  rotation: 1.5 },
  { x:  140, y: 160, color: COLORS.badgeCyan,    size: 8,  delay: 190, rotation: 2.5 },
  { x: -160, y: 140, color: COLORS.badgeGreen,   size: 7,  delay: 110, rotation: 3   },
  { x:   90, y: 230, color: COLORS.badgePink,    size: 12, delay: 50,  rotation: 2   },
  { x:  -70, y: 250, color: COLORS.tertiary,     size: 6,  delay: 170, rotation: 4   },
  { x:  160, y: 120, color: COLORS.badgeGold,    size: 9,  delay: 230, rotation: 1   },
  { x:   50, y: 270, color: COLORS.badgeDefault, size: 10, delay: 85,  rotation: 3   },
  { x: -110, y: 290, color: COLORS.badgeCyan,    size: 8,  delay: 130, rotation: 2   },
  { x:  120, y: 300, color: COLORS.badgeOrange,  size: 9,  delay: 160, rotation: 1.5 },
  { x:  -40, y: 240, color: COLORS.badgeGreen,   size: 7,  delay: 210, rotation: 2.5 },
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

// ── Titre par niveau ──────────────────────────────────────────
function getLevelTitle(level: number): string {
  if (level <= 2)  return "Débutant curieux";
  if (level <= 4)  return "Explorateur de savoir";
  if (level <= 6)  return "Apprenti maître";
  if (level <= 8)  return "Expert confirmé";
  if (level <= 10) return "Maître accompli";
  return "Légende vivante";
}

// ── Modal ─────────────────────────────────────────────────────
export default function LevelUpModal({ visible, newLevel, goldBonus, getsPotion, onClose }: LevelUpModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.3)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const titleSlide      = useRef(new Animated.Value(-30)).current;
  const levelScale      = useRef(new Animated.Value(0)).current;
  const levelPulse      = useRef(new Animated.Value(1)).current;
  const glowOpacity     = useRef(new Animated.Value(0)).current;
  const btnSlide        = useRef(new Animated.Value(40)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;
  const ringRotate      = useRef(new Animated.Value(0)).current;
  const confettiKey     = useRef(0);
    const { playSound } = useSounds();

  useEffect(() => {
    if (!visible) return;
    confettiKey.current += 1;
playSound("missionReussie");
    backdropOpacity.setValue(0); cardScale.setValue(0.3);  cardOpacity.setValue(0);
    titleSlide.setValue(-30);    levelScale.setValue(0);   glowOpacity.setValue(0);
    btnSlide.setValue(40);       btnOpacity.setValue(0);   levelPulse.setValue(1);
    ringRotate.setValue(0);

    Animated.sequence([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(titleSlide, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(levelScale,  { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnSlide,   { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Pulsation infinie du badge de niveau
      Animated.loop(
        Animated.sequence([
          Animated.timing(levelPulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(levelPulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      // Rotation lente de l'anneau
      Animated.loop(
        Animated.timing(ringRotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    });
  }, [visible]);

  if (!visible) return null;

  const ringDeg = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const levelTitle = getLevelTitle(newLevel);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>

        {/* Confetti */}
        {CONFETTI.map((c, i) => (
          <ConfettiPiece key={`${confettiKey.current}-${i}`} {...c} />
        ))}
        {SPARKS.map((s, i) => <Spark key={i} {...s} />)}

        <Animated.View style={[styles.card, {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        }]}>

          {/* Lottie trophée en fond */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <LottieView
              source={require("../assets/lottie/trophy.json")}
              autoPlay
              loop
              speed={0.4}
              style={{ width: "100%", height: "100%", opacity: 0.07 }}
              resizeMode="cover"
            />
          </View>

          {/* Titre */}
          <Animated.Text style={[styles.title, { transform: [{ translateY: titleSlide }] }]}>
            Niveau supérieur !
          </Animated.Text>
          <Text style={styles.subtitle}>MONTÉE DE NIVEAU</Text>

          {/* Badge de niveau */}
          <View style={styles.badgeWrapper}>
            <Animated.View style={[styles.glowCircle, { opacity: glowOpacity }]} />

            {/* Anneau rotatif */}
            <Animated.View style={[styles.ring, { transform: [{ rotate: ringDeg }] }]}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.ringDot,
                    {
                      transform: [
                        { rotate: `${i * 30}deg` },
                        { translateY: -82 },
                      ],
                      backgroundColor: i % 3 === 0 ? COLORS.badgeGold : COLORS.secondary,
                      opacity: i % 3 === 0 ? 1 : 0.4,
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Cercle principal niveau */}
            <Animated.View style={[styles.levelCircle, {
              transform: [{ scale: Animated.multiply(levelScale, levelPulse) }],
            }]}>
              <Text style={styles.levelEmoji}>⬆️</Text>
              <Text style={styles.levelNumber}>{newLevel}</Text>
              <Text style={styles.levelLabel}>NIVEAU</Text>
            </Animated.View>
          </View>

          {/* Titre du niveau */}
          <Text style={styles.levelTitle}>{levelTitle}</Text>
          <Text style={styles.levelDesc}>
            Tu es maintenant niveau {newLevel} !{"\n"}Continue comme ça 🚀
          </Text>

          {/* ── Récompenses ── */}
          <View style={styles.rewardsRow}>
            {goldBonus > 0 && (
              <View style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>🪙 +{goldBonus} gold</Text>
              </View>
            )}
            {getsPotion && (
              <View style={[styles.rewardChip, { backgroundColor: "#1e3a2a" }]}>
                <Text style={styles.rewardChipText}>🧪 +1 potion</Text>
              </View>
            )}
          </View>

          {/* Bouton */}
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
    borderColor: COLORS.badgeGold,
    shadowColor: COLORS.badgeGold,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.modalTitle,
    letterSpacing: 0.5,
    marginBottom: 2,
    textShadowColor: COLORS.badgeGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.badgeGold,
    letterSpacing: 3,
    marginBottom: 10,
  },
  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 220,
    height: 220,
    marginBottom: 14,
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.badgeGold,
    opacity: 0.15,
    shadowColor: COLORS.badgeGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
  },
  ring: {
    position: "absolute",
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  ringDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#1a0a3a",
    borderWidth: 3,
    borderColor: COLORS.badgeGold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.badgeGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  levelEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  levelNumber: {
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.badgeGold,
    lineHeight: 40,
    textShadowColor: COLORS.badgeGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.badgeGold,
    letterSpacing: 2,
    opacity: 0.8,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.badgeGold,
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: COLORS.badgeGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  levelDesc: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
    opacity: 0.9,
  },
  rewardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  rewardChip: {
    backgroundColor: "#1a0a3a",
    borderWidth: 1.5,
    borderColor: COLORS.badgeGold,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rewardChipText: {
    color: COLORS.badgeGold,
    fontWeight: "800",
    fontSize: 14,
  },
  btn: {
    backgroundColor: COLORS.badgeGold,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff3a0",
    shadowColor: COLORS.badgeGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  btnText: {
    color: "#1a0a3a",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});