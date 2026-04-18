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
  ViewStyle,
} from "react-native";

// ── Confetti ────────────────────────────────────────────────
const CONF_COLORS = [
  "#f9c74f", "#7f5af0", "#22c55e", "#0ea5e9",
  "#f8961e", "#ec4899", "#ffffff", "#a78bfa",
];

const CONF_PARTICLES = [
  { x: -110, delay: 100, color: 0, size: 10 },
  { x:   95, delay: 60,  color: 1, size: 8  },
  { x:  -80, delay: 180, color: 2, size: 12 },
  { x:  120, delay: 140, color: 3, size: 9  },
  { x: -130, delay: 220, color: 4, size: 7  },
  { x:   65, delay: 80,  color: 5, size: 11 },
  { x:  -50, delay: 260, color: 6, size: 8  },
  { x:  105, delay: 200, color: 7, size: 10 },
  { x:  -95, delay: 120, color: 0, size: 9  },
  { x:   40, delay: 160, color: 3, size: 7  },
];

interface ConfettiParticleProps {
  x: number;
  delay: number;
  color: number;
  size: number;
}

function ConfettiParticle({ x, delay, color, size }: ConfettiParticleProps) {
  const ty  = useRef(new Animated.Value(-15)).current;
  const op  = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ty.setValue(-15);
    op.setValue(0);
    rot.setValue(0);

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(op,  { toValue: 1,   duration: 200, useNativeDriver: true }),
        Animated.timing(ty,  { toValue: 270, duration: 1350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1,   duration: 1350, useNativeDriver: true }),
      ]),
      Animated.timing(op, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "450deg"] });

  return (
    <Animated.View style={[
      {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        borderRadius: 2,
        backgroundColor: CONF_COLORS[color],
      },
      { opacity: op, transform: [{ translateX: x }, { translateY: ty }, { rotate: spin }] },
    ]} />
  );
}

// ── Sparkle ──────────────────────────────────────────────────
interface SparkleProps {
  style: ViewStyle;
}

function Sparkle({ style }: SparkleProps) {
  const op = useRef(new Animated.Value(0.2)).current;
  const sc = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(op, { toValue: 0.9, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sc, { toValue: 1.2, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(op, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sc, { toValue: 0.7, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: op, transform: [{ scale: sc }] }]}>
      <Text style={{ color: "#c4b5fd", fontSize: 16 }}>✦</Text>
    </Animated.View>
  );
}

// ── Main component ───────────────────────────────────────────
interface ZoneUnlockedModalProps {
  visible: boolean;
  zoneName: string;
  zoneImage: string;
  onExplore: () => void;
}

export default function ZoneUnlockedModal({
  visible,
  zoneName,
  zoneImage,
  onExplore,
}: ZoneUnlockedModalProps) {
  const cardSc   = useRef(new Animated.Value(0.3)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const imgSc    = useRef(new Animated.Value(0.5)).current;
  const txtY     = useRef(new Animated.Value(30)).current;
  const txtFade  = useRef(new Animated.Value(0)).current;
  const badgeSc  = useRef(new Animated.Value(0)).current;
  const btnSc    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    cardSc.setValue(0.3);
    cardFade.setValue(0);
    imgSc.setValue(0.5);
    txtY.setValue(30);
    txtFade.setValue(0);
    badgeSc.setValue(0);
    btnSc.setValue(0);

    Animated.sequence([
      // Card in
      Animated.parallel([
        Animated.spring(cardSc,  { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(cardFade,{ toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      // Image pop
      Animated.spring(imgSc, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.delay(100),
      // Badge
      Animated.spring(badgeSc, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(80),
      // Text + button
      Animated.parallel([
        Animated.spring(txtY,   { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(txtFade,{ toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(btnSc,  { toValue: 1, friction: 6, delay: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View
          style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center" }]}
          pointerEvents="none"
        >
          {CONF_PARTICLES.map((p, i) => (
            <ConfettiParticle key={i} x={p.x} delay={p.delay} color={p.color} size={p.size} />
          ))}
        </View>

        {/* Sparkles */}
        <Sparkle style={{ position: "absolute", top: 55,  left: 38 }} />
        <Sparkle style={{ position: "absolute", top: 75,  right: 48 }} />
        <Sparkle style={{ position: "absolute", top: 130, right: 28 }} />
        <Sparkle style={{ position: "absolute", top: 45,  left: 90 }} />

        {/* Card */}
        <Animated.View style={[
          styles.card,
          { opacity: cardFade, transform: [{ scale: cardSc }] },
        ]}>
          <Text style={styles.title}>Nouvelle zone{"\n"}débloquée !</Text>

          {/* Zone image */}
          <Animated.View style={[styles.imgBox, { transform: [{ scale: imgSc }] }]}>
            <Image source={{ uri: zoneImage }} style={styles.zoneImg} resizeMode="cover" />
            <View style={styles.imgOverlay} />
            <View style={styles.imgBottomOverlay} />
          </Animated.View>

          {/* Badge */}
          <Animated.View style={[styles.badge, { transform: [{ scale: badgeSc }] }]}>
            <View style={styles.badgeInner}>
              <Text style={styles.badgeText}>🎉  {zoneName} débloquée</Text>
            </View>
          </Animated.View>

          {/* Hint text */}
          <Animated.Text style={[
            styles.hint,
            { opacity: txtFade, transform: [{ translateY: txtY }] },
          ]}>
            Continue tes missions pour explorer le monde !
          </Animated.Text>

          {/* Button */}
          <Animated.View style={{ width: "100%", transform: [{ scale: btnSc }] }}>
            <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.85}>
              <Text style={styles.exploreBtnText}>Explorer</Text>
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

  card: {
    width: 310,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2d1a6e",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 18,
    letterSpacing: 0.2,
  },

  imgBox: {
    width: 220,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 0,
    position: "relative",
    borderWidth: 2,
    borderColor: "#ede9fe",
  },
  zoneImg: { width: "100%", height: "100%" },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  imgBottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  badge: {
    marginTop: -18,
    marginBottom: 16,
    zIndex: 2,
  },
  badgeInner: {
    backgroundColor: "#7f5af0",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  hint: {
    fontSize: 13,
    color: "#9b87c9",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: "500",
  },

  exploreBtn: {
    backgroundColor: "#7f5af0",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  exploreBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
