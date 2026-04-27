/**
 * puzzle.routes.ts
 * Routes API Express — 100% Supabase (pas de Pool pg)
 *
 * GET  /puzzle/:userId/:zoneSlug    → état du puzzle
 * GET  /missions/:userId/:zoneSlug  → missions de la zone
 * POST /missions/complete            → valider une mission (via rpc)
 * GET  /zones/:userId/:worldSlug    → zones du monde avec état
 * GET  /users/:id/friends           → amis d'un utilisateur
 * POST /notifications               → créer une notification
 */

import { Request, Response, Router } from "express";
const supabase = require("./config/db");

const router = Router();

// ─── GET /puzzle/:userId/:zoneSlug ────────────────────────────────────────────

router.get("/puzzle/:userId/:zoneSlug", async (req: Request, res: Response) => {
  const { userId, zoneSlug } = req.params;

  const { data: zone, error: zoneErr } = await supabase
    .from("zone")
    .select("id_zone, image_url, accent_color")
    .eq("slug", zoneSlug)
    .single();

  if (zoneErr || !zone) {
    return res.status(404).json({ error: "Zone introuvable" });
  }

  const { data: config, error: configErr } = await supabase
    .from("puzzle_config")
    .select("id_puzzle, total_pieces, image_url")
    .eq("id_zone", zone.id_zone)
    .single();

  if (configErr || !config) {
    return res.status(404).json({ error: "Puzzle non configuré pour cette zone" });
  }

  const { data: progress } = await supabase
    .from("puzzle_progress")
    .select("pieces_earned, is_complete, completed_at")
    .eq("id_user", userId)
    .eq("id_puzzle", config.id_puzzle)
    .maybeSingle();

  return res.json({
    idPuzzle:     config.id_puzzle,
    totalPieces:  config.total_pieces,
    piecesEarned: progress?.pieces_earned ?? 0,
    isComplete:   progress?.is_complete   ?? false,
    completedAt:  progress?.completed_at  ?? null,
    zoneImage:    config.image_url ?? zone.image_url,
    accentColor:  zone.accent_color,
  });
});

// ─── GET /missions/:userId/:zoneSlug ─────────────────────────────────────────

router.get("/missions/:userId/:zoneSlug", async (req: Request, res: Response) => {
  const { userId, zoneSlug } = req.params;

  const { data: zone, error: zoneErr } = await supabase
    .from("zone")
    .select("id_zone")
    .eq("slug", zoneSlug)
    .single();

  if (zoneErr || !zone) {
    return res.status(404).json({ error: "Zone introuvable" });
  }

  const { data: missions, error: missionsErr } = await supabase
    .from("mission")
    .select("id_mission, titre, description, xp_gain, energie_cout, difficulte, statut, priorite")
    .eq("id_zone", zone.id_zone)
    .order("priorite", { ascending: true })
    .order("id_mission",  { ascending: true });

  if (missionsErr) {
    return res.status(500).json({ error: "Erreur chargement missions" });
  }

  const missionIds = missions.map((m: any) => m.id_mission);

  const { data: validations } = await supabase
    .from("mission_validation")
    .select("id_mission")
    .eq("id_user", userId)
    .in("id_mission", missionIds);

  const doneSet = new Set((validations ?? []).map((v: any) => v.id_mission));

  return res.json(
    missions.map((m: any) => ({
      id:          m.id_mission,
      titre:       m.titre,
      description: m.description,
      xpGain:      m.xp_gain,
      energieCout: m.energie_cout,
      difficulte:  m.difficulte,
      statut:      m.statut,
      done:        doneSet.has(m.id_mission),
    }))
  );
});

// ─── POST /missions/complete ──────────────────────────────────────────────────
// Appelle la fonction SQL complete_mission() via supabase.rpc()

