// // services/authService.ts
// import { supabase } from "../../app/frontend/constants/supabase";

// export const authService = {

//   /**
//    * Étape 1 — Vérifie que l'email existe dans ta table users,
//    * puis envoie un OTP par email via Supabase Auth (qui utilise Brevo en SMTP).
//    */
//   async sendOtpByEmail(email: string) {
//     // Vérifie que l'email existe dans ta table
//     const { data, error } = await supabase
//       .from("users")
//       .select("id_user")
//       .eq("email", email)
//       .single();

//     if (error || !data) {
//       return { success: false, error: "Aucun compte trouvé avec ce email" };
//     }

//     // Supabase envoie le code OTP par email (via Brevo configuré en SMTP)
//     const { error: otpError } = await supabase.auth.signInWithOtp({
//       email,
//       options: {
//         shouldCreateUser: false, // N'autorise PAS la création d'un nouvel utilisateur
//       },
//     });

//     if (otpError) {
//       return { success: false, error: otpError.message };
//     }

//     return { success: true };
//   },

//   /**
//    * Étape 2 — Vérifie le code OTP saisi par l'utilisateur.
//    * Supabase compare le token et retourne une session.
//    * On récupère ensuite l'id_user dans ta table custom.
//    */
//   async verifyOtp(email: string, token: string) {
//     const { data, error } = await supabase.auth.verifyOtp({
//       email,
//       token,
//       type: "email",
//     });

//     if (error || !data.user) {
//       return { success: false, error: "Code incorrect ou expiré" };
//     }

//     // Récupère l'id_user depuis ta table custom
//     const { data: userData, error: userError } = await supabase
//       .from("users")
//       .select("id_user")
//       .eq("email", email)
//       .single();

//     if (userError || !userData) {
//       return { success: false, error: "Utilisateur introuvable" };
//     }

//     return { success: true, userId: userData.id_user as string };
//   },

//   /**
//    * Étape 3 — Met à jour le mot de passe dans ta table users custom.
//    */
//   async updatePassword(userId: string, newPassword: string) {
//     const { error } = await supabase
//       .from("users")
//       .update({ password: newPassword })
//       .eq("id_user", userId);

//     if (error) {
//       return { success: false, error: "Erreur lors de la mise à jour" };
//     }
//     return { success: true };
//   },
// };



// services/authService.ts
import { supabase } from "../../app/frontend/constants/supabase";

export const authService = {

  /**
   * Étape 1 — envoie OTP via Supabase Auth (Brevo SMTP en backend)
   */
  async sendOtpByEmail(email: string) {
  const { data, error } = await supabase.functions.invoke("send-otp", {
    body: { email },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async verifyOtp(email: string, token: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("email", email)
    .eq("code", token)
    .eq("used", false)
    .single();

  if (error || !data) return { success: false, error: "Code incorrect ou expiré" };
  if (data.expires_at < now) return { success: false, error: "Code expiré" };

  // Marque comme utilisé
  await supabase.from("otp_codes").update({ used: true }).eq("email", email);

  const { data: userData } = await supabase
    .from("users")
    .select("id_user")
    .eq("email", email)
    .single();

  return { success: true, userId: userData?.id_user };
},

  /**
   * Étape 3 — update password (optionnel)
   */
 async updatePassword(userId: string, newPassword: string) {
  const { error } = await supabase
    .from("users")
    .update({ password: newPassword })
    .eq("id_user", Number(userId)); // ← ajoute Number()

  if (error) {
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
  return { success: true };
},
};