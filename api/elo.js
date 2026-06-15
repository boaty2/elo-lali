export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  
  // Tu Riot ID limpio
  const name = "lalitamugiwara";
  const tag = "lali";
  const region = "las"; 

  try {
    // Usamos el endpoint unificado que resuelve Riot IDs sin importar las cookies de OP.GG
    const url = `https://lol-api-summoner.op.gg/api/v2/${region}/summoners/by-name/${encodeURIComponent(name)}?tagline=${encodeURIComponent(tag)}`;
    
    // Si el v2 falla, usamos el mirror directo de Ledge Riot
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Intento de respaldo rápido por si tu cuenta está indexada en minúsculas estrictas en la API
      const fallbackUrl = `https://lol-api-summoner.op.gg/api/v2/${region}/summoners/by-name/${name.toLowerCase()}?tagline=${tag.toLowerCase()}`;
      const fallbackRep = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      
      if (!fallbackRep.ok) {
        return res.status(200).send(`Invocador ${name}#${tag} no registrado en el sistema. Juega una ranked soloq para activar el perfil.`);
      }
      return procesarDatos(await fallbackRep.json(), name, tag, region, res);
    }

    const data = await response.json();
    return procesarDatos(data, name, tag, region, res);

  } catch (error) {
    console.error(error);
    return res.status(200).send("Error de conexión con el servidor de League of Legends.");
  }
}

function procesarDatos(data, name, tag, region, res) {
  const summonerData = data.data || data;
  
  // Buscamos las estadísticas de Solo Queue
  const soloQueue = summonerData.league_stats?.find(stat => stat.queue_info?.game_type === 'SOLORANKED') 
                    || summonerData.summoner_league_stats?.find(stat => stat.queue_info?.game_type === 'SOLORANKED');

  if (!soloQueue || !soloQueue.tier_info) {
    return res.status(200).send(`El jugador ${name}#${tag} [${region.toUpperCase()}] actualmente se encuentra Unranked en SoloQ.`);
  }

  const tier = soloQueue.tier_info.tier || "Unranked";
  const division = soloQueue.tier_info.division || "";
  const lp = soloQueue.tier_info.lp ?? 0;
  const wins = soloQueue.win ?? 0;
  const losses = soloQueue.lose ?? 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return res.status(200).send(`Invocador: ${name}#${tag} [${region.toUpperCase()}] | Rango: ${tier} ${division} (${lp} LP) | W/L: ${wins}V - ${losses}D (${winRate}% Winrate)`);
}
