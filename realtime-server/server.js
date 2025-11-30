const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");

require("dotenv").config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`[REQUEST] Origin: ${req.headers.origin || 'none'}`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Realtime socket logic (existing) ---
io.on("connection", (socket) => {
  const room = socket.handshake.query.room || "default";
  socket.join(room);

  socket.on("update", (payload) => {
    io.to(room).emit("update", { ...payload, serverTs: Date.now() });
  });

  socket.on("ping", (clientTs) => {
    socket.emit("pong", { clientTs, serverTs: Date.now() });
  });
});

// --- NEW AI suggestion endpoint ---
// Only initialize OpenAI client if API key is provided
let client = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("[AI] OpenAI client initialized");
} else {
  console.warn("[AI] WARNING: OPENAI_API_KEY not set. AI suggestions will be disabled.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.post("/api/suggestions", async (req, res) => {
  // Set CORS headers explicitly
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  console.log("[API] POST /api/suggestions called");
  console.log("[API] Request body:", JSON.stringify(req.body));

  // Check if OpenAI client is available
  if (!client) {
    return res.status(503).json({
      error: "AI suggestions are not available. OPENAI_API_KEY is not configured.",
      suggestions: []
    });
  }

  try {
    const { description, pastItems = [] } = req.body;

    // Validate input
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({ 
        error: "Description is required",
        suggestions: [] 
      });
    }
    const messages = [
      {
        role: "system",
        content:
          "You help users build shopping lists for gatherings. " +
          "Given their description and items they already have, " +
          "suggest 8-12 other useful items. " +
          "CRITICAL RULES: " +
          "Each suggestion must be a SINGLE, SPECIFIC item - never use 'OR', 'and/or', or list multiple items. " +
          "Each suggestion should be one specific product/item (e.g., 'Paper Plates', 'Ice', 'Napkins', 'Chips'). " +
          "Return only JSON with a `suggestions` array of strings.",
      },
      {
        role: "user",
        content: `
Gathering: "${description}"
Already have: ${pastItems.join(", ") || "(none)"}
        `,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
    });

    const jsonText = completion.choices[0].message.content;
    const data = JSON.parse(jsonText);

    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error("Model did not return a suggestions array");
    }

    // Post-process suggestions to ensure each is at most 3 words
    const processedSuggestions = data.suggestions.map(suggestion => {
      if (typeof suggestion !== 'string') {
        suggestion = String(suggestion);
      }
      const words = suggestion.trim().split(/\s+/);
      // Take only first 3 words and join them
      return words.slice(0, 3).join(' ');
    }).filter(suggestion => suggestion.length > 0); // Remove empty suggestions

    console.log(`[AI Response] Generated ${processedSuggestions.length} suggestions (truncated to max 3 words each)`);
    res.json({ suggestions: processedSuggestions });
  } catch (err) {
    console.error("[ERROR] AI suggestion error:", err.message);
    console.error("[ERROR] Error stack:", err.stack);
    
    // Ensure response is sent even on error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: err.message || "Failed to generate suggestions",
        suggestions: [] 
      });
    }
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Realtime + AI server running on port ${PORT}`)
);