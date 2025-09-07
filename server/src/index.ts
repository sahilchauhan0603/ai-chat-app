// Import necessary modules
import cors from "cors"; // For handling Cross-Origin Resource Sharing
import "dotenv/config"; // For loading environment variables from .env file
import express from "express"; // The Express.js framework for building web applications
import { createAgent } from "./agents/createAgent"; // Function to create AI agent instances
import { AgentPlatform, AIAgent } from "./agents/types"; // Types for AI agents
import { apiKey, serverClient } from "./serverClient"; // API key and Stream Chat server client

// Initialize the Express application
const app = express();
// Increase body size limits to accommodate larger payloads if needed
app.use(express.json({ limit: "10mb" })); // Enable parsing of JSON request bodies
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({ origin: "*" })); // Enable CORS for all origins

// Map to store the AI Agent instances
// Key: user_id (string), Value: AIAgent instance
const aiAgentCache = new Map<string, AIAgent>();
// Set to track AI agents that are currently being initialized
const pendingAiAgents = new Set<string>();

// Define inactivity threshold for AI agents (currently 8 hours in milliseconds)
const inactivityThreshold = 480 * 60 * 1000;

// Periodically check for inactive AI agents and dispose of them
// This runs every 5 seconds
setInterval(async () => {
  const now = Date.now();
  // Iterate over all cached AI agents
  for (const [userId, aiAgent] of aiAgentCache) {
    // If an agent has been inactive for longer than the threshold, dispose of it
    if (now - aiAgent.getLastInteraction() > inactivityThreshold) {
      console.log(`Disposing AI Agent due to inactivity: ${userId}`);
      await disposeAiAgent(aiAgent); // Dispose of the agent's resources
      aiAgentCache.delete(userId); // Remove the agent from the cache
    }
  }
}, 5000);

// Define a GET endpoint for the root path
app.get("/", (req, res) => {
  res.json({
    message: "AI Writing Assistant Server is running", // Status message
    // apiKey: apiKey, // API key (commented out)
    activeAgents: aiAgentCache.size, // Number of currently active AI agents
  });
});

/**
 * Handle the request to start the AI Agent.
 * This endpoint initializes and manages AI agents for chat channels.
 */
app.post("/start-ai-agent", async (req, res) => {
  // Extract channel_id and optional channel_type from the request body
  const { channel_id, channel_type = "messaging" } = req.body;
  console.log(`[API] /start-ai-agent called for channel: ${channel_id}`);

  // Simple validation: check if channel_id is provided
  if (!channel_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Construct a unique user ID for the AI bot based on the channel ID
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;

  try {
    // Prevent multiple agents from being created for the same channel simultaneously
    if (!aiAgentCache.has(user_id) && !pendingAiAgents.has(user_id)) {
      console.log(`[API] Creating new agent for ${user_id}`);
      pendingAiAgents.add(user_id); // Add to pending set to avoid race conditions

      // Upsert (update or insert) the AI bot user into Stream Chat
      await serverClient.upsertUser({
        id: user_id,
        name: "AI Writing Assistant",
      });

      // Get the channel instance and add the AI bot as a member
      const channel = serverClient.channel(channel_type, channel_id);
      await channel.addMembers([user_id]);

      // Create a new AI agent instance
      const agent = await createAgent(
        user_id,
        AgentPlatform.GEMINI, // Specify the AI platform (e.g., Gemini)
        channel_type,
        channel_id
      );

      await agent.init(); // Initialize the AI agent

      // Final check to prevent race conditions where an agent might have been added
      // while this one was initializing. If it was added by another process, dispose of this one.
      if (aiAgentCache.has(user_id)) {
        await agent.dispose();
      } else {
        aiAgentCache.set(user_id, agent); // Store the initialized agent in the cache
      }
    } else {
      console.log(`AI Agent ${user_id} already started or is pending.`);
    }

    res.json({ message: "AI Agent started", data: [] }); // Respond with success message
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to start AI Agent", errorMessage);
    res
      .status(500)
      .json({ error: "Failed to start AI Agent", reason: errorMessage }); // Respond with error
  } finally {
    pendingAiAgents.delete(user_id); // Remove from pending set regardless of outcome
  }
});

/**
 * Handle the request to stop the AI Agent.
 * This endpoint disposes of an AI agent and removes it from the cache.
 */
app.post("/stop-ai-agent", async (req, res) => {
  const { channel_id } = req.body; // Extract channel_id from request body
  console.log(`[API] /stop-ai-agent called for channel: ${channel_id}`);
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`; // Construct user ID
  try {
    const aiAgent = aiAgentCache.get(user_id); // Get the AI agent from the cache
    if (aiAgent) {
      console.log(`[API] Disposing agent for ${user_id}`);
      await disposeAiAgent(aiAgent); // Dispose of the agent's resources
      aiAgentCache.delete(user_id); // Remove the agent from the cache
    } else {
      console.log(`[API] Agent for ${user_id} not found in cache.`);
    }
    res.json({ message: "AI Agent stopped", data: [] }); // Respond with success message
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to stop AI Agent", errorMessage);
    res
      .status(500)
      .json({ error: "Failed to stop AI Agent", reason: errorMessage }); // Respond with error
  }
});

// Define a GET endpoint to check the status of an AI agent
app.get("/agent-status", (req, res) => {
  const { channel_id } = req.query; // Extract channel_id from query parameters
  // Validate channel_id
  if (!channel_id || typeof channel_id !== "string") {
    return res.status(400).json({ error: "Missing channel_id" });
  }
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`; // Construct user ID
  console.log(
    `[API] /agent-status called for channel: ${channel_id} (user: ${user_id})`
  );

  // Check agent status based on cache and pending set
  if (aiAgentCache.has(user_id)) {
    console.log(`[API] Status for ${user_id}: connected`);
    res.json({ status: "connected" }); // Agent is active
  } else if (pendingAiAgents.has(user_id)) {
    console.log(`[API] Status for ${user_id}: connecting`);
    res.json({ status: "connecting" }); // Agent is being initialized
  } else {
    console.log(`[API] Status for ${user_id}: disconnected`);
    res.json({ status: "disconnected" }); // Agent is not active
  }
});

// Token provider endpoint - generates secure tokens for Stream Chat client-side authentication
app.post("/token", async (req, res) => {
  try {
    const { userId } = req.body; // Extract userId from request body

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    // Create a Stream Chat token with expiration (1 hour) and issued at time for security
    const issuedAt = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const expiration = issuedAt + 60 * 60; // Token expires in 1 hour

    const token = serverClient.createToken(userId, expiration, issuedAt);

    res.json({ token }); // Respond with the generated token
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      error: "Failed to generate token",
    });
  }
});

/**
 * Disposes of an AI agent's resources and deletes the associated user from Stream Chat.
 * @param aiAgent The AI agent instance to dispose.
 */
async function disposeAiAgent(aiAgent: AIAgent) {
  await aiAgent.dispose(); // Call the agent's dispose method
  // If the agent has a user, delete the user from Stream Chat
  if (!aiAgent.user) {
    return;
  }
  await serverClient.deleteUser(aiAgent.user.id, {
    hard_delete: true, // Perform a hard delete of the user
  });
}

// Start the Express server
const port = process.env.PORT || 3000; // Get port from environment variables or default to 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log server start message
});
