const supabase = require('./config/db');

// Exemple : récupérer des données
app.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) return res.status(400).json({ error });
  res.json(data);
});