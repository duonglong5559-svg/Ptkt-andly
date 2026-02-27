#!/usr/bin/env node
/**
 * Lightweight chatbot server using OpenAI API.
 * - POST /chat  { messages: [{role: "user"|"system"|"assistant", content: "..."}, ...] }
 * - Response: OpenAI chat completion object
 *
 * Usage:
 *   - Set OPENAI_API_KEY in env
 *   - npm install
 *   - node src/ai/chatbot.js
 */

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment. See .env.example");
  process.exit(1);
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Chatbot server is running. POST /chat to interact." });
});

/**
 * POST /chat
 * body: { messages: [{role, content}, ...] }
 */
app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Request body must contain messages: [ {role, content}, ... ]" });
  }

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      // max_tokens, temperature, etc. can be added here or via query params/env
    });

    // Return the full response from the OpenAI client
    return res.json(resp);
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot server listening on http://localhost:${PORT}`);
});
