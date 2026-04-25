export async function handleNodeAssistant(req, res) {
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ answer: "Assistant non disponibile in locale.", status: 500 }));
}
