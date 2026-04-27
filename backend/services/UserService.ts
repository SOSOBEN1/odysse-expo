// ─────────────────────────────────────────────
// backend/services/UserService.ts
//
// Toutes les requêtes Supabase pour :
//   - users        (profil, mot de passe)
//   - player_stats (stats du joueur)
//   - stat_history (historique)
//   - user_skills  (compétences)
//   - question / question_option / response (onboarding)
// ─────────────────────────────────────────────

import supabase from '../config/db';
import type { PlayerStats } from '../models/UserModel';

// ── Types locaux ──────────────────────────────

export interface QuestionOption {
  id:          string;
  label:       string;
  value:       number;
  impact:      number;
  order_index: number;
}

export interface OnboardingQuestion {
  id:         string;
  text:       string;
  type:       string;
  category:   string;
  context:    string;
  min_value:  number | null;
  max_value:  number | null;
  options:    QuestionOption[];
}

export interface SkillEntry {
  id_skill: number;
  valeur:   number;
}

export interface ResponseEntry {
  question_id: string;
  option_id:   string;
}

// ─────────────────────────────────────────────

const UserService = {

  // ════════════════════════════════════════════
  // TABLE : users
  // ════════════════════════════════════════════

  // Récupère tout le profil d'un user
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_user', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Met à jour username / nom / prenom / avatar_url
  async updateProfile(userId: string, payload: Record<string, string>) {
    // Sécurité : on n'autorise que certains champs
    const allowed = ['username', 'nom', 'prenom', 'avatar_url'];
    const safePayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowed.includes(key))
    );

    const { data, error } = await supabase
      .from('users')
      .update(safePayload)
      .eq('id_user', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Vérifie l'ancien mot de passe puis change
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<true> {
    // 1. Vérifier l'ancien mot de passe dans la table users
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('password')
      .eq('id_user', userId)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);
    if (user.password !== oldPassword) throw new Error('Mot de passe actuel incorrect');

    // 2. Mise à jour uniquement dans la table users
    //    (pas d'appel à supabase.auth.updateUser car l'app
    //     utilise une auth custom sans session Supabase Auth)
    const { error: dbErr } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id_user', userId);

    if (dbErr) throw new Error(dbErr.message);
    return true;
  },


  // ════════════════════════════════════════════
  // TABLE : player_stats
  // ════════════════════════════════════════════

  // Lire les stats actuelles
  async getPlayerStats(userId: string): Promise<PlayerStats | null> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('id_user', userId)
      .single();

    if (error) return null;   // null = pas encore de stats (normal au 1er login)
    return data;
  },

  // Créer les stats pour la 1ère fois
  async createPlayerStats(userId: string, stats: PlayerStats) {
    const { data, error } = await supabase
      .from('player_stats')
      .insert({ id_user: userId, ...stats })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Mettre à jour les stats existantes
  async updatePlayerStats(userId: string, stats: PlayerStats) {
    const { data, error } = await supabase
      .from('player_stats')
      .update({ ...stats, date_maj: new Date().toISOString() })
      .eq('id_user', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },


  // ════════════════════════════════════════════
  // TABLE : stat_history
  // ════════════════════════════════════════════

  async addStatHistory(userId: string, stats: PlayerStats, cause: string): Promise<void> {
    const { error } = await supabase
      .from('stat_history')
      .insert({ id_user: userId, ...stats, cause });

    if (error) throw new Error(error.message);
  },


  // ════════════════════════════════════════════
  // TABLE : user_skills
  // ════════════════════════════════════════════

  // Lire les skills d'un user (avec le nom de chaque skill)
  async getUserSkills(userId: string) {
    const { data, error } = await supabase
      .from('user_skills')
      .select('id_skill, valeur, skills(nom, description)')
      .eq('id_user', userId);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Créer ou mettre à jour un skill (upsert)
  async upsertUserSkill(userId: string, skillId: number, valeur: number): Promise<void> {
    const { error } = await supabase
      .from('user_skills')
      .upsert(
        { id_user: userId, id_skill: skillId, valeur },
        { onConflict: 'id_user,id_skill' }
      );

    if (error) throw new Error(error.message);
  },

  // Initialiser plusieurs skills d'un coup (onboarding)
  async bulkUpsertSkills(userId: string, skillsArray: SkillEntry[]): Promise<void> {
    const rows = skillsArray.map(s => ({
      id_user:  userId,
      id_skill: s.id_skill,
      valeur:   s.valeur,
    }));

    const { error } = await supabase
      .from('user_skills')
      .upsert(rows, { onConflict: 'id_user,id_skill' });

    if (error) throw new Error(error.message);
  },


  // ════════════════════════════════════════════
  // TABLES : question / question_option / response
  // ════════════════════════════════════════════

  // Récupère les questions d'onboarding + leurs options
  async getOnboardingQuestions(): Promise<OnboardingQuestion[]> {
    const { data, error } = await supabase
      .from('question')
      .select(`
        id, text, type, category, context, min_value, max_value,
        options:question_option (id, label, value, impact, order_index)
      `)
      .eq('context', 'onboarding')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Trier les options par order_index
    return (data ?? []).map(q => ({
      ...q,
      options: (q.options ?? []).sort(
        (a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index
      ),
    }));
  },

  // Sauvegarder les réponses de l'utilisateur
  async saveResponses(userId: string, responsesArray: ResponseEntry[]): Promise<void> {
    const rows = responsesArray.map(r => ({
      user_id:     userId,
      question_id: r.question_id,
      option_id:   r.option_id,
    }));

    const { error } = await supabase
      .from('response')
      .insert(rows);

    if (error) throw new Error(error.message);
  },

  // Vérifie si l'utilisateur a déjà répondu à l'onboarding
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('response')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) return false;
    return (data?.length ?? 0) > 0;
  },
};

export default UserService;