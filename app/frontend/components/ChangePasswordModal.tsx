import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, Image,
  Dimensions, TouchableOpacity, Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import UsernameInput from "./UsernameInput";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

const { width } = Dimensions.get("window");
const owlIcon   = require("../assets/Hibou/cool.png");

export default function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { userId } = useUser();

  const [oldPass,     setOldPass]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const owlShake   = useRef(new Animated.Value(0)).current;
  const owlY       = useRef(new Animated.Value(40)).current;
  const owlOpacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(owlOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(owlY,       { toValue: 0, friction: 6,   useNativeDriver: true }),
      ]).start();
    } else {
      owlOpacity.setValue(0);
      owlY.setValue(40);
    }
  }, [visible]);

  const handleTyping = (setter: (val: string) => void, val: string) => {
    setter(val);
    setError(null);
    Animated.parallel([
      Animated.spring(owlY, { toValue: -15, friction: 4, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(owlShake, { toValue: 2,  duration: 50, useNativeDriver: true }),
        Animated.timing(owlShake, { toValue: -2, duration: 50, useNativeDriver: true }),
        Animated.timing(owlShake, { toValue: 0,  duration: 50, useNativeDriver: true }),
      ]),
    ]).start();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.spring(owlY, { toValue: 0, friction: 5, useNativeDriver: true }).start();
    }, 1500);
  };

  const handleSubmit = async () => {
    // ── Validation ──────────────────────────────────────────────────
    if (!oldPass || !newPass || !confirmPass) {
      setError("Tous les champs sont obligatoires");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPass.length < 6) {
      setError("Minimum 6 caractères");
      return;
    }
    if (newPass.length > 20) {
      setError("Maximum 20 caractères");
      return;
    }
    if (newPass === oldPass) {
      setError("Le nouveau mot de passe doit être différent");
      return;
    }

    if (!userId) {
      setError("Utilisateur introuvable. Reconnecte-toi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ── Étape 1 : Vérifier l'ancien mot de passe dans la table users ──
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("password")
        .eq("id_user", userId)
        .single();

      if (fetchErr || !user) {
        setError("Utilisateur introuvable.");
        setLoading(false);
        return;
      }

      if (user.password !== oldPass) {
        setError("Mot de passe actuel incorrect");
        setLoading(false);
        return;
      }

      // ── Étape 2 : Mettre à jour le mot de passe dans la table users ──
      const { error: updateErr } = await supabase
        .from("users")
        .update({ password: newPass })
        .eq("id_user", userId);

      if (updateErr) {
        setError(updateErr.message);
        setLoading(false);
        return;
      }

      // ── Succès ────────────────────────────────────────────────────
      setSuccess(true);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      setError("Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

        <View style={styles.modalWrapper}>
          <Animated.View style={[styles.owlContainer, {
            opacity:   owlOpacity,
            transform: [{ translateX: owlShake }, { translateY: owlY }],
          }]}>
            <Image source={owlIcon} style={styles.owlImage} resizeMode="contain" />
          </Animated.View>

          <LinearGradient colors={["#D4C5F2", "#C2B4DE", "#9075C4"]} style={styles.modalGradient}>
            <View style={styles.container}>

              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color="#6949a8" />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                  <Ionicons name="shield-checkmark" size={20} color="#5A4C91" />
                  <Text style={styles.headerTitle}>Confidentialité</Text>
                </View>
                <View style={{ width: 30 }} />
              </View>

              <View style={styles.inputArea}>
                <Text style={styles.inputLabel}>Mot de passe actuel :</Text>
                <UsernameInput
                  value={oldPass}
                  onChange={(v) => handleTyping(setOldPass, v)}
                  placeholder="Mot de passe actuel"
                  icon="lock"
                  secure
                />
                <Text style={styles.inputLabel}>Nouveau mot de passe :</Text>
                <UsernameInput
                  value={newPass}
                  onChange={(v) => handleTyping(setNewPass, v)}
                  placeholder="Nouveau mot de passe"
                  icon="lock"
                  secure
                />
                <Text style={styles.inputLabel}>Confirmer le mot de passe :</Text>
                <UsernameInput
                  value={confirmPass}
                  onChange={(v) => handleTyping(setConfirmPass, v)}
                  placeholder="Confirmer le mot de passe"
                  icon="lock"
                  secure
                />
              </View>

              {error   ? <Text style={styles.errorText}>{error}</Text>                      : null}
              {success ? <Text style={styles.successText}>✅ Mot de passe modifié !</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient colors={["#6949a8", "#9574e0"]} style={styles.submitGradient}>
                  <Text style={styles.submitText}>
                    {loading ? "Vérification..." : "Changer le mot de passe"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: "center", alignItems: "center" },
  modalWrapper:   { width: width * 0.9, position: "relative" },
  owlContainer:   { position: "absolute", top: -35, left: -8, zIndex: 1 },
  owlImage:       { width: 75, height: 75 },
  modalGradient:  { borderRadius: 35, borderWidth: 2, borderColor: "#644979", padding: 2, zIndex: 2, backgroundColor: "#D4C5F2" },
  container:      { padding: 20, alignItems: "center" },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 10 },
  backBtn:        { backgroundColor: "#fff", padding: 5, borderRadius: 15 },
  titleRow:       { flexDirection: "row", alignItems: "center", gap: 5 },
  headerTitle:    { fontSize: 18, fontWeight: "bold", color: "#5A4C91" },
  inputArea:      { width: "100%", marginTop: 20 },
  inputLabel:     { fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 8, marginTop: 10 },
  errorText:      { color: "#e05c5c", fontWeight: "700", fontSize: 12, textAlign: "center", marginTop: 10, paddingHorizontal: 8 },
  successText:    { color: "#4caf50", fontWeight: "700", fontSize: 13, textAlign: "center", marginTop: 10 },
  submitBtn:      { width: "80%", marginTop: 20, marginBottom: 10 },
  submitGradient: { paddingVertical: 12, borderRadius: 15, alignItems: "center" },
  submitText:     { color: "white", fontWeight: "bold" },
});