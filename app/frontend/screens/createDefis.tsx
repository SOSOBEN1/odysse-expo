// screens/CreateDefis.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions,
  KeyboardAvoidingView, Modal, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { addDefi, updateDefi } from '../../../backend/DefisService';
import { addMissions } from "../../../backend/MissionService";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { supabase } from "../constants/supabase";
import { COLORS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

const { width, height } = Dimensions.get("window");
const GAP = 10;

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserFriend {
  id_user: number;
  prenom: string;
  nom: string;
  email: string;
  username: string | null;
}

interface Mission {
  id: number;
  titre: string;
  description: string;
  duree_min: string;
  difficulte: number | "";
  priorite: number | "";
  xp_gain: string;
  date_limite: Date | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIFFICULTES_OPT: { label: string; value: number }[] = [
  { label: "Facile",    value: 1 },
  { label: "Moyen",     value: 2 },
  { label: "Difficile", value: 3 },
];
const PRIORITES_OPT: { label: string; value: number }[] = [
  { label: "Basse",   value: 1 },
  { label: "Normale", value: 2 },
  { label: "Haute",   value: 3 },
  { label: "Urgente", value: 4 },
];

const AVATAR_COLORS = ["#F48FB1","#90CAF9","#CE93D8","#A5D6A7","#FFCC80","#80DEEA"];

const computeGains = (diff: number, prio: number) => {
  const base      = diff * 10;
  const prioBonus = prio * 5;
  return {
    xp_gain:           base + prioBonus,
    energie_cout:      diff * 8,
    connaissance_gain: base,
    organisation_gain: prioBonus,
  };
};

// ─── Background ───────────────────────────────────────────────────────────────
const BgDecoration = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Defs>
      <RadialGradient id="rg1" cx="15%" cy="10%" r="50%">
        <Stop offset="0%" stopColor="#DDD0FF" stopOpacity="0.65" />
        <Stop offset="100%" stopColor="#DDD0FF" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="rg2" cx="90%" cy="55%" r="38%">
        <Stop offset="0%" stopColor="#FFD0EE" stopOpacity="0.42" />
        <Stop offset="100%" stopColor="#FFD0EE" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={height} fill="url(#rg1)" />
    <Rect x={0} y={0} width={width} height={height} fill="url(#rg2)" />
    <Path d="M28 92 H42 M35 85 V99" stroke="#B89EFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
    <Circle cx={width - 15} cy={195} r={3.2} fill="#C4AEFF" opacity={0.48} />
    <Circle cx={15}         cy={290} r={2.8} fill="#C4AEFF" opacity={0.40} />
  </Svg>
);

// ─── FocusInput ───────────────────────────────────────────────────────────────
const FocusInput = ({
  placeholder, value, onChangeText, multiline = false,
  numberOfLines = 1, keyboardType = "default", style,
}: {
  placeholder: string; value: string; onChangeText: (t: string) => void;
  multiline?: boolean; numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address";
  style?: object;
}) => {
  const border = useRef(new Animated.Value(0)).current;
  const bc = border.interpolate({ inputRange: [0,1], outputRange: ["rgba(180,160,220,0.3)", COLORS.primary] });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor: bc }, multiline && { height: numberOfLines * 22 + 20 }, style]}>
      <TextInput
        style={[styles.input, multiline && { height: "100%", textAlignVertical: "top", paddingTop: 10 }]}
        placeholder={placeholder}
        placeholderTextColor="rgba(120,90,180,0.35)"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        keyboardType={keyboardType}
        onFocus={() => Animated.spring(border, { toValue: 1, useNativeDriver: false, tension: 200, friction: 12 }).start()}
        onBlur={()  => Animated.spring(border, { toValue: 0, useNativeDriver: false, tension: 200, friction: 12 }).start()}
      />
    </Animated.View>
  );
};

