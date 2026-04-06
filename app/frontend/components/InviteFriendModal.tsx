// components/InviteFriendModal.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";

// ✅ UNE SEULE interface (corrigé)
export interface InviteFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite?: (email: string) => void;
}

// ─── Icons ─────────────────────────────────────────
const TargetIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
    <Circle cx={12} cy={12} r={6} stroke="#fff" strokeWidth={2} />
    <Circle cx={12} cy={12} r={2} fill="#fff" />
    <Path d="M19 5 L20 3 L21 5 L19 5 Z" fill="#fff" opacity={0.9} />
  </Svg>
);

const EmailIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={COLORS.textLight}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 6l-10 7L2 6"
      stroke={COLORS.textLight}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Deco ──────────────────────────────────────────
const SparklesDeco = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <View style={[styles.sparkle, { top: 10, right: 16, width: 6, height: 6, borderRadius: 3, backgroundColor: `${COLORS.primaryLight}60` }]} />
    <View style={[styles.sparkle, { top: 24, right: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: `${COLORS.primaryLight}40` }]} />
    <View style={[styles.sparkle, { bottom: 14, left: 12, width: 5, height: 5, borderRadius: 3, backgroundColor: `${COLORS.primaryLight}50` }]} />
  </View>
);

// ─── Component ─────────────────────────────────────
export default function InviteFriendModal({
  visible,
  onClose,
  onInvite,
}: InviteFriendModalProps) {
  const [email, setEmail] = useState("");
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 60, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleInvite = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    onInvite?.(trimmed);
    setEmail("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* backdrop */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.backdrop,
              { opacity: opacityAnim },
            ]}
          />
        </Pressable>

        {/* card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <SparklesDeco />

          <Text style={styles.title}>Email</Text>

          <View style={styles.inputWrapper}>
            <EmailIcon />
            <TextInput
              style={styles.input}
              placeholder="Enter Email Address"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.inviteBtn, !email.trim() && styles.inviteBtnDisabled]}
            onPress={handleInvite}
            activeOpacity={0.85}
          >
            <TargetIcon />
            <Text style={styles.inviteBtnText}>Invite tes amis</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: SIZES.padding,
    paddingBottom: 100,
  },
  backdrop: {
    backgroundColor: "rgba(45, 31, 94, 0.35)",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    ...SHADOWS.medium,
  },
  sparkle: {
    position: "absolute",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 14,
    gap: 10,
    ...SHADOWS.purple,
  },
  inviteBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  inviteBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});