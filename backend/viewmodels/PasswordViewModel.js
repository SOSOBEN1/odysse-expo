// ─────────────────────────────────────────────
// backend/viewmodels/PasswordViewModel.js
//
// Logique métier pour le changement de mot de passe.
// Appelé depuis ChangePasswordModal.tsx.
//
// Retourne toujours :
//   { success: true }
//   { success: false, error: "message lisible" }
// ─────────────────────────────────────────────

const UserService = require('../services/UserService');

const PasswordViewModel = {

  // ── Changer le mot de passe ───────────────────────────────
  //
  //  1. Validation côté ViewModel (avant d'appeler Supabase)
  //  2. Appel UserService.updatePassword
  //
  async changePassword(userId, oldPassword, newPassword, confirmPassword) {

    // ── Validation ────────────────────────────────────────────
    if (!oldPassword || !newPassword || !confirmPassword) {
      return { success: false, error: 'Tous les champs sont obligatoires' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Les nouveaux mots de passe ne correspondent pas' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' };
    }

    if (newPassword.length > 20) {
      return { success: false, error: 'Le mot de passe ne peut pas dépasser 20 caractères' };
    }

    if (newPassword === oldPassword) {
      return { success: false, error: "Le nouveau mot de passe doit être différent de l'ancien" };
    }

    // ── Appel service ─────────────────────────────────────────
    try {
      await UserService.updatePassword(userId, oldPassword, newPassword);
      return { success: true, message: 'Mot de passe modifié avec succès !' };
    } catch (err) {
      // Le service lève "Mot de passe actuel incorrect" si l'ancien ne correspond pas
      return { success: false, error: err.message };
    }
  },
};

module.exports = PasswordViewModel;