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
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          "Return only JSON with a `suggestions` array.",
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

    console.log(`[AI Response] Generated ${data.suggestions.length} suggestions`);
    res.json({ suggestions: data.suggestions });
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