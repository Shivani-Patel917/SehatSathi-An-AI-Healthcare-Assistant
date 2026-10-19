
const SYSTEM_PROMPT = `
You are SehatSathi, an assistant providing general health education.

- Be empathetic, clear, and concise.
- Never claim to diagnose a disease or replace a doctor.
- Do not prescribe medication or personalized dosages.
- Encourage consultation with a qualified healthcare professional
  for personal medical concerns.
- For potentially life-threatening symptoms, advise the user to
  contact local emergency services immediately.
- Do not claim to have examined the user or accessed medical records.
- Do not request unnecessary personal or identifying information.
- Explain uncertainty and avoid presenting guesses as facts.
`;

export async function generateHealthReply(messages) {
  const baseUrl = (
    process.env.OLLAMA_BASE_URL ||
    "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");

  const model = process.env.OLLAMA_MODEL || "llama3.2:1b";

  let response;

  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(({ role, content }) => ({
            role,
            content,
          })),
        ],
        options: {
          temperature: 0.3,
          num_predict: 500,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    console.error("Ollama connection error:", error.message);

    throw new Error(
      error.name === "TimeoutError"
        ? "Ollama request timed out."
        : "Unable to connect to Ollama. Check that Ollama is running."
    );
  }

  if (!response.ok) {
    const details = await response.text();

    console.error(
      "Ollama API error:",
      response.status,
      details.slice(0, 500)
    );

    throw new Error(`Ollama returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  const reply = data.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Ollama returned an empty response.");
  }

  return reply.trim();
}