// ─── Dropdown (supporte string[] et {label,value}[]) ─────────────────────────
const Dropdown = ({ placeholder, options, value, onChange }: {
  placeholder: string;
  options: { label: string; value: any }[] | string[];
  value: any;
  onChange: (v: any) => void;
}) => {
  const [open, setOpen] = useState(false);

  const getLabel = (v: any) => {
    if (!options.length) return "";
    if (typeof options[0] === "string") return v;
    return (options as { label: string; value: any }[]).find(o => o.value === v)?.label ?? "";
  };

  const opts = typeof options[0] === "string"
    ? (options as string[]).map(o => ({ label: o, value: o }))
    : (options as { label: string; value: any }[]);

  const isEmpty = value === "" || value === null || value === undefined;

  return (
    <View style={{ zIndex: open ? 999 : 1 }}>
      <TouchableOpacity
        style={[styles.dropBtn, open && styles.dropBtnOpen]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.85}
      >
        <Text style={[styles.dropValue, isEmpty && styles.dropPlaceholder]}>
          {!isEmpty ? getLabel(value) : placeholder}
        </Text>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d={open ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
            stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropMenu}>
          {opts.map(opt => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.dropOption, value === opt.value && styles.dropOptionSelected]}
              onPress={() => { onChange(opt.value); setOpen(false); }}
            >
              <Text style={[styles.dropOptionText, value === opt.value && styles.dropOptionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── DatePickerBtn (pour défi uniquement — date seule) ────────────────────────
const DatePickerBtn = ({ label, date, onConfirm }: {
  label: string; date: Date | null; onConfirm: (d: Date) => void;
}) => {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(date ?? new Date());

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShow(true)} activeOpacity={0.85}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
          <Rect x={3} y={4} width={18} height={18} rx={2}
            stroke={date ? COLORS.primary : "rgba(120,90,180,0.4)"} strokeWidth={1.8} />
          <Path d="M16 2v4M8 2v4M3 10h18"
            stroke={date ? COLORS.primary : "rgba(120,90,180,0.4)"} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
        <Text style={[styles.dateBtnText, date && styles.dateBtnTextFilled]}>
          {date ? formatDate(date) : label}
        </Text>
        {date && (
          <TouchableOpacity onPress={() => onConfirm(null as any)} style={{ marginLeft: 6 }}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#aaa" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {Platform.OS === "ios" ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <Text style={styles.dateModalTitle}>{label}</Text>
              <DateTimePicker value={temp} mode="date" display="spinner" locale="fr-FR"
                minimumDate={new Date()} onChange={(_, d) => { if (d) setTemp(d); }} />
              <View style={styles.dateModalActions}>
                <TouchableOpacity style={styles.dateModalCancel} onPress={() => setShow(false)}>
                  <Text style={styles.dateModalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateModalConfirm}
                  onPress={() => { onConfirm(temp); setShow(false); }}>
                  <Text style={styles.dateModalConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker value={temp} mode="date" display="default" minimumDate={new Date()}
            onChange={(_, d) => { setShow(false); if (d) onConfirm(d); }} />
        )
      )}
    </>
  );
};

// ─── MissionCard (alignée sur CreateMissionModal) ─────────────────────────────
const MissionCard = ({ mission, index, onChange, onRemove, onDateChange }: {
  mission: Mission; index: number;
  onChange: (id: number, field: keyof Mission, value: any) => void;
  onRemove: (id: number) => void;
  onDateChange: (id: number, date: Date | null) => void;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode,     setPickerMode]     = useState<"date" | "time">("date");

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
  }, []);

  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    if (!selected) return;

    if (pickerMode === "date") {
      const base   = mission.date_limite ?? new Date();
      const merged = new Date(selected);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      onDateChange(mission.id, merged);
      if (Platform.OS === "android") {
        setPickerMode("time");
        setShowTimePicker(true);
      }
    } else {
      const merged = mission.date_limite ? new Date(mission.date_limite) : new Date();
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onDateChange(mission.id, merged);
    }
  };

  const gains =
    mission.difficulte !== "" && mission.priorite !== ""
      ? computeGains(mission.difficulte as number, mission.priorite as number)
      : null;

  const formatDateLabel = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatTimeLabel = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Animated.View style={[styles.missionCard, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }],
    }]}>
      {/* ── Header ── */}
      <View style={styles.missionHeader}>
        <View style={styles.missionBadge}>
          <Text style={styles.missionBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.missionTitle}>Mission {index + 1}</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(mission.id)}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#C93A3A" strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* ── Titre ── */}
      <Text style={styles.fieldLabel}>Titre *</Text>
      <FocusInput
        placeholder="ex: Courir 5km"
        value={mission.titre}
        onChangeText={v => onChange(mission.id, "titre", v)}
      />

      {/* ── Description ── */}
      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Description</Text>
      <FocusInput
        placeholder="Décrivez la mission..."
        value={mission.description}
        onChangeText={v => onChange(mission.id, "description", v)}
        multiline
        numberOfLines={3}
      />

      {/* ── Durée + Difficulté ── */}
      <View style={[styles.missionRow, { marginTop: 10, zIndex: 400 }]}>
        <View style={styles.missionCol}>
          <Text style={styles.fieldLabel}>Durée (min)</Text>
          <FocusInput
            placeholder="ex: 30"
            value={mission.duree_min}
            keyboardType="numeric"
            onChangeText={v => onChange(mission.id, "duree_min", v.replace(/[^0-9]/g, ""))}
          />
        </View>
        <View style={[styles.missionCol, { zIndex: 400 }]}>
          <Text style={styles.fieldLabel}>Difficulté *</Text>
          <Dropdown
            placeholder="Choisir"
            options={DIFFICULTES_OPT}
            value={mission.difficulte}
            onChange={v => onChange(mission.id, "difficulte", v)}
          />
        </View>
      </View>

      {/* ── Priorité ── */}
      <View style={{ zIndex: 300, marginTop: 10 }}>
        <Text style={styles.fieldLabel}>Priorité *</Text>
        <Dropdown
          placeholder="Choisir"
          options={PRIORITES_OPT}
          value={mission.priorite}
          onChange={v => onChange(mission.id, "priorite", v)}
        />
      </View>

      {/* ── Date limite ── */}
      <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Date limite</Text>
      <View style={styles.dateTimeRow}>
        {/* Bouton date */}
        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => { setPickerMode("date"); setShowDatePicker(true); }}
          activeOpacity={0.85}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
            <Rect x={3} y={4} width={18} height={18} rx={2} stroke={COLORS.primary} strokeWidth={1.8} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.dateTimeBtnText}>
            {mission.date_limite ? formatDateLabel(mission.date_limite) : "Choisir la date"}
          </Text>
        </TouchableOpacity>

        {/* Bouton heure */}
        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => { setPickerMode("time"); setShowTimePicker(true); }}
          activeOpacity={0.85}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
            <Circle cx={12} cy={12} r={9} stroke={COLORS.primary} strokeWidth={1.8} />
            <Path d="M12 7v5l3 3" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.dateTimeBtnText}>
            {mission.date_limite ? formatTimeLabel(mission.date_limite) : "Choisir l'heure"}
          </Text>
        </TouchableOpacity>

        {/* Effacer */}
        {mission.date_limite && (
          <TouchableOpacity onPress={() => onDateChange(mission.id, null)} style={{ padding: 4 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} fill="#FECACA" />
              <Path d="M15 9L9 15M9 9l6 6" stroke="#C93A3A" strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Résumé date */}
      {mission.date_limite && (
        <View style={styles.dateSummary}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke="#4c1d95" strokeWidth={1.8} />
            <Path d="M12 7v5l3 3" stroke="#4c1d95" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.dateSummaryText}>
            Limite : {formatDateLabel(mission.date_limite)} à {formatTimeLabel(mission.date_limite)}
          </Text>
        </View>
      )}

      {/* Picker natif */}
      {(showDatePicker || showTimePicker) && (
        <DateTimePicker
          value={mission.date_limite ?? new Date()}
          mode={pickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
          locale="fr-FR"
        />
      )}
      {Platform.OS === "ios" && (showDatePicker || showTimePicker) && (
        <TouchableOpacity
          style={styles.confirmDateBtn}
          onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}
        >
          <Text style={styles.confirmDateBtnText}>Valider</Text>
        </TouchableOpacity>
      )}

      {/* ── Aperçu des gains ── */}
      {gains && (
        <View style={styles.gainsBox}>
          <Text style={styles.gainsTitle}>✨ Gains estimés</Text>
          <View style={styles.gainsRow}>
            <Text style={styles.gainItem}>⚡ -{gains.energie_cout} Énergie</Text>
            <Text style={styles.gainItem}>🏆 +{gains.xp_gain} XP</Text>
            <Text style={styles.gainItem}>📚 +{gains.connaissance_gain} Connaissance</Text>
            <Text style={styles.gainItem}>📋 +{gains.organisation_gain} Organisation</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// ─── StepIndicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ step }: { step: 1 | 2 }) => (
  <View style={styles.stepIndicator}>
    <View style={[styles.stepDot, styles.stepDotActive]}>
      <Text style={styles.stepDotTextActive}>1</Text>
    </View>
    <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
    <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
      <Text style={[styles.stepDotText, step === 2 && styles.stepDotTextActive]}>2</Text>
    </View>
    <View style={styles.stepLabels}>
      <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Défi</Text>
      <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Amis</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateDefisScreen() {
  const router   = useRouter();
  const params   = useLocalSearchParams();
  const { userId } = useUser();

  const isEdit = params.mode === "edit";
  const defiId = params.id ? Number(params.id) : null;

  // ── State ──
  const [step,          setStep]          = useState<1 | 2>(1);
  const [titre,         setTitre]         = useState("");
  const [description,   setDescription]   = useState("");
  const [dateDebut,     setDateDebut]     = useState<Date | null>(null);
  const [dateFin,       setDateFin]       = useState<Date | null>(null);
  const [missions,      setMissions]      = useState<Mission[]>([
    { id: 1, titre: "", description: "", duree_min: "", difficulte: "", priorite: "", xp_gain: "", date_limite: null }
  ]);
  const [missionCounter, setMissionCounter] = useState(2);
  const [missionsOpen,  setMissionsOpen]  = useState(true);
  const [saving,        setSaving]        = useState(false);

  const [friends,        setFriends]        = useState<UserFriend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9, delay: 100 }).start();
    if (isEdit) {
      if (params.title)    setTitre(String(params.title));
      if (params.subtitle) setDescription(String(params.subtitle));
    }
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setFriendsLoading(true);
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("id_user", userId ?? 0);

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      setFriendsLoading(false);
      return;
    }

    const friendIds = friendships.map(f => f.friend_id);
    const { data } = await supabase
      .from("users")
      .select("id_user, prenom, nom, email, username")
      .in("id_user", friendIds)
      .order("prenom", { ascending: true });

    if (data) setFriends(data);
    setFriendsLoading(false);
  };

  // ── Missions ──
  const addMission = () => {
    setMissions(prev => [...prev, {
      id: missionCounter, titre: "", description: "",
      duree_min: "", difficulte: "", priorite: "", xp_gain: "", date_limite: null,
    }]);
    setMissionCounter(c => c + 1);
  };

  const removeMission = (id: number) => {
    if (missions.length === 1) {
      Alert.alert("Mission requise", "Tu dois garder au moins une mission.");
      return;
    }
    setMissions(prev => prev.filter(m => m.id !== id));
  };

  const updateMission = (id: number, field: keyof Mission, value: any) =>
    setMissions(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));

  const updateMissionDate = (id: number, date: Date | null) =>
    setMissions(prev => prev.map(m => m.id === id ? { ...m, date_limite: date } : m));



  // ── Création en base ──
  const handleCreate = async () => {
    if (saving) return;
    setSaving(true);

    const payload = {
      nom:              titre,
      description,
      date_debut:       dateDebut ? dateDebut.toISOString().split("T")[0] : undefined,
      date_fin:         dateFin   ? dateFin.toISOString().split("T")[0]   : undefined,
      statut:           'actif' as const,
      id_user:          userId ?? 1,
      xp:               400,
      icon:             'rocket' as const,
      objectif_minutes: 120,
    };

    let error: unknown       = null;
    let savedDefiId: number | null = null;

    if (isEdit && defiId) {
      const result = await updateDefi(defiId, payload);
      error        = result.error;
      savedDefiId  = defiId;
    } else {
      const result = await addDefi(payload);
      error        = result.error;
      savedDefiId  = result.data?.id_defi ?? null;
    }

    if (!error && savedDefiId) {
      const missionsToInsert = missions
        .filter(m => m.titre.trim() !== "")
        .map(m => {
          const diff = m.difficulte !== "" ? m.difficulte as number : null;
          const prio = m.priorite   !== "" ? m.priorite   as number : null;
          const gains = diff && prio ? computeGains(diff, prio) : {};
          return {
            id_defi:     savedDefiId!,
            titre:       m.titre.trim(),
            description: m.description.trim() || null,
            duree_min:   m.duree_min ? parseInt(m.duree_min) : null,
            difficulte:  diff,
            priorite:    prio,
            date_limite: m.date_limite ? m.date_limite.toISOString() : null,
            statut:      'en_attente' as const,
            ...gains,
          };
        });

      const { error: mErr } = await addMissions(missionsToInsert);
      if (mErr) Alert.alert("Attention", "Défi créé mais les missions n'ont pas pu être sauvegardées.");
    }

    setSaving(false);

    if (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le défi. Réessaie.");
    } else {
      router.push({
        pathname: "/frontend/screens/DefierAmisScreen",
        params: { defiId: savedDefiId ?? 0, defiNom: titre, defiDesc: description },
      });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BgDecoration />

      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <StepIndicator step={1} />

          <Animated.View style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0,1], outputRange: [-18,0] }) }],
          }}>
            <Text style={styles.pageTitle}>
              {isEdit ? "Modifier le défi" : "Créer un défi"}
            </Text>
          </Animated.View>

          {/* ── Aperçu des amis ── */}
          <View style={styles.friendsSection}>
            <Text style={styles.friendsSectionLabel}> Tes amis pourront rejoindre :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsRow} style={styles.friendsScroll}>
              {friendsLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 10, marginHorizontal: 20 }} />
              ) : friends.length === 0 ? (
                <Text style={styles.noFriendsText}>Aucun utilisateur trouvé</Text>
              ) : (
                friends.map((f, i) => {
                  const color    = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const initials = `${f.prenom?.[0] ?? ""}${f.nom?.[0] ?? ""}`.toUpperCase();
                  const name     = f.username ? `@${f.username}` : f.prenom;
                  return (
                    <View key={f.id_user} style={styles.friendItem}>
                      <View style={[styles.avatarCircle, { backgroundColor: color }]}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                      <Text style={styles.friendName} numberOfLines={1}>{name}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* ── Formulaire défi ── */}
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Titre *</Text>
            <FocusInput placeholder="Saisir le titre du défi" value={titre} onChangeText={setTitre} />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description</Text>
            <FocusInput placeholder="Décrivez le défi..." value={description}
              onChangeText={setDescription} multiline numberOfLines={4} />

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date début</Text>
                <DatePickerBtn label="Choisir" date={dateDebut} onConfirm={setDateDebut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date fin</Text>
                <DatePickerBtn label="Choisir" date={dateFin} onConfirm={setDateFin} />
              </View>
            </View>
          </View>

          {/* ── Missions ── */}
          <TouchableOpacity style={styles.missionsSectionBtn}
            onPress={() => setMissionsOpen(o => !o)} activeOpacity={0.85}>
            <View style={styles.missionsSectionLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={9} stroke={COLORS.primary} strokeWidth={2} />
                <Path d="M8.5 12l2.5 2.5L15.5 9" stroke={COLORS.primary} strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.missionsSectionTitle}>Missions ({missions.length})</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d={missionsOpen ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          {missionsOpen && (
            <View style={styles.missionsContainer}>
              {missions.map((m, i) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  index={i}
                  onChange={updateMission}
                  onRemove={removeMission}
                  onDateChange={updateMissionDate}
                />
              ))}
              <TouchableOpacity style={styles.addMissionBtn} onPress={addMission} activeOpacity={0.85}>
                <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
                  <Circle cx={9} cy={9} r={8} fill={COLORS.primary} />
                  <Path d="M9 5V13M5 9H13" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.addMissionText}>Ajouter une mission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── CTA ── */}
          <View style={styles.ctaWrap}>

            {/* Bouton 1 : Créer / Enregistrer */}
           <TouchableOpacity
              style={[styles.ctaBtn, saving && styles.ctaBtnDisabled]}
              onPress={handleCreate}
              activeOpacity={0.88}
              disabled={saving}
            >
              {saving ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.ctaBtnText}>Création...</Text>
                </>
              ) : (
                <Text style={styles.ctaBtnText}>
                  {isEdit ? "✏️  Modifier le défi" : "✅  Créer le défi"}
                </Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={{ height: 180 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navbarFixed}>
        <Navbar active="defis" onChange={() => {}} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: "#F3EEFF" },
  topBar:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                   paddingTop: Platform.OS === "android" ? 46 : 60,
                   paddingHorizontal: SIZES.padding, zIndex: 10 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 20 },

  // ── Step indicator ──
  stepIndicator:     { flexDirection: "row", alignItems: "center", marginBottom: 24, position: "relative" },
  stepDot:           { width: 28, height: 28, borderRadius: 14,
                       backgroundColor: "rgba(180,160,220,0.25)", borderWidth: 2,
                       borderColor: "rgba(180,160,220,0.4)", alignItems: "center", justifyContent: "center" },
  stepDotActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText:       { fontSize: 12, fontWeight: "700", color: "rgba(120,90,180,0.5)" },
  stepDotTextActive: { fontSize: 12, fontWeight: "700", color: "#fff" },
  stepLine:          { flex: 1, height: 2, backgroundColor: "rgba(180,160,220,0.3)", marginHorizontal: 6 },
  stepLineActive:    { backgroundColor: COLORS.primary },
  stepLabels:        { position: "absolute", bottom: -16, left: 0, right: 0,
                       flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  stepLabel:         { fontSize: 10, color: "rgba(120,90,180,0.5)", fontWeight: "600" },
  stepLabelActive:   { color: COLORS.primary },

  pageTitle: { fontSize: 24, fontWeight: "800", color: "#17063B",
               marginBottom: 20, marginTop: 14, fontFamily: "Georgia", letterSpacing: -0.4 },

  // ── Friends ──
  friendsSection:      { marginBottom: 14 },
  friendsSectionLabel: { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 8 },
  friendsScroll:       {},
  friendsRow:          { flexDirection: "row", alignItems: "center", gap: 10,
                         paddingVertical: 4, paddingHorizontal: 2 },
  friendItem:          { alignItems: "center", gap: 5, width: 56 },
  avatarCircle:        { width: 48, height: 48, borderRadius: 24,
                         alignItems: "center", justifyContent: "center" },
  avatarInitials:      { fontSize: 16, fontWeight: "800", color: "#fff" },
  friendName:          { fontSize: 11, color: "rgba(80,50,140,0.7)", fontWeight: "600",
                         textAlign: "center", width: 56 },
  noFriendsText:       { fontSize: 12, color: "rgba(120,90,180,0.5)", marginVertical: 10 },

  // ── Form défi ──
  formCard: { backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 22, padding: 16,
              marginBottom: 12, borderWidth: 1, borderColor: "rgba(200,180,240,0.35)",
              shadowColor: "#9574e0", shadowOpacity: 0.1, shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 5 },
  inputWrap:  { borderRadius: 12, borderWidth: 1.5,
                backgroundColor: "rgba(255,255,255,0.92)", marginBottom: 2, overflow: "hidden" },
  input:      { fontSize: 13, color: "#2A1060", paddingHorizontal: 12,
                paddingVertical: 9, fontWeight: "500", minHeight: 38 },
  dateRow:    { flexDirection: "row", gap: GAP, marginTop: 12 },
  dateBtn:    { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5,
                borderColor: "rgba(180,160,220,0.3)", backgroundColor: "rgba(255,255,255,0.92)",
                paddingHorizontal: 12, paddingVertical: 10, minHeight: 38 },
  dateBtnText:       { fontSize: 12, color: "rgba(120,90,180,0.4)", fontWeight: "500", flex: 1 },
  dateBtnTextFilled: { color: COLORS.primary, fontWeight: "700" },

  // ── Date Modal ──
  dateModalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  dateModalCard:        { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
                          padding: 20, paddingBottom: 40 },
  dateModalTitle:       { fontSize: 16, fontWeight: "800", color: "#17063B", textAlign: "center", marginBottom: 10 },
  dateModalActions:     { flexDirection: "row", gap: 12, marginTop: 16 },
  dateModalCancel:      { flex: 1, paddingVertical: 14, borderRadius: 32, alignItems: "center",
                          borderWidth: 2, borderColor: "rgba(180,160,220,0.5)" },
  dateModalCancelText:  { fontSize: 14, fontWeight: "700", color: "rgba(100,70,160,0.7)" },
  dateModalConfirm:     { flex: 2, paddingVertical: 14, borderRadius: 32,
                          alignItems: "center", backgroundColor: COLORS.primary },
  dateModalConfirmText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // ── Missions ──
  missionsSectionBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                          backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 18,
                          paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
                          borderWidth: 1, borderColor: "rgba(200,180,240,0.35)",
                          shadowColor: "#9574e0", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  missionsSectionLeft:  { flexDirection: "row", alignItems: "center", gap: 9 },
  missionsSectionTitle: { fontSize: 14, fontWeight: "700", color: "#3D1F7A" },
  missionsContainer:    { gap: 10, marginBottom: 14 },
  missionCard:          { backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 18, padding: 14,
                          borderWidth: 1, borderColor: "rgba(200,180,240,0.35)",
                          shadowColor: "#9574e0", shadowOpacity: 0.08, shadowRadius: 10,
                          elevation: 4, gap: 4 },
  missionHeader:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  missionBadge:         { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary,
                          alignItems: "center", justifyContent: "center" },
  missionBadgeText:     { fontSize: 12, fontWeight: "800", color: "#fff" },
  missionTitle:         { flex: 1, fontSize: 13, fontWeight: "700", color: "#3D1F7A" },
  removeBtn:            { width: 30, height: 30, borderRadius: 15, backgroundColor: "#FFE8E8",
                          alignItems: "center", justifyContent: "center" },
  missionRow:           { flexDirection: "row", gap: GAP },
  missionCol:           { flex: 1, gap: 4 },
  addMissionBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center",
                          gap: 8, paddingVertical: 13, borderRadius: 18,
                          borderWidth: 1.5, borderStyle: "dashed", borderColor: COLORS.primary,
                          backgroundColor: `${COLORS.primary}0D` },
  addMissionText:       { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  // ── Dropdown ──
  dropBtn:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                          borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(180,160,220,0.3)",
                          backgroundColor: "rgba(255,255,255,0.92)",
                          paddingHorizontal: 10, paddingVertical: 9, minHeight: 38 },
  dropBtnOpen:          { borderColor: COLORS.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  dropValue:            { fontSize: 12, fontWeight: "600", color: "#2A1060", flex: 1 },
  dropPlaceholder:      { color: "rgba(120,90,180,0.35)", fontWeight: "500" },
  dropMenu:             { position: "absolute", top: 38, left: 0, right: 0, backgroundColor: "#fff",
                          borderWidth: 1.5, borderColor: COLORS.primary, borderTopWidth: 0,
                          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
                          zIndex: 9999, shadowColor: COLORS.primary, shadowOpacity: 0.2,
                          shadowRadius: 10, elevation: 20 },
  dropOption:           { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 0.5,
                          borderBottomColor: "rgba(180,160,220,0.2)" },
  dropOptionSelected:   { backgroundColor: `${COLORS.primary}12` },
  dropOptionText:       { fontSize: 12, fontWeight: "500", color: "#2A1060" },
  dropOptionTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Date/heure dans MissionCard ──
  dateTimeRow:        { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 2 },
  dateTimeBtn:        { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12,
                        borderWidth: 1.5, borderColor: "rgba(180,160,220,0.3)",
                        backgroundColor: "rgba(255,255,255,0.92)",
                        paddingHorizontal: 10, paddingVertical: 9 },
  dateTimeBtnText:    { fontSize: 11, color: COLORS.primary, fontWeight: "600", flex: 1 },
  dateSummary:        { flexDirection: "row", alignItems: "center", gap: 5,
                        backgroundColor: `${COLORS.primary}15`, borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 7, marginTop: 4 },
  dateSummaryText:    { fontSize: 11, color: "#4c1d95", fontWeight: "700" },
  confirmDateBtn:     { backgroundColor: COLORS.primary, borderRadius: 10,
                        paddingVertical: 9, alignItems: "center", marginTop: 6 },
  confirmDateBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // ── Gains ──
  gainsBox:   { backgroundColor: `${COLORS.primary}12`, borderRadius: 14, padding: 12, marginTop: 8 },
  gainsTitle: { fontWeight: "800", color: "#4c1d95", marginBottom: 7, fontSize: 12 },
  gainsRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  gainItem:   { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 9,
                paddingHorizontal: 9, paddingVertical: 5,
                fontSize: 11, color: "#4c1d95", fontWeight: "600" },

  // ── CTA ──
  ctaWrap:             { width: "100%", marginTop: 6, gap: 12 ,zIndex:20},
  ctaBtn:              { width: "100%", backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 17,
                         flexDirection: "row", alignItems: "center", justifyContent: "center",
                         shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 20,
                         shadowOffset: { width: 0, height: 7 }, elevation: 12 },
  ctaBtnDisabled:      { backgroundColor: "rgba(149,116,224,0.4)", shadowOpacity: 0, elevation: 0 },
  ctaBtnText:          { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  ctaBtnSecondary:     { width: "100%", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 32,
                         paddingVertical: 17, flexDirection: "row", alignItems: "center",
                         justifyContent: "center", borderWidth: 2, borderColor: COLORS.primary,
                         shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 10,
                         shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  ctaBtnSecondaryText: { color: COLORS.primary, fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  navbarFixed:         { position: "absolute", bottom: 0, left: 0, right: 0 },
});