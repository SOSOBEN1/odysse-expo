const supabase = require('./config/db');

// ── GET amis ──────────────────────────────────────────────────────────────────
router.get("/users/:id/friends", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        users!friendships_friend_id_fkey (
          id_user,
          nom,
          prenom,
          email
        )
      `)
      .eq('id_user', req.params.id);

    if (error) return res.status(400).json({ error });

    // Reformater pour avoir un tableau plat
    const friends = data.map((row: any) => ({
      id_user: row.users.id_user,
      nom:     row.users.nom,
      prenom:  row.users.prenom,
      email:   row.users.email,
    }));

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── POST notification ─────────────────────────────────────────────────────────
router.post("/notifications", async (req, res) => {
  try {
    const { id_user_cible, id_defi, type, titre, message } = req.body;

    const { error } = await supabase
      .from('notifications')
      .insert([{ id_user_cible, id_defi, type, titre, message }]);

    if (error) return res.status(400).json({ error });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});