export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  
  const name = "lalitamugiwara";
  const tag = "lali";
  const region = "las"; // Servidor Latinoamérica Sur

  try {
    // Usamos el endpoint espejo de League of Legends optimizado para superposición de bots de Twitch
    const url = `https://decapi.me/riot/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?region=${region}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(200).send(`No se encontraron datos en Riot para ${name}#${tag}.`);
    }

    const textData = await response.text();

    // Si la cuenta no existe o está mal escrita, la API devuelve un mensaje de error interno
    if (textData.toLowerCase().includes("error") || textData.toLowerCase().includes("not found")) {
      return res.status(200).send(`El invocador ${name}#${tag} no pudo ser verificado en LAS.`);
    }

    // Consultamos directamente el rango SoloQ usando el puente de Decapi para chats
    const rankUrl = `https://decapi.me/riot/rank/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?queue=solo`;
    const rankResponse = await fetch(rankUrl);
    const rankText = await rankResponse.text();

    // Si está Unranked o da error, lo manejamos limpiamente
    if (rankText.toLowerCase().includes("unranked") || rankText.trim() === "") {
      return res.status(200).send(`Invocador: ${name}#${tag} [${region.toUpperCase()}] | Rango: Unranked (Sin Clasificar)`);
    }

    // Respuesta limpia y directa para el chat de Twitch
    return res.status(200).send(`Invocador: ${name}#${tag} [${region.toUpperCase()}] | Rango: ${rankText.trim()}`);

  } catch (error) {
    console.error(error);
    return res.status(200).send(`Invocador: ${name}#${tag} [LAS] | El servidor de Riot está tardando en responder. Inténtalo de nuevo en unos momentos.`);
  }
}
