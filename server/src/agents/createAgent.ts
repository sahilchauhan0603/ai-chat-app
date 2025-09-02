// Import necessary modules from stream-chat and local files
import { StreamChat } from "stream-chat";
import { apiKey, serverClient } from "../serverClient";
// import { OpenAIAgent } from "./openai/OpenAIAgent"; // Commented out as OpenAI agent is no longer supported
import { GeminiAgent } from "./gemini/GeminiAgent"; // Import the GeminiAgent class
import { AgentPlatform, AIAgent } from "./types"; // Import AgentPlatform enum and AIAgent interface

/**
 * Creates and initializes an AI agent based on the specified platform.
 * @param user_id The ID of the user for whom the agent is being created.
 * @param platform The AI platform to use (e.g., Gemini).
 * @param channel_type The type of the chat channel.
 * @param channel_id The ID of the chat channel.
 * @returns A promise that resolves to an AIAgent instance.
 */
export const createAgent = async (
  user_id: string,
  platform: AgentPlatform,
  channel_type: string,
  channel_id: string
): Promise<AIAgent> => {
  // Create a token for the AI bot user
  const token = serverClient.createToken(user_id);

  // Initialize the StreamChat client for the AI bot user
  const chatClient = new StreamChat(apiKey, undefined, {
    allowServerSideConnect: true, // Allow server-side connection for the bot
  });

  // Connect the AI bot user to Stream Chat
  await chatClient.connectUser({ id: user_id }, token);

  // Get the chat channel and watch it for updates
  const channel = chatClient.channel(channel_type, channel_id);
  await channel.watch();

  // Create an agent instance based on the specified platform
  switch (platform) {
    case AgentPlatform.WRITING_ASSISTANT:
      // Throw an error if the OpenAI agent is selected, as it's deprecated
      throw new Error(`OpenAI agent is no longer supported.`);
    case AgentPlatform.GEMINI:
      // Return a new GeminiAgent instance for the Gemini platform
      return new GeminiAgent(chatClient, channel);
    default:
      // Throw an error for unsupported AI platforms
      throw new Error(`Unsupported agent platform: ${platform}`);
  }
};
