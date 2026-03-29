import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));
app.use('/sample', express.static(path.join(rootDir, 'public', 'sample')));

async function analyzeSketch(payload) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  if (!apiKey || !model) throw new Error('Missing OpenRouter env.');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are Sketchboard AI. Convert a rough sketch summary into a concise product concept and UI plan. Return valid JSON only with keys: productName, category, audience, summary, features, components, hero, cards. hero must have headline, subheadline, cta. cards must be an array of 3-4 objects with keys kicker, title, body, span. span is 1 or 2.',
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'OpenRouter request failed.');
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content.');
  return JSON.parse(content);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/analyze-sketch', async (req, res) => {
  const notes = String(req.body?.notes || '').trim();
  const structuralSummary = String(req.body?.structuralSummary || '').trim();
  if (!notes && !structuralSummary) {
    return res.status(400).json({ error: 'Need sketch notes or structure.' });
  }

  try {
    const result = await analyzeSketch({
      notes,
      structuralSummary,
      summary: req.body?.summary || null,
      fileNames: req.body?.fileNames || [],
    });
    return res.json({ model: process.env.OPENROUTER_MODEL, result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Analysis failed.' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Sketchboard AI listening on ${port}`);
});
