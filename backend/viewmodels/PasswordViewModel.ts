// ─────────────────────────────────────────────
// backend/viewmodels/PasswordViewModel.ts
//
// Logique métier pour le changement de mot de passe.
// Appelé depuis ChangePasswordModal.tsx.
//
// Retourne toujours :
//   { success: true }
//   { success: false, error: "message lisible" }
// ─────────────────────────────────────────────

import UserService from '../services/UserService';

// ── Types ─────────────────────────────────────

interface ChangePasswordSuccess {
  success: true;
  message: string;
}

interface ChangePasswordFailure {
  success: false;
  error: string;
}

type ChangePasswordResult = ChangePasswordSuccess | ChangePasswordFailure;

// ─────────────────────────────────────────────

const PasswordViewModel = {

  // ── Changer le mot de passe ───────────────────────────────
  //
  //  1. Validation côté ViewModel (avant d'appeler Supabase)
  //  2. Appel UserService.updatePassword
  //
  async changePassword(
    userId:          string,
    oldPassword:     string,
    newPassword:     string,
    confirmPassword: string,
  ): Promise<ChangePasswordResult> {

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
      return { success: false, error: (err as Error).message };
    }
  },
};

export default PasswordViewModel;