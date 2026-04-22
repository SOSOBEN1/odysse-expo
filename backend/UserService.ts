const API_URL = "http://192.168.43.171:3000";
export interface Friend {
  id: number;
  name: string;
  email: string;
}

export async function getFriends(): Promise<Friend[]> {
  const res = await fetch(`${API_URL}/users/1/friends`); // ← remplace 1 par l'id de l'user connecté
  if (!res.ok) throw new Error("Erreur chargement amis");
  const data = await res.json();

  return data.map((u: any) => ({
    id:    u.id_user,
    name:  `${u.prenom} ${u.nom}`,
    email: u.email,
  }));
}