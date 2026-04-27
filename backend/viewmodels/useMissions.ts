// ============================================================
//  useMissions.ts
//  Hook principal pour MissionsScreen.
//  Orchestre : fetch, CRUD, timer, filtrage.
// ============================================================

import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  createMission,
  deleteMission,
  fetchMissions as fetchMissionsService,
  updateMission,
} from "../models/mission.service";
import type { Mission, MissionCreatePayload, MissionUpdatePayload } from "../models/mission.types";
import { parseDurationToMinutes, mapDifficultyToNumber } from "../models/mission.utils";
import { useMissionTimer, type StatusModalState } from "./useMissionTimer";

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────

export function useMissions(userId: string | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [statusModal, setStatusModal] = useState<StatusModalState>({
    visible: false, type: "success", missionTitle: "",
  });

  // ── Timer hook ────────────────────────────────────────────
  const { timers, getTimer, initTimers, handleStart, handlePause, handleFinish } =
    useMissionTimer({
      userId: userId ?? "",
      missions,
      onStatusModal: setStatusModal,
    });

  // ── Fetch missions ────────────────────────────────────────
  const loadMissions = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { missions: fetched, timers: fetchedTimers } = await fetchMissionsService(userId);
      setMissions(fetched);
      initTimers(fetchedTimers);
    } catch (err: any) {
      console.error("❌ loadMissions:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, initTimers]);

  // Rechargement à chaque fois que l'écran reprend le focus
  useFocusEffect(useCallback(() => {
    if (userId) loadMissions();
  }, [userId, loadMissions]));

  // ── Supprimer ─────────────────────────────────────────────
  const handleDelete = useCallback((id: number) => {
    Alert.alert("Supprimer", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await deleteMission(id);
            setMissions(prev => prev.filter(m => m.id !== id));
          } catch (err: any) {
            Alert.alert("Erreur", err.message);
          }
        },
      },
    ]);
  }, []);

  // ── Préparer les données pour le modal d'édition ──────────
  const buildEditPayload = useCallback((mission: Mission) => ({
    id_mission:  mission.id,
    titre:       mission.title,
    description: mission.description,
    duree_min:   parseDurationToMinutes(mission.duration),
    difficulte:  mapDifficultyToNumber(mission.difficulty),
    priorite:    mission.urgent ? 4 : 2,
    date_limite: mission.dateLimite?.toISOString() ?? null,
  }), []);

  // ── Créer ou mettre à jour depuis le modal ─────────────────
  const handleSave = useCallback(async (
    payload: MissionCreatePayload & { id_mission?: number }
  ) => {
    try {
      if (payload.id_mission) {
        const { id_mission, ...rest } = payload;
        await updateMission(id_mission, rest as MissionUpdatePayload);
      } else {
        await createMission(payload);
      }
      await loadMissions();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    }
  }, [loadMissions]);

  // ── Fermer le modal de statut ─────────────────────────────
  const closeStatusModal = useCallback(() => {
    setStatusModal(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    // État
    missions,
    loading,
    timers,
    statusModal,
    // Actions missions
    loadMissions,
    handleDelete,
    handleSave,
    buildEditPayload,
    // Actions timer
    handleStart,
    handlePause,
    handleFinish,
    getTimer,
    // Modal
    closeStatusModal,
  };
}