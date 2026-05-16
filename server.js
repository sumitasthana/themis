import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Python Agent API base URL
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8000';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const MODEL_ID = process.env.AWS_BEDROCK_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0';

// Fetch JSON from the Python agent API, returning null on any failure so the
// chat still works (just without live context) if the agent is down.
async function agentGet(path) {
  try {
    const r = await fetch(`${AGENT_API_URL}${path}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Map the screen the user is on to the agent endpoints worth pulling in.
// The dashboard summary is always useful, so it's fetched for every view.
function endpointsForView(view) {
  const v = (view || '').toLowerCase();
  const eps = ['/api/dashboard/summary'];
  if (v.includes('alert') || v.includes('briefing') || v.includes('dashboard')) eps.push('/api/alerts');
  if (v.includes('case')) eps.push('/api/cases');
  if (v.includes('sar')) eps.push('/api/sars');
  if (v.includes('anomal')) eps.push('/api/anomalies');
  if (v.includes('screen')) eps.push('/api/screening');
  if (v.includes('customer')) eps.push('/api/customers');
  if (v.includes('model') || v.includes('governance')) eps.push('/api/models');
  if (v.includes('connector') || v.includes('setting')) eps.push('/api/connectors');
  if (v.includes('audit') || v.includes('investigation')) eps.push('/api/investigations');
  return [...new Set(eps)];
}

// Pull live data from Postgres (via the agent API) and format it as a context
// block for the system prompt. Returns '' if nothing could be fetched.
async function buildLiveContext(view) {
  const endpoints = endpointsForView(view);
  const results = await Promise.all(endpoints.map(agentGet));
  const blocks = [];
  endpoints.forEach((ep, i) => {
    const data = results[i];
    if (data == null) return;
    // Cap list payloads so the prompt stays small.
    const trimmed = Array.isArray(data) ? data.slice(0, 25) : data;
    blocks.push(`${ep}:\n${JSON.stringify(trimmed)}`);
  });
  if (blocks.length === 0) return '';
  return `\n\nLIVE DATA (current contents of the Themis database — answer specific data questions from this, not from assumptions):\n${blocks.join('\n\n')}`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, view } = req.body;

    const liveContext = await buildLiveContext(view);

    const systemPrompt = `You are Themis, an AI compliance copilot for an AML (Anti-Money Laundering) intelligence platform called Themis. You help compliance analysts, investigators, and officers understand alerts, transactions, cases, and model governance data. Be concise, professional, and accurate. The user is currently viewing the ${view || 'dashboard'} screen. Do not use emojis, emoticons, or decorative icons in your responses — keep formatting plain and professional. Use markdown tables and lists where they aid clarity. When the LIVE DATA section below is present, base any data-specific answers on it; if a question needs data not included there, say so plainly rather than guessing.${liveContext}`;

    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.text
      }))
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      body: JSON.stringify(body),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    let text = '';
    if (responseBody.content && Array.isArray(responseBody.content)) {
      text = responseBody.content.map(c => c.type === 'text' ? c.text : '').join('');
    } else if (responseBody.completion) {
      text = responseBody.completion;
    }

    res.json({ text });
  } catch (error) {
    console.error('Bedrock error:', error);
    res.status(500).json({
      error: 'LLM service unavailable',
      text: 'I apologize, but I am unable to reach the AI backend at this moment. Please verify your AWS Bedrock configuration in .env and try again.'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// AGENT API PROXY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

app.post('/api/agent/investigate', async (req, res) => {
  try {
    const { alert_id } = req.body;
    
    console.log(`🔍 Proxying investigation request for alert: ${alert_id}`);
    
    const response = await fetch(`${AGENT_API_URL}/api/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Agent API error:', error);
    res.status(500).json({
      error: 'Agent API unavailable',
      message: 'Unable to connect to investigation agent. Make sure the Python API is running on port 8000.'
    });
  }
});

app.get('/api/agent/investigate/:alert_id/stream', async (req, res) => {
  try {
    const { alert_id } = req.params;
    
    console.log(`📡 Proxying streaming investigation for alert: ${alert_id}`);
    
    const response = await fetch(`${AGENT_API_URL}/api/investigate/${alert_id}/stream`);
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe the stream
    response.body.pipe(res);
  } catch (error) {
    console.error('Agent streaming error:', error);
    res.status(500).json({
      error: 'Agent streaming unavailable',
      message: 'Unable to stream from investigation agent.'
    });
  }
});

app.get('/api/agent/skills', async (req, res) => {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/skills`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Skills API error:', error);
    res.status(500).json({
      error: 'Skills API unavailable',
      skills: [],
      count: 0
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PHASE 1 DATA PROXY — forward read-only data routes to FastAPI
// ═══════════════════════════════════════════════════════════════════
// These prefixes are owned by the Python service; the Express layer
// just forwards. Order matters: keep this AFTER /api/chat and
// /api/agent/* so those continue to be handled directly.

const DATA_PROXY_PREFIXES = [
  '/api/alerts',
  '/api/cases',
  '/api/customers',
  '/api/sars',
  '/api/anomalies',
  '/api/screening',
  '/api/network',
  '/api/dashboard',
  '/api/models',
  '/api/connectors',
  '/api/transactions',
  '/api/investigations',
  '/api/typologies',
];

// POST routes that are allowed to pass through the proxy (must explicitly
// match here — anything else hits next() and is rejected later).
const ALLOWED_WRITES = [
  /^\/api\/cases\/[^/]+\/sar$/,                          // SAR draft
  /^\/api\/typologies\/harvest$/,                        // Phase 5 harvester
  /^\/api\/typologies\/candidates\/[^/]+\/approve$/,     // Phase 5 approve
  /^\/api\/typologies\/candidates\/[^/]+\/reject$/,      // Phase 5 reject
  /^\/api\/typologies\/promote$/,                        // Phase 5 promote
];

app.use(async (req, res, next) => {
  const matched = DATA_PROXY_PREFIXES.some(
    p => req.path === p || req.path.startsWith(p + '/')
  );
  if (!matched) return next();

  const isAllowedWrite = req.method === 'POST'
    && ALLOWED_WRITES.some(re => re.test(req.path));
  if (req.method !== 'GET' && !isAllowedWrite) return next();

  const target = `${AGENT_API_URL}${req.originalUrl}`;
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: req.method === 'POST'
        ? { 'Content-Type': 'application/json' }
        : undefined,
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined,
    });
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-encoding') return;
      res.setHeader(k, v);
    });
    const body = await upstream.text();
    res.send(body);
  } catch (error) {
    console.error(`Data proxy error (${target}):`, error.message);
    res.status(502).json({
      error: 'Agent API unreachable',
      message: 'Unable to reach the Python data API. Make sure it is running on port 8000.',
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Themis API server running on port ${PORT}`);
  console.log(`Agent API proxy: ${AGENT_API_URL}`);
});
