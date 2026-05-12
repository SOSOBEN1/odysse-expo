import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ScrollView } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  initialData?: any;
};

const EVENT_TYPES = [
  { id: "examen",     label: "Examen",     icon: "🎓", image: require("../assets/images/examen.png") },
  { id: "soutenance", label: "Soutenance", icon: "🎓", image: require("../assets/images/soutenance.png") },
  { id: "projet",     label: "Projet",     icon: "⚙️", image: require("../assets/images/projet.png") },
];

// ─── Date Picker simple (sans lib native) ─────────────────────────────────────
const DatePickerSimple = ({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) => {
  const today = new Date();
  const [day,   setDay]   = useState(value ? String(value.getDate()).padStart(2, "0")   : "");
  const [month, setMonth] = useState(value ? String(value.getMonth() + 1).padStart(2, "0") : "");
  const [year,  setYear]  = useState(value ? String(value.getFullYear()) : String(today.getFullYear()));

  const commit = (d: string, m: string, y: string) => {
    const dd = parseInt(d), mm = parseInt(m), yy = parseInt(y);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yy >= 2024) {
      const date = new Date(yy, mm - 1, dd, 23, 59, 59);
      if (!isNaN(date.getTime())) onChange(date);
    }
  };

  return (
    <View style={dpStyles.row}>
      <View style={dpStyles.field}>
        <Text style={dpStyles.label}>JJ</Text>
        <TextInput
          style={dpStyles.input}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="01"
          placeholderTextColor="#c4b5fd"
          value={day}
          onChangeText={v => { setDay(v); commit(v, month, year); }}
        />
      </View>
      <Text style={dpStyles.sep}>/</Text>
      <View style={dpStyles.field}>
        <Text style={dpStyles.label}>MM</Text>
        <TextInput
          style={dpStyles.input}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="01"
          placeholderTextColor="#c4b5fd"
          value={month}
          onChangeText={v => { setMonth(v); commit(day, v, year); }}
        />
      </View>
      <Text style={dpStyles.sep}>/</Text>
      <View style={[dpStyles.field, { flex: 2 }]}>
        <Text style={dpStyles.label}>AAAA</Text>
        <TextInput
          style={dpStyles.input}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="2025"
          placeholderTextColor="#c4b5fd"
          value={year}
          onChangeText={v => { setYear(v); commit(day, month, v); }}
        />
      </View>
      {value && (
        <TouchableOpacity style={dpStyles.clearBtn} onPress={() => { setDay(""); setMonth(""); setYear(String(today.getFullYear())); onChange(null as any); }}>
          <Ionicons name="close-circle" size={18} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function CreateEventModal({ visible, onClose, onCreate, initialData }: Props) {
  const [selectedType, setSelectedType] = useState("soutenance");
  const [eventName,    setEventName]    = useState("");
  const [deadline,     setDeadline]     = useState<Date | null>(null);
  const [loading,      setLoading]      = useState(false);
  const { userId } = useUser();

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setSelectedType(initialData.type_boss ?? "soutenance");
        setEventName(initialData.nom ?? "");
        setDeadline(initialData.date_limite ? new Date(initialData.date_limite) : null);
      } else {
        setSelectedType("soutenance");
        setEventName("");
        setDeadline(null);
      }
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!eventName.trim()) {
      Alert.alert("Erreur", "Le nom de l'événement est requis.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        nom:        eventName.trim(),
        type_boss:  selectedType,
        date_limite: deadline ? deadline.toISOString() : null,
      };

      if (initialData?.id_boss) {
        const { error } = await supabase.from("boss_events").update(payload).eq("id_boss", initialData.id_boss);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("boss_events").insert({ ...payload, id_creator: userId });
        if (error) throw error;
      }

      onCreate();
      onClose();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  const deadlineStr = deadline
    ? deadline.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const isExpired = deadline && deadline < new Date();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.title}>
              {initialData?.id_boss ? "✏️ Modifier l'événement" : "✨ Nouvel événement"}
            </Text>

            <Text style={styles.sectionLabel}>Type:</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeCard, selectedType === t.id && styles.typeCardActive]}
                  onPress={() => setSelectedType(t.id)}
                  activeOpacity={0.85}
                >
                  <Image source={t.image} style={styles.typeImage} resizeMode="cover" />
                  {selectedType === t.id && (
                    <View style={styles.typeCheck}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                  <View style={styles.typeLabelRow}>
                    <Text style={styles.typeIcon}>{t.icon}</Text>
                    <Text style={[styles.typeLabel, selectedType === t.id && styles.typeLabelActive]}>
                      {t.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Nom de l'événement:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Soutenance IA..."
              placeholderTextColor="#c4b5fd"
              value={eventName}
              onChangeText={setEventName}
            />

            {/* ── Date limite ── */}
            <View style={styles.deadlineSection}>
              <View style={styles.deadlineLabelRow}>
                <Text style={styles.sectionLabel}>📅 Date limite (optionnel):</Text>
                {deadlineStr && (
                  <View style={[styles.deadlineBadge, isExpired && styles.deadlineBadgeExpired]}>
                    <Text style={[styles.deadlineBadgeText, isExpired && { color: "#ef4444" }]}>
                      {isExpired ? "⚠️ Dépassée" : deadlineStr}
                    </Text>
                  </View>
                )}
              </View>
              <DatePickerSimple value={deadline} onChange={(d) => setDeadline(d || null)} />
              <Text style={styles.deadlineHint}>
                ⚠️ Si la date est dépassée et l'événement non terminé, il sera marqué comme échoué.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.createBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.createBtnText}>
                {loading ? "Enregistrement..." : initialData?.id_boss ? "✨ Modifier" : "✨ Créer l'événement"}
              </Text>
            </TouchableOpacity>

            <View style={styles.starsRow}>
              {["✦", "✧", "✦", "✧", "✦"].map((s, i) => (
                <Text key={i} style={styles.star}>{s}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  field:    { flex: 1 },
  label:    { fontSize: 10, fontWeight: "700", color: "#9ca3af", marginBottom: 3 },
  input:    { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 10, paddingVertical: 10, fontSize: 15, color: "#1e1b4b", textAlign: "center" },
  sep:      { fontSize: 20, fontWeight: "800", color: "#c4b5fd", paddingTop: 12 },
  clearBtn: { paddingTop: 12, paddingLeft: 4 },
});

const styles = StyleSheet.create({
  overlay:              { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container:            { backgroundColor: "#f5f3ff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  closeBtn:             { position: "absolute", top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.light },
  title:                { fontSize: 18, fontWeight: "800", color: "#4c1d95", marginBottom: 20, marginTop: 4 },
  sectionLabel:         { fontSize: 14, fontWeight: "700", color: "#4c1d95", marginBottom: 10, marginTop: 4 },
  typeRow:              { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeCard:             { flex: 1, borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: "transparent", ...SHADOWS.light },
  typeCardActive:       { borderColor: COLORS.primary },
  typeImage:            { width: "100%", height: 90 },
  typeCheck:            { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  typeLabelRow:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#fff", paddingVertical: 6 },
  typeIcon:             { fontSize: 12 },
  typeLabel:            { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  typeLabelActive:      { color: COLORS.primary },
  input:                { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: "#1e1b4b", marginBottom: 16 },
  deadlineSection:      { marginBottom: 20 },
  deadlineLabelRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  deadlineBadge:        { backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  deadlineBadgeExpired: { backgroundColor: "#fee2e2" },
  deadlineBadgeText:    { fontSize: 11, fontWeight: "700", color: "#7c3aed" },
  deadlineHint:         { fontSize: 10, color: "#9ca3af", marginTop: 8, lineHeight: 14 },
  createBtn:            { backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 16, alignItems: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  createBtnText:        { color: "#fff", fontWeight: "800", fontSize: 16 },
  starsRow:             { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  star:                 { color: "#c4b5fd", fontSize: 14 },
});
