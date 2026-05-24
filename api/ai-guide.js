export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY не настроен' });
  }

  try {
    const contents = [];
    
    if (history && Array.isArray(history)) {
      history.forEach(turn => {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }]
        });
      });
    }
    
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'Вы профессиональный экскурсовод по Республике Адыгея. Отвечайте на русском языке, дружелюбно и информативно.' }]
          },
          contents
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Ошибка Gemini API');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось получить ответ.';
    res.status(200).json({ text });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
