



import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { authService } from "../services/authService";

const OTP_LENGTH  = 6;
const RESEND_SECS = 60;

export function useVerifyViewModel(email: string) {
  const [code, setCode]         = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [userId, setUserId]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timer, setTimer]       = useState(RESEND_SECS);

  const backgroundedAt = useRef<number | null>(null); // ← timestamp quand l'app part en bg

  // ── Décompte timer ──
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ── AppState : recalcule le temps passé en background ──
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundedAt.current = Date.now();
      } else if (nextState === "active" && backgroundedAt.current !== null) {
        const secondsPassed = Math.floor((Date.now() - backgroundedAt.current) / 1000);
        backgroundedAt.current = null;
        setTimer((t) => Math.max(0, t - secondsPassed));
      }
    });
    return () => sub.remove();
  }, []);

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

    setStatus("loading");
    setErrorMsg(null);
    const result = await authService.verifyOtp(email, full);
    if (result.success) {
      setUserId(result.userId ?? null);
      setStatus("success");
    } else {
      setErrorMsg(result.error ?? "Code invalide");
      setStatus("error");
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