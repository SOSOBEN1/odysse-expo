// ─────────────────────────────────────────────
// backend/viewmodels/ProfileViewModel.js
//
// Logique métier pour l'écran "Modifier profil".
// Appelé depuis EditProfileScreen.tsx côté frontend.
//
// Chaque fonction retourne :
//   { success: true, data: ... }
//   { success: false, error: "message lisible" }
// ─────────────────────────────────────────────

const UserService   = require('../services/UserService');
const { UserModel } = require('../models/UserModel');

const ProfileViewModel = {

  // ── Charger le profil ─────────────────────────────────────
  //
  //  Appelé au montage de EditProfileScreen.
  //  Retourne les données à afficher dans les champs.
  //
  async loadProfile(userId) {
    try {
      const user = await UserService.getProfile(userId);
      return {
        success: true,
        data: {
          username:   user.username ?? '',
          nom:        user.nom      ?? '',
          prenom:     user.prenom   ?? '',
          email:      user.email    ?? '',
          avatar_url: user.avatar_url ?? 'avatar_1',
          gold:       user.gold     ?? 0,
          xp:         user.xp       ?? 0,
          niveau:     user.id_level ?? 1,
        },
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Sauvegarder les modifications ─────────────────────────
  //
  //  payload = { username, nom, prenom, avatar_url }
  //  Valide les données avant d'envoyer à Supabase.
  //
  async saveProfile(userId, payload) {
    // Validation
    if (!payload.username || payload.username.trim().length < 3) {
      return { success: false, error: "Le username doit contenir au moins 3 caractères" };
    }
    if (payload.username.trim().length > 50) {
      return { success: false, error: "Le username ne peut pas dépasser 50 caractères" };
    }
    if (!UserModel.editableFields.some(f => payload[f] !== undefined)) {
      return { success: false, error: "Aucune donnée à mettre à jour" };
    }

    try {
      const updated = await UserService.updateProfile(userId, {
        username:   payload.username.trim(),
        nom:        payload.nom?.trim()   ?? '',
        prenom:     payload.prenom?.trim() ?? '',
        avatar_url: payload.avatar_url    ?? 'avatar_1',
      });

      return {
        success: true,
        data: updated,
        message: 'Profil mis à jour avec succès !',
      };
    } catch (err) {
      // Gestion de l'erreur username déjà pris (unique constraint)
      if (err.message.includes('unique') || err.message.includes('duplicate')) {
        return { success: false, error: "Ce username est déjà pris, choisis-en un autre" };
      }
      return { success: false, error: err.message };
    }
  },
};

module.exports = ProfileViewModel;