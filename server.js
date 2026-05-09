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

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, view } = req.body;

    const systemPrompt = `You are Themis, an AI compliance copilot for an AML (Anti-Money Laundering) intelligence platform called Themis by INCEDO. You help compliance analysts, investigators, and officers understand alerts, transactions, cases, and model governance data. Be concise, professional, and accurate. The user is currently viewing the ${view || 'dashboard'} screen. If asked about specific data, respond based on general AML expertise since you do not have live database access in this demo environment.`;

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
];

app.use(async (req, res, next) => {
  if (req.method !== 'GET') return next();
  const matched = DATA_PROXY_PREFIXES.some(
    p => req.path === p || req.path.startsWith(p + '/')
  );
  if (!matched) return next();

  const target = `${AGENT_API_URL}${req.originalUrl}`;
  try {
    const upstream = await fetch(target);
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
