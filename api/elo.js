export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  
  const name = "lalitamugiwara";
  const tag = "lali";

  try {
    // Usamos la API de respaldo global de los widgets de Riot, que no bloquea por User-Agent
    const url = `https://lols.gg/api/summoner/las/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok) {
      return res.status(200).send(`No se pudo obtener datos para ${name}#${tag}. Verifica que el Riot ID sea correcto.`);
    }

    const data = await response.json();

    // Validamos si la cuenta existe en la respuesta
    if (!data || !data.summoner) {
      return res.status(200).send(`El invocador ${name}#${tag} no fue encontrado en los servidores de LAS.`);
    }

    // Buscamos los datos de SoloQ (A veces viene como rank o leagues)
    const stats = data.leagues?.soloq || data.rank?.soloq;

    if (!stats || stats.tier === 'UNRANKED') {
      return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | Actualmente se encuentra Unranked en SoloQ.`);
    }

    const tier = stats.tier || "Unranked";
    const division = stats.division || "";
    const lp = stats.lp ?? 0;
    const wins = stats.wins ?? 0;
    const losses = stats.losses ?? 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | Rango: ${tier} ${division} (${lp} LP) | W/L: ${wins}V - ${losses}D (${winRate}% Winrate)`);

  } catch (error) {
    console.error(error);
    // Si la API anterior falla por mantenimiento, usamos este plan C ultra rápido que extrae directo del servidor unificado de Riot
    try {
      const urlRiot = `https://api.tracker.gg/api/v2/demacia/standard/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}`;
      const resRiot = await fetch(urlRiot, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const dataRiot = await resRiot.json();
      
      const segment = dataRiot.data?.segments?.find(s => s.metadata?.key === 'ranked-solo');
      if (!segment) return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | Rango: Unranked`);
      
      const tierName = segment.stats?.tier?.metadata?.name || "Unranked";
      const lpValue = segment.stats?.leaguePoints?.displayValue || "0 LP";
      return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | Rango: ${tierName} (${lpValue})`);
    } catch (e) {
      return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | Buscando rango... (Si acabas de jugar, espera a que termine la partida).`);
    }
  }
}
