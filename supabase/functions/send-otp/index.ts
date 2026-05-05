import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { email } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Vérifie que l'email existe dans public.users
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id_user")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Aucun compte trouvé avec cet email" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 2. Génère OTP 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 3. Stocke dans otp_codes
    await supabase.from("otp_codes").upsert(
      { email, code: otp, expires_at: expiresAt, used: false },
      { onConflict: "email" }
    );

    // 4. Envoie via Brevo
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Odyssé", email: "Odysse.contacter@gmail.com" },
        to: [{ email }],
        subject: "🔐 Ton code de réinitialisation Odyssé",
        htmlContent: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="UTF-8"><style>
            body { font-family: Arial, sans-serif; background: #F3EEFF; }
            .container { max-width: 480px; margin: 40px auto; background: #fff;
                         border-radius: 24px; padding: 36px 32px; }
            .badge { background: #7c3aed; color: #fff; border-radius: 20px;
                     padding: 6px 16px; font-size: 13px; font-weight: 700; }
            .otp-box { background: #F3EEFF; border-radius: 16px; padding: 24px;
                       margin: 22px 0; text-align: center; border-left: 4px solid #7c3aed; }
            .otp-code { font-size: 42px; font-weight: 900; color: #7c3aed;
                        letter-spacing: 10px; }
            .note { font-size: 13px; color: #7c6fa0; margin-top: 8px; }
          </style></head>
          <body>
            <div class="container">
              <div class="badge">🔐 Réinitialisation</div>
              <h1>Ton code de vérification</h1>
              <p>Utilise ce code pour réinitialiser ton mot de passe.</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="note">⏱ Valable 10 minutes</div>
              </div>
              <p style="font-size:13px;color:#999">Si tu n'as pas demandé ce code, ignore cet email.</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const result = await res.json();
    console.log("Brevo response:", JSON.stringify(result));

    return new Response(JSON.stringify({ ok: res.ok, result }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: res.ok ? 200 : 500,
    });

  } catch (err) {
    console.error("❌ Erreur send-otp:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});