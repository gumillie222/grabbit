const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/api/suggestions", async (req, res) => {
  const { description, pastItems = [] } = req.body;

  try {
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

    res.json({ suggestions: data.suggestions });
  } catch (err) {
    console.error("AI suggestion error:", err.message);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Realtime + AI server running on port ${PORT}`)
);