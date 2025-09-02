// Import necessary types from the 'stream-chat' library
import type { Channel, StreamChat, User } from "stream-chat";

/**
 * Defines the interface for an AI Agent.
 * An AI Agent manages interactions within a chat channel.
 */
export interface AIAgent {
  user?: User; // Optional user associated with the AI agent
  channel: Channel; // The chat channel the AI agent operates in
  chatClient: StreamChat; // The StreamChat client instance used by the agent
  getLastInteraction: () => number; // Function to get the timestamp of the last interaction
  init: () => Promise<void>; // Method to initialize the AI agent
  dispose: () => Promise<void>; // Method to dispose of the AI agent's resources
}

/**
 * Enum for different AI Agent platforms.
 * This helps categorize and select the appropriate AI model.
 */
export enum AgentPlatform {
  GEMINI = "gemini", // Represents the Google Gemini AI platform
  WRITING_ASSISTANT = "writing_assistant", // Represents a general writing assistant platform (e.g., deprecated OpenAI)
}

/**
 * Extended message type for writing assistant features.
 * This interface allows for custom properties within chat messages
 * to support specific writing assistant functionalities.
 */
export interface WritingMessage {
  custom?: { // Optional custom data for the message
    messageType?: "user_input" | "ai_response" | "system_message"; // Type of message content
    writingTask?: string; // Description of a writing task
    suggestions?: string[]; // Array of writing suggestions
  };
}
