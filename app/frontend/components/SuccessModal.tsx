import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ── Confetti particle ───────────────────────────────────────
const CONF_COLORS = [
  "#f9c74f", "#7f5af0", "#22c55e", "#0ea5e9",
  "#f8961e", "#ec4899", "#ffffff", "#a78bfa",
];

const CONF_PARTICLES = [
  { x: -120, delay: 80,  color: 0 },
  { x:  100, delay: 150, color: 1 },
  { x:  -70, delay: 60,  color: 2 },
  { x:  130, delay: 200, color: 3 },
  { x: -140, delay: 100, color: 4 },
  { x:   75, delay: 250, color: 5 },
  { x:  -40, delay: 170, color: 6 },
  { x:  110, delay: 90,  color: 7 },
  { x:  -90, delay: 220, color: 0 },
  { x:   50, delay: 130, color: 2 },
];

interface ConfettiParticleProps {
  x: number;
  delay: number;
  color: number;
}

function ConfettiParticle({ x, delay, color }: ConfettiParticleProps) {
  const ty = useRef(new Animated.Value(-10)).current;
  const op = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ty.setValue(-10);
    op.setValue(0);
    rot.setValue(0);

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(op,  { toValue: 1,   duration: 180, useNativeDriver: true }),
        Animated.timing(ty,  { toValue: 260, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      ]),
      Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={[
      styles.confettiDot,
      {
        backgroundColor: CONF_COLORS[color],
        opacity: op,
        transform: [{ translateX: x }, { translateY: ty }, { rotate: spin }],
      },
    ]} />
  );
}

// ── Star burst ──────────────────────────────────────────────
interface StarBurstProps {
  visible: boolean;
}

function StarBurst({ visible }: StarBurstProps) {
  const sc   = useRef(new Animated.Value(0)).current;
  const rays = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    sc.setValue(0);
    rays.setValue(0);

    Animated.sequence([
      Animated.spring(sc,   { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(rays, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.starContainer, { transform: [{ scale: sc }] }]}>
      {/* Glow ring */}
      <Animated.View style={[styles.starGlow, { opacity: rays }]} />
      <Text style={styles.starEmoji}>⭐</Text>
    </Animated.View>
  );
}

// ── Puzzle piece icon ────────────────────────────────────────
interface PuzzleWonProps {
  visible: boolean;
}

function PuzzleWon({ visible }: PuzzleWonProps) {
  const sc = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!visible) return;
    sc.setValue(0);
    translateY.setValue(20);

    Animated.delay(600).start(() => {
      Animated.parallel([
        Animated.spring(sc,         { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    });
  }, [visible]);

  return (
    <Animated.View style={[styles.puzzleWonRow, { opacity: sc, transform: [{ scale: sc }, { translateY }] }]}>
      <Text style={styles.puzzleWonText}>Tu as gagné une pièce de puzzle !</Text>
      <Text style={styles.puzzleEmoji}>🧩</Text>
    </Animated.View>
  );
}

// ── Main component ───────────────────────────────────────────
interface SuccessModalProps {
  visible: boolean;
  xp: number;
  missionImg?: string;
  onContinue: () => void;
}

export default function SuccessModal({ visible, xp, missionImg, onContinue }: SuccessModalProps) {
  const cardSc   = useRef(new Animated.Value(0.3)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const xpSc     = useRef(new Animated.Value(0)).current;
  const xpY      = useRef(new Animated.Value(24)).current;
  const btnSc    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    cardSc.setValue(0.3);
    cardFade.setValue(0);
    xpSc.setValue(0);
    xpY.setValue(24);
    btnSc.setValue(0);

    Animated.sequence([
      // Card entrance
      Animated.parallel([
        Animated.spring(cardSc,  { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(cardFade,{ toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      // XP counter pop
      Animated.parallel([
        Animated.spring(xpSc, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.spring(xpY,  { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Button appear
      Animated.spring(btnSc, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* Confetti */}
        <View style={styles.confettiLayer} pointerEvents="none">
          {CONF_PARTICLES.map((p, i) => (
            <ConfettiParticle key={i} x={p.x} delay={p.delay} color={p.color} />
          ))}
        </View>

        {/* Sparkle dots */}
        <View style={[styles.sparkle, { top: 60,  left: 40 }]}><Text style={styles.sparkleText}>✦</Text></View>
        <View style={[styles.sparkle, { top: 80,  right: 50 }]}><Text style={styles.sparkleText}>✧</Text></View>
        <View style={[styles.sparkle, { top: 120, right: 30 }]}><Text style={styles.sparkleText}>✦</Text></View>
        <View style={[styles.sparkle, { top: 50,  left: 80 }]}><Text style={styles.sparkleText}>✧</Text></View>

        {/* Card */}
        <Animated.View style={[
          styles.card,
          { opacity: cardFade, transform: [{ scale: cardSc }] },
        ]}>
          <Text style={styles.title}>Félicitations !</Text>
          <Text style={styles.subtitle}>Mission accomplie</Text>

          {missionImg ? (
            <View style={styles.missionImgBox}>
              <Image source={{ uri: missionImg }} style={styles.missionImgFull} resizeMode="cover" />
              <View style={styles.starOverlay}>
                <Text style={{ fontSize: 32 }}>⭐</Text>
              </View>
            </View>
          ) : (
            <StarBurst visible={visible} />
          )}

          {/* XP */}
          <Animated.View style={{ alignItems: "center", transform: [{ scale: xpSc }, { translateY: xpY }] }}>
            <Text style={styles.xpText}>+{xp} XP</Text>
          </Animated.View>

          <PuzzleWon visible={visible} />

          {/* Button */}
          <Animated.View style={{ width: "100%", transform: [{ scale: btnSc }] }}>
            <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continuer</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,8,50,0.82)",
    justifyContent: "center",
    alignItems: "center",
  },

  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  confettiDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 3,
    top: "50%",
    left: "50%",
  },

  sparkle: { position: "absolute" },
  sparkleText: { color: "#c4b5fd", fontSize: 18, opacity: 0.7 },

  card: {
    width: 300,
    backgroundColor: "#7f5af0",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#a78bfa",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#c4b5fd",
    fontWeight: "600",
    marginBottom: 20,
  },

  missionImgBox: {
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  missionImgFull: { width: "100%", height: "100%" },
  starOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  starContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  starGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(249,199,79,0.25)",
  },
  starEmoji: { fontSize: 72, lineHeight: 80 },

  xpText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#f9c74f",
    marginBottom: 8,
    letterSpacing: -1,
  },

  puzzleWonRow: {
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  puzzleWonText: {
    fontSize: 13,
    color: "#e9d5ff",
    fontWeight: "600",
    textAlign: "center",
  },
  puzzleEmoji: { fontSize: 30, marginTop: 4 },

  continueBtn: {
    marginTop: 22,
    backgroundColor: "#5b21b6",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#a78bfa",
  },
  continueBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
