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

function Confetti({ x, y, color, size, delay, rotation }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale,      { toValue: 1, friction: 4,   useNativeDriver: true }),
        Animated.timing(translateY, { toValue: y, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: x, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotate,     { toValue: rotation, duration: 1400, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(opacity,  { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] });

  return (
    <Animated.View
      style={{
        position: "absolute", top: "50%", left: "50%",
        width: size, height: size, borderRadius: size / 4,
        backgroundColor: color, opacity,
        transform: [{ translateX }, { translateY }, { rotate: rot }, { scale }],
      }}
    />
  );
}

function SparkStar({ x, y, size, delay, color = "#c4b5fd" }) {
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
        Animated.delay(600),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={{ position: "absolute", top: y, left: x, fontSize: size, color, opacity, transform: [{ scale }] }}>
      ✦
    </Animated.Text>
  );
}

function GlowRay({ angle, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.25, duration: 600, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.2,  duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0,   duration: 600, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 0.5, duration: 600, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", width: 3, height: 80,
        backgroundColor: "#9d6fe8", borderRadius: 3,
        top: "50%", left: "50%", marginLeft: -1.5, marginTop: -100,
        opacity, transform: [{ rotate: `${angle}deg` }, { scaleY: scale }],
      }}
    />
  );
}

const CONFETTI = [
  { x: -120, y: 180, color: "#f9c74f", size: 10, delay: 100, rotation: 2 },
  { x: 100,  y: 200, color: "#7f5af0", size: 8,  delay: 150, rotation: 3 },
  { x: -80,  y: 220, color: "#f8961e", size: 12, delay: 80,  rotation: 1.5 },
  { x: 130,  y: 170, color: "#4cc9f0", size: 9,  delay: 200, rotation: 2.5 },
  { x: -150, y: 150, color: "#90be6d", size: 7,  delay: 120, rotation: 3 },
  { x: 80,   y: 240, color: "#e84393", size: 11, delay: 60,  rotation: 2 },
  { x: -60,  y: 260, color: "#c4b5fd", size: 6,  delay: 180, rotation: 4 },
  { x: 150,  y: 130, color: "#f9c74f", size: 8,  delay: 250, rotation: 1 },
  { x: 40,   y: 280, color: "#7f5af0", size: 10, delay: 90,  rotation: 3 },
  { x: -100, y: 300, color: "#4cc9f0", size: 7,  delay: 140, rotation: 2 },
  { x: 110,  y: 310, color: "#f8961e", size: 9,  delay: 170, rotation: 1.5 },
  { x: -30,  y: 250, color: "#90be6d", size: 8,  delay: 220, rotation: 2.5 },
];

const SPARKS = [
  { x: 20,  y: 20,  size: 16, delay: 0,   color: "#a78bfa" },
  { x: 260, y: 30,  size: 12, delay: 300, color: "#c4b5fd" },
  { x: 10,  y: 240, size: 14, delay: 600, color: "#f9c74f" },
  { x: 270, y: 220, size: 10, delay: 150, color: "#ddd6fe" },
  { x: 140, y: 10,  size: 18, delay: 450, color: "#c4b5fd" },
  { x: 50,  y: 300, size: 12, delay: 750, color: "#f8961e" },
  { x: 240, y: 300, size: 14, delay: 200, color: "#4cc9f0" },
];

const RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default function BadgeUnlockedModal({ visible, badgeName = "Missionnaire", badgeEmoji = "🏆", onClose }) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.3)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const titleSlide      = useRef(new Animated.Value(-30)).current;
  const badgeScale      = useRef(new Animated.Value(0)).current;
  const badgePulse      = useRef(new Animated.Value(1)).current;
  const badgeRotate     = useRef(new Animated.Value(0)).current;
  const btnSlide        = useRef(new Animated.Value(40)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;
  const glowOpacity     = useRef(new Animated.Value(0)).current;
  const coinBounce      = useRef(new Animated.Value(-20)).current;
  const coinOpacity     = useRef(new Animated.Value(0)).current;
  const confettiKey     = useRef(0);

  useEffect(() => {
    if (!visible) return;
    confettiKey.current += 1;

    backdropOpacity.setValue(0); cardScale.setValue(0.3); cardOpacity.setValue(0);
    titleSlide.setValue(-30); badgeScale.setValue(0); badgePulse.setValue(1);
    badgeRotate.setValue(0); btnSlide.setValue(40); btnOpacity.setValue(0);
    glowOpacity.setValue(0); coinBounce.setValue(-20); coinOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.spring(titleSlide, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(badgeScale,  { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(badgeRotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
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
          Animated.timing(badgePulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(badgePulse, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });
  }, [visible]);

  const badgeRot = badgeRotate.interpolate({ inputRange: [0, 1], outputRange: ["-15deg", "0deg"] });

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>

        {CONFETTI.map((c, i) => <Confetti key={`${confettiKey.current}-${i}`} {...c} />)}
        {SPARKS.map((s, i) => <SparkStar key={i} {...s} />)}

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <View style={styles.raysContainer} pointerEvents="none">
            {RAYS.map((angle, i) => <GlowRay key={i} angle={angle} delay={i * 80} />)}
          </View>

          <Animated.Text style={[styles.title, { transform: [{ translateY: titleSlide }] }]}>
            Félicitation !
          </Animated.Text>

          <Text style={styles.badgeName}>{badgeName}</Text>

          <View style={styles.badgeWrapper}>
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
            <Animated.View style={{ transform: [{ scale: Animated.multiply(badgeScale, badgePulse) }, { rotate: badgeRot }] }}>
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeEmoji}>{badgeEmoji}</Text>
              </View>
            </Animated.View>
            <Animated.View style={[styles.coinBadge, { opacity: coinOpacity, transform: [{ translateY: coinBounce }] }]}>
              <Text style={styles.coinText}>🪙+10</Text>
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: btnOpacity, transform: [{ translateY: btnSlide }], width: "100%" }}>
            <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.btnText}>Super!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(120, 80, 200, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Card violet clair ──
  card: {
    width: 300,
    backgroundColor: "#d8c9f8",       // violet clair pastel
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: "#c4b5fd",
  },

  raysContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#3b0764",                  // violet très foncé, lisible sur fond clair
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  badgeName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6d28d9",
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    position: "relative",
    width: 160,
    height: 160,
  },

  glow: {
    position: "absolute",
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: "#f9c74f",
    shadowColor: "#f9c74f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 0,
  },

  badgeCircle: {
    width: 130, height: 130,
    borderRadius: 65,
    backgroundColor: "#ede9fe",
    borderWidth: 3,
    borderColor: "#c4b5fd",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f9c74f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },

  badgeEmoji: { fontSize: 70 },

  coinBadge: {
    position: "absolute",
    bottom: 6, right: 0,
    backgroundColor: "#ede9fe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#f9c74f",
  },
  coinText: { color: "#6d28d9", fontWeight: "800", fontSize: 13 },

  btn: {
    backgroundColor: "#7f5af0",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#a78bfa",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 0.5 },
});