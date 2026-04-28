// viewmodels/useForgetPasswordViewModel.ts
import { useState } from "react";
import { authService } from "../services/authService";

export function useForgetPasswordViewModel() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const sendCode = async (): Promise<boolean> => {
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email");
      return false;
    }
    if (!isValidEmail(email.trim())) {
      setError("Adresse email invalide");
      return false;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await authService.sendOtpByEmail(email.trim().toLowerCase());
      if (!result.success) {
  console.log("❌ erreur reçue:", result.error);
  if (result.error?.includes("Aucun compte")) {
    setError("Aucun compte trouvé avec cet email. Vérifiez votre adresse.");
  } else if (result.error?.includes("network") || result.error?.includes("fetch")) {
    setError("Problème de connexion. Vérifiez votre internet.");
  } else {
    setError("Une erreur est survenue. Réessayez plus tard.");
  }
  return false;
}
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, loading, error, sendCode };
}