router.post("/missions/complete", async (req: Request, res: Response) => {
  const { userId, missionId } = req.body;

  if (!userId || !missionId) {
    return res.status(400).json({ error: "userId et missionId requis" });
  }

  const { data, error } = await supabase.rpc("complete_mission", {
    p_user_id:    Number(userId),
    p_mission_id: Number(missionId),
  });

  if (error) {
    console.error("RPC complete_mission:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }

  if (data?.error) {
    const status = data.error === "not_enough_energie" ? 422 : 400;
    return res.status(status).json({ success: false, ...data });
  }

  return res.json({
    success:        data.success,
    xpGained:       data.xp_gained,
    piecesEarned:   data.pieces_earned,
    totalPieces:    data.total_pieces,
    puzzleComplete: data.puzzle_complete,
    nextZoneId:     data.next_zone_id,
    zoneUnlocked:   data.zone_unlocked,
  });
});

// ─── GET /zones/:userId/:worldSlug ────────────────────────────────────────────

router.get("/zones/:userId/:worldSlug", async (req: Request, res: Response) => {
  const { userId, worldSlug } = req.params;

  const { data: world, error: worldErr } = await supabase
    .from("world")
    .select("id_world")
    .eq("slug", worldSlug)
    .single();

  if (worldErr || !world) {
    return res.status(404).json({ error: "Monde introuvable" });
  }

  const { data: zones, error: zonesErr } = await supabase
    .from("zone")
    .select("id_zone, nom, slug, image_url, ordre, accent_color")
    .eq("id_world", world.id_world)
    .order("ordre", { ascending: true });

  if (zonesErr) {
    return res.status(500).json({ error: "Erreur chargement zones" });
  }

  const zoneIds   = zones.map((z: any) => z.id_zone);

  // Toutes les données en parallèle
  const [
    { data: zoneProgresses },
    { data: puzzleConfigs },
    { data: allMissions },
    { data: doneValidations },
  ] = await Promise.all([
    supabase
      .from("zone_progress")
      .select("id_zone, unlocked, completed")
      .eq("id_user", userId)
      .in("id_zone", zoneIds),

    supabase
      .from("puzzle_config")
      .select("id_zone, id_puzzle, total_pieces")
      .in("id_zone", zoneIds),

    supabase
      .from("mission")
      .select("id_zone, id_mission")
      .in("id_zone", zoneIds),

    supabase
      .from("mission_validation")
      .select("id_mission, mission!inner(id_zone)")
      .eq("id_user", userId),
  ]);

  // Index rapides
  const progressByZone: Record<number, any> = {};
  (zoneProgresses ?? []).forEach((zp: any) => { progressByZone[zp.id_zone] = zp; });

  const configByZone: Record<number, any> = {};
  (puzzleConfigs ?? []).forEach((pc: any) => { configByZone[pc.id_zone] = pc; });

  const totalMissionsByZone: Record<number, number> = {};
  (allMissions ?? []).forEach((m: any) => {
    totalMissionsByZone[m.id_zone] = (totalMissionsByZone[m.id_zone] ?? 0) + 1;
  });

  const doneIdSet = new Set((doneValidations ?? []).map((v: any) => v.id_mission));
  const doneMissionsByZone: Record<number, number> = {};
  (allMissions ?? []).forEach((m: any) => {
    if (doneIdSet.has(m.id_mission)) {
      doneMissionsByZone[m.id_zone] = (doneMissionsByZone[m.id_zone] ?? 0) + 1;
    }
  });

  // Progression puzzle
  const puzzleIds = (puzzleConfigs ?? []).map((pc: any) => pc.id_puzzle);
  const { data: puzzleProgresses } = puzzleIds.length
    ? await supabase
        .from("puzzle_progress")
        .select("id_puzzle, pieces_earned, is_complete")
        .eq("id_user", userId)
        .in("id_puzzle", puzzleIds)
    : { data: [] };

  const puzzleProgressById: Record<number, any> = {};
  (puzzleProgresses ?? []).forEach((pp: any) => { puzzleProgressById[pp.id_puzzle] = pp; });

  return res.json(
    zones.map((z: any) => {
      const config = configByZone[z.id_zone];
      const pp     = config ? puzzleProgressById[config.id_puzzle] : null;
      const zp     = progressByZone[z.id_zone];

      return {
        id:             z.id_zone,
        name:           z.nom,
        slug:           z.slug,
        imageUrl:       z.image_url,
        ordre:          z.ordre,
        accentColor:    z.accent_color,
        unlocked:       zp?.unlocked  ?? false,
        completed:      zp?.completed ?? false,
        totalPieces:    config?.total_pieces   ?? 9,
        piecesEarned:   pp?.pieces_earned      ?? 0,
        puzzleComplete: pp?.is_complete        ?? false,
        totalMissions:  totalMissionsByZone[z.id_zone] ?? 0,
        doneMissions:   doneMissionsByZone[z.id_zone]  ?? 0,
      };
    })
  );
});

// ─── GET /users/:id/friends ───────────────────────────────────────────────────

router.get("/users/:id/friends", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("friendships")
    .select(`
      friend_id,
      users!friendships_friend_id_fkey (
        id_user,
        nom,
        prenom,
        email,
        avatar_url,
        xp
      )
    `)
    .eq("id_user", req.params.id);

  if (error) return res.status(400).json({ error });

  const friends = (data ?? []).map((row: any) => ({
    id_user:    row.users.id_user,
    nom:        row.users.nom,
    prenom:     row.users.prenom,
    email:      row.users.email,
    avatar_url: row.users.avatar_url,
    xp:         row.users.xp,
  }));

  return res.json(friends);
});

// ─── POST /notifications ──────────────────────────────────────────────────────

router.post("/notifications", async (req: Request, res: Response) => {
  const { id_user_cible, id_defi, type, titre, message } = req.body;

  if (!titre || !message) {
    return res.status(400).json({ error: "titre et message requis" });
  }

  const { error } = await supabase
    .from("notifications")
    .insert([{ id_user_cible, id_defi, type, titre, message }]);

  if (error) return res.status(400).json({ error });

  return res.json({ ok: true });
});

export default router;