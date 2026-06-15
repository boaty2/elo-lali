export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const name = "lalitamugiwara";
  const tag = "lali";
  const region = "las";

  try {
    const url = `https://lol-api-summoner.op.gg/api/${region}/summoners/by-name/${name}%23${tag}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok) {
      return res.status(200).send(`No se encontró al invocador ${name}#${tag} en ${region.toUpperCase()}.`);
    }

    const data = await response.json();
    const summonerData = data.data;
    const soloQueue = summonerData.league_stats?.find(stat => stat.queue_info?.game_type === 'SOLORANKED');

    if (!soloQueue || !soloQueue.tier_info) {
      return res.status(200).send(`El jugador ${name}#${tag} está Unranked en SoloQ.`);
    }

    const tier = soloQueue.tier_info.tier || "Unranked";
    const division = soloQueue.tier_info.division || "";
    const lp = soloQueue.tier_info.lp ?? 0;
    const wins = soloQueue.win ?? 0;
    const losses = soloQueue.lose ?? 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return res.status(200).send(`Invocador: ${name}#${tag} [${region.toUpperCase()}] | Rango: ${tier} ${division} (${lp} LP) | W/L: ${wins}V - ${losses}D (${winRate}% Winrate)`);

  } catch (error) {
    console.error(error);
    return res.status(200).send("Error al conectar con los datos de League of Legends.");
  }
}
