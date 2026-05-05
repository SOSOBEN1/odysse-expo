import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { to, defiNom, defiDescription, inviteurNom, appLink } = await req.json();

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Odyssé", email: "Odysse.contacter@gmail.com" },
        to: [{ email: to }],
        subject: `🏆 ${inviteurNom} t'invite au défi « ${defiNom} »`,
        htmlContent: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="UTF-8"><style>
            body { font-family: Arial, sans-serif; background: #F3EEFF; }
            .container { max-width: 480px; margin: 40px auto; background: #fff;
                         border-radius: 24px; padding: 36px 32px; }
            .badge { background: #7c3aed; color: #fff; border-radius: 20px;
                     padding: 6px 16px; font-size: 13px; font-weight: 700; }
            .defi-card { background: #F3EEFF; border-radius: 16px; padding: 18px 20px;
                         margin: 22px 0; border-left: 4px solid #7c3aed; }
            .cta { display: block; background: #7c3aed; color: #fff; text-decoration: none;
                   border-radius: 32px; padding: 15px 32px; text-align: center;
                   font-size: 16px; font-weight: 800; margin: 24px 0 0; }
          </style></head>
          <body>
            <div class="container">
              <div class="badge">🏆 Invitation défi</div>
              <h1>${inviteurNom} t'invite à relever un défi !</h1>
              <p>Rejoins le défi et accumule des XP !</p>
              <div class="defi-card">
                <div style="font-size:17px;font-weight:800;color:#3D1F7A">${defiNom}</div>
                <div style="font-size:13px;color:#7c6fa0">${defiDescription || "Relève ce défi !"}</div>
              </div>
              <a class="cta" href="${appLink}">Rejoindre le défi →</a>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const result = await res.json();
    console.log("Brevo response:", JSON.stringify(result));

    return new Response(JSON.stringify({ ok: res.ok, result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: res.ok ? 200 : 500,
    });

  } catch (err) {
    console.error("❌ Erreur envoi email:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});