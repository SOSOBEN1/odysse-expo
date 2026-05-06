// viewmodels/useVerifyViewModel.ts
import { useEffect, useState } from "react";
import { authService } from "../services/authService";

const OTP_LENGTH  = 6;
const RESEND_SECS = 60;

export function useVerifyViewModel(email: string) {
  const [code, setCode]         = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [userId, setUserId]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timer, setTimer]       = useState(RESEND_SECS);

  // Décompte timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = async (text: string, index: number) => {
    const next = [...code];
    next[index] = text;
    setCode(next);

    const full = next.join("");
    if (full.length !== OTP_LENGTH) {
      setStatus("idle");
      setErrorMsg(null);
      return;
    }

    // Vérification réelle via Supabase dès que les 6 chiffres sont saisis
    setStatus("loading");
    setErrorMsg(null);
    const result = await authService.verifyOtp(email, full);
    if (result.success) {
      setUserId(result.userId ?? null);
      setStatus("success");
    } else {
      setErrorMsg(result.error ?? "Code invalide");
      setStatus("error");
      // Reset les cases pour permettre une nouvelle saisie
      setCode(Array(OTP_LENGTH).fill(""));
    }
  };

  const resend = async () => {
    setCode(Array(OTP_LENGTH).fill(""));
    setStatus("idle");
    setErrorMsg(null);
    setTimer(RESEND_SECS);
    await authService.sendOtpByEmail(email);
  };

  const timerLabel = `00:${String(timer).padStart(2, "0")}`;

  return { code, status, userId, errorMsg, timer, timerLabel, handleChange, resend };
}
