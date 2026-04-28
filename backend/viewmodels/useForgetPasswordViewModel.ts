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
        setError(result.error ?? "Erreur inconnue");
        return false;
      }
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, loading, error, sendCode };
}