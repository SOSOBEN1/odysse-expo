// viewmodels/useNewPasswordViewModel.ts
import { useState } from "react";
import { authService } from "../services/authService";

export function useNewPasswordViewModel(userId: string) {
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength]               = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const checkStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setStrength(score);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    checkStrength(text);
  };

  const submit = async (): Promise<boolean> => {
    if (!password) {
      setError("Entrez un mot de passe");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    if (strength < 2) {
      setError("Mot de passe trop faible (min: 6 car. + majuscule ou chiffre)");
      return false;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await authService.updatePassword(userId, password);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de la mise à jour");
        return false;
      }
      return true;
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["#ff4d4f", "#ff7a45", "#ffa940", "#73d13d"];
  const strengthLabels = ["Très faible", "Faible", "Moyen", "Fort"];
  const strengthLabel  = strength > 0 ? strengthLabels[strength - 1] : "";

  return {
    password, confirmPassword, strength, loading, error,
    strengthColors, strengthLabel,
    handlePasswordChange,
    setConfirmPassword,
    submit,
  };
}