// ─────────────────────────────────────────────
// backend/viewmodels/ProfileViewModel.ts
//
// Logique métier pour l'écran "Modifier profil".
// Appelé depuis EditProfileScreen.tsx côté frontend.
//
// Chaque fonction retourne :
//   { success: true, data: ... }
//   { success: false, error: "message lisible" }
// ─────────────────────────────────────────────

import UserService from '../services/UserService';
import { UserModel } from '../models/UserModel';

// ── Types ─────────────────────────────────────

interface ProfilePayload {
  username:   string;
  nom?:       string;
  prenom?:    string;
  avatar_url?: string;
}

type ProfileResult =
  | { success: true;  data: unknown; message?: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────

const ProfileViewModel = {

  // ── Charger le profil ─────────────────────────────────────
  //
  //  Appelé au montage de EditProfileScreen.
  //  Retourne les données à afficher dans les champs.
  //
  async loadProfile(userId: string): Promise<ProfileResult> {
    try {
      const user = await UserService.getProfile(userId);
      return {
        success: true,
        data: {
          username:   user.username   ?? '',
          nom:        user.nom        ?? '',
          prenom:     user.prenom     ?? '',
          email:      user.email      ?? '',
          avatar_url: user.avatar_url ?? 'avatar_1',
          gold:       user.gold       ?? 0,
          xp:         user.xp         ?? 0,
          niveau:     user.id_level   ?? 1,
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  // ── Sauvegarder les modifications ─────────────────────────
  //
  //  payload = { username, nom, prenom, avatar_url }
  //  Valide les données avant d'envoyer à Supabase.
  //
  async saveProfile(userId: string, payload: ProfilePayload): Promise<ProfileResult> {
    // Validation
    if (!payload.username || payload.username.trim().length < 3) {
      return { success: false, error: "Le username doit contenir au moins 3 caractères" };
    }
    if (payload.username.trim().length > 50) {
      return { success: false, error: "Le username ne peut pas dépasser 50 caractères" };
    }
    if (!UserModel.editableFields.some(f => payload[f as keyof ProfilePayload] !== undefined)) {
      return { success: false, error: "Aucune donnée à mettre à jour" };
    }

    try {
      const updated = await UserService.updateProfile(userId, {
        username:   payload.username.trim(),
        nom:        payload.nom?.trim()    ?? '',
        prenom:     payload.prenom?.trim() ?? '',
        avatar_url: payload.avatar_url     ?? 'avatar_1',
      });

      return {
        success: true,
        data:    updated,
        message: 'Profil mis à jour avec succès !',
      };
    } catch (err) {
      // Gestion de l'erreur username déjà pris (unique constraint)
      const msg = (err as Error).message;
      if (msg.includes('unique') || msg.includes('duplicate')) {
        return { success: false, error: "Ce username est déjà pris, choisis-en un autre" };
      }
      return { success: false, error: msg };
    }
  },
};

export default ProfileViewModel;