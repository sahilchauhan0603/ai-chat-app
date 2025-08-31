import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";
import type { Channel, DefaultGenerics, Event, StreamChat } from "stream-chat";
import type { AIAgent } from "../types";
import { GeminiResponseHandler } from "./GeminiResponseHandler";

export class GeminiAgent implements AIAgent {
  private genAI?: GoogleGenerativeAI;
  private model?: GenerativeModel;
  private chatSession?: any;
  private lastInteractionTs = Date.now();

  private handlers: GeminiResponseHandler[] = [];

  constructor(
    readonly chatClient: StreamChat,
    readonly channel: Channel
  ) {}

  dispose = async () => {
    this.chatClient.off("message.new", this.handleMessage);
    await this.chatClient.disconnectUser();

    this.handlers.forEach((handler) => handler.dispose());
    this.handlers = [];
  };

  get user() {
    return this.chatClient.user;
  }

  getLastInteraction = (): number => this.lastInteractionTs;

  init = async () => {
    const apiKey = process.env.GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }

    // Get model name from environment or default to Gemini 2.5 Pro
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-pro";
    
    console.log(`[GeminiAgent] Initializing with model: ${modelName}`);
    
    // Get configuration from environment or use defaults
    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || "0.7");
    const topP = parseFloat(process.env.GEMINI_TOP_P || "0.95");
    const topK = parseInt(process.env.GEMINI_TOP_K || "40");
    
    console.log(`[GeminiAgent] Configuration: temperature=${temperature}, topP=${topP}, topK=${topK}`);
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        topP,
        topK,
      },
    });

    // Initialize chat session
    this.chatSession = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello, I need your help with writing." }],
        },
        {
          role: "model",
          parts: [{ text: "I'm here to help with your writing needs. What would you like assistance with?" }],
        },
      ],
      generationConfig: {
        temperature,
        topP,
        topK,
      },
    });

    this.chatClient.on("message.new", this.handleMessage);
  };

  private getWritingAssistantPrompt = (context?: string): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `You are an expert AI Writing Assistant. Your primary purpose is to be a collaborative writing partner.

**Your Core Capabilities:**
- Content Creation, Improvement, Style Adaptation, Brainstorming, and Writing Coaching.
- **Current Date**: Today's date is ${currentDate}. Please use this for any time-sensitive queries.

**Response Format:**
- Be direct and production-ready.
- Use clear formatting.
- Never begin responses with phrases like "Here's the edit:", "Here are the changes:", or similar introductory statements.
- Provide responses directly and professionally without unnecessary preambles.

**Writing Context**: ${context || "General writing assistance."}`;  
  };

  private handleMessage = async (e: Event<DefaultGenerics>) => {
    if (!this.genAI || !this.model || !this.chatSession) {
      console.log("Gemini not initialized");
      return;
    }

    if (!e.message || e.message.ai_generated) {
      return;
    }

    const message = e.message.text;
    if (!message) return;

    this.lastInteractionTs = Date.now();

    const writingTask = (e.message.custom as { writingTask?: string })
      ?.writingTask;
    const context = writingTask ? `Writing Task: ${writingTask}` : undefined;
    const instructions = this.getWritingAssistantPrompt(context);

    const { message: channelMessage } = await this.channel.sendMessage({
      text: "",
      ai_generated: true,
    });

    await this.channel.sendEvent({
      type: "ai_indicator.update",
      ai_state: "AI_STATE_THINKING",
      cid: channelMessage.cid,
      message_id: channelMessage.id,
    });

    try {
      const result = await this.chatSession.sendMessageStream(message);

      const handler = new GeminiResponseHandler(
        result.stream,
        this.chatClient,
        this.channel,
        channelMessage,
        () => this.removeHandler(handler)
      );
      this.handlers.push(handler);
      void handler.run();
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });
    }
  };

  private removeHandler = (handlerToRemove: GeminiResponseHandler) => {
    this.handlers = this.handlers.filter(
      (handler) => handler !== handlerToRemove
    );
  };
}