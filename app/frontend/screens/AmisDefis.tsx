// screens/DefierAmisScreen.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import InviteFriendModal from "../components/InviteFriendModal";
import { useRouter } from "expo-router";


const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Friend {
  id: number;
  name: string;
  avatarColor: string;
  hairColor: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FRIENDS: Friend[] = [
  { id: 1, name: "Ariana", avatarColor: "#F48FB1", hairColor: "#5D3A1A" },
  { id: 2, name: "David",  avatarColor: "#90CAF9", hairColor: "#3E2723" },
  { id: 3, name: "Aylin",  avatarColor: "#CE93D8", hairColor: "#4A235A" },
  { id: 4, name: "Tom",    avatarColor: "#A5D6A7", hairColor: "#2E2E2E" },
];

// ─── Mini Avatar SVG ──────────────────────────────────────────────────────────
const MiniAvatar = ({ color, hairColor }: { color: string; hairColor: string }) => (
  <Svg width={46} height={46} viewBox="0 0 46 46">
    <Circle cx={23} cy={23} r={22} fill={color} />
    <Circle cx={23} cy={20} r={9} fill="#FDDBB4" />
    <Path
      d={`M14 18 Q14 8 23 8 Q32 8 32 18 Q30 12 23 12 Q16 12 14 18 Z`}
      fill={hairColor}
    />
    <Path d={`M10 46 Q10 34 23 34 Q36 34 36 46 Z`} fill={color} opacity={0.8} />
    <Path d={`M13 44 Q13 36 23 36 Q33 36 33 44 Z`} fill="#fff" opacity={0.35} />
  </Svg>
);

// ─── Checkmark circle ─────────────────────────────────────────────────────────
const CheckCircle = ({ selected }: { selected: boolean }) => (
  <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
    {selected && (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path
          d="M4 9L7.5 12.5L14 6"
          stroke="#fff"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )}
  </View>
);

// ─── Friend Row ───────────────────────────────────────────────────────────────
interface FriendRowProps {
  friend: Friend;
  selected: boolean;
  onToggle: () => void;
  delay: number;
}

const FriendRow = ({ friend, selected, onToggle, delay }: FriendRowProps) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          { scale },
        ],
      }}
    >
      <TouchableOpacity
        style={[styles.friendRow, selected && styles.friendRowSelected]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.avatarWrapper}>
          <MiniAvatar color={friend.avatarColor} hairColor={friend.hairColor} />
        </View>
        <Text style={styles.friendName}>{friend.name}</Text>
        <CheckCircle selected={selected} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Background sparkles ──────────────────────────────────────────────────────
const BgSparkles = () => (
  <Svg
    width={width}
    height={height}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Path d="M28 110 H40 M34 104 V116" stroke={COLORS.secondary} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <Path d={`M${width - 36} 160 H${width - 24} M${width - 30} 154 V166`} stroke={COLORS.secondary} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
    <Circle cx={width - 20} cy={200} r={3}   fill={COLORS.primaryLight} opacity={0.5} />
    <Circle cx={20}         cy={300} r={2.5} fill={COLORS.primaryLight} opacity={0.4} />
    <Circle cx={width - 30} cy={380} r={2}   fill={COLORS.primaryLight} opacity={0.45} />
    <Circle cx={45}         cy={450} r={3}   fill={COLORS.primaryLight} opacity={0.35} />
    <Circle cx={width - 15} cy={520} r={2}   fill={COLORS.primaryLight} opacity={0.4} />
    <Path d={`M${width-55} 130 L${width-52} 122 L${width-49} 130 L${width-57} 126 L${width-47} 126 Z`}
      fill={COLORS.primaryLight} opacity={0.4} />
    <Path d="M55 380 L58 372 L61 380 L53 376 L63 376 Z"
      fill={COLORS.primaryLight} opacity={0.35} />
  </Svg>
);

// ─── Header icons ─────────────────────────────────────────────────────────────
const HeaderIcons = () => (
  <View style={styles.headerIcons}>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
          stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
        <Circle cx={18} cy={6} r={4} fill="#FF5252" />
      </Svg>
    </TouchableOpacity>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3} stroke={COLORS.primary} strokeWidth={2} />
        <Path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round"
        />
      </Svg>
    </TouchableOpacity>
  </View>
);

// ─── DefierAmisScreen ─────────────────────────────────────────────────────────
export default function DefierAmisScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([1, 2, 3]);
  const [modalVisible, setModalVisible] = useState(false);

  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, {
      toValue: 1, useNativeDriver: true, tension: 55, friction: 9,
    }).start();
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canContinue = selected.length > 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background sparkles */}
      <BgSparkles />

      {/* ── Top bar: BackButton left, icons right ── */}
      <View style={styles.topBar}>
             <BackButton  onPress={() => router.push("/frontend/screens/Defis")} />
        <HeaderIcons />
      </View>

      {/* ── Main content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange:[0,1], outputRange:[-16,0] }) }],
          }}
        >
          <Text style={styles.pageTitle}>Défiez vos amis !</Text>
          <Text style={styles.pageSubtitle}>
            Lance un défi avec tes amis pour{"\n"}progresser ensemble
          </Text>
        </Animated.View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>Selectionne tes amis</Text>

        {/* Friend list card */}
        <View style={styles.listCard}>
          {FRIENDS.map((f, i) => (
            <React.Fragment key={f.id}>
              <FriendRow
                friend={f}
                selected={selected.includes(f.id)}
                onToggle={() => toggle(f.id)}
                delay={i * 80}
              />
              {i < FRIENDS.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>

        {/* Add friend button — opens modal */}
        <TouchableOpacity
          style={styles.addFriendBtn}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <Svg width={14} height={14} viewBox="0 0 18 18" fill="none">
            <Circle cx={9} cy={9} r={8} fill={COLORS.primary} />
            <Path d="M9 5V13M5 9H13" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.addFriendText}>Ajouter un Ami</Text>
        </TouchableOpacity>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* ── CTA "Poursuivre" ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
          activeOpacity={canContinue ? 0.85 : 1}
            onPress={() => router.push("/frontend/screens/createDefis")}
        >
          <Text style={styles.ctaBtnText}>Poursuivre</Text>
        </TouchableOpacity>
      </View>

      {/* ── Navbar ── */}
      <Navbar active="defis" onChange={() => {}} />

      {/* ── Invite Friend Modal ── */}
      <InviteFriendModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onInvite={(email) => {
          console.log("Invited:", email);
          // handle invite logic here
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },

  // ── Header icons ──
  headerIcons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 24,
    
  },

  // ── Title ──
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
    fontFamily: "Georgia",
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 26,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
  },

  // ── Friend list card ──
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...SHADOWS.medium,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    gap: 14,
  },
  friendRowSelected: {
    backgroundColor: `${COLORS.primary}08`,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    ...SHADOWS.light,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  // ── Check circle ──
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.purple,
  },

  // ── Separator ──
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
    opacity: 0.6,
  },

  // ── Add friend (plus petit) ──
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    alignSelf: "center",          // ne prend plus toute la largeur
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}0D`,
  },
  addFriendText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // ── CTA ──

  ctaBar: {
  paddingHorizontal: SIZES.padding,
  paddingBottom: 125,       // espace entre CTA et Navbar
  paddingTop: 12,
  backgroundColor: COLORS.background,
},
  ctaBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
     marginTop: -75,
    paddingVertical: 16,
    alignItems: "center",
    ...SHADOWS.purple,
    
    
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
