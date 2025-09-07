import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
} from "@google/generative-ai";
import axios from "axios";
import pdf from "pdf-parse";
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

    console.log(
      `[GeminiAgent] Configuration: temperature=${temperature}, topP=${topP}, topK=${topK}`
    );

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
          parts: [
            {
              text: "I'm here to help with your writing needs. What would you like assistance with?",
            },
          ],
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

    const message = e.message.text || "";

    this.lastInteractionTs = Date.now();

    const writingTask = (e.message.custom as { writingTask?: string })
      ?.writingTask;
    const context = writingTask ? `Writing Task: ${writingTask}` : undefined;
    const instructions = this.getWritingAssistantPrompt(context);
    const attachments = (e.message.attachments as any[]) || [];
    const imageParts: any[] = [];
    let extractedPdfText = "";

    for (const att of attachments) {
      // Inline image data (legacy path)
      if (
        att?.type === "image" &&
        typeof att?.image_url === "string" &&
        att.image_url.startsWith("data:")
      ) {
        try {
          const match = att.image_url.match(/^data:(.*?);base64,(.*)$/);
          if (match) {
            const mimeType = match[1];
            const data = match[2];
            imageParts.push({ inlineData: { mimeType, data } });
          }
        } catch {}
      }

      // Uploaded images/files via Stream CDN
      if (
        att?.type === "image" &&
        typeof att?.image_url === "string" &&
        att.image_url.startsWith("http")
      ) {
        imageParts.push({
          fileData: {
            mimeType: att.mime_type || "image/*",
            fileUri: att.image_url,
          },
        });
      }

      // PDF or other docs: try to fetch and extract text
      const isPdf =
        att?.mime_type?.includes("pdf") || att?.title?.endsWith?.(".pdf");
      const url = att?.asset_url || att?.file || att?.image_url;
      if (isPdf && typeof url === "string" && url.startsWith("http")) {
        try {
          const resp = await axios.get<ArrayBuffer>(url, {
            responseType: "arraybuffer",
          });
          const buffer = Buffer.from(resp.data);
          const parsed = await pdf(buffer);
          const text = (parsed.text || "").trim();
          if (text.length > 0) {
            extractedPdfText += `\n\n[Extracted from PDF ${att?.title || ""}]\n${text}`;
          }
        } catch (err) {
          // Best effort: ignore fetch/parse errors and continue
        }
      }
    }

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
      // If the user only uploaded a PDF with no extractable text and no message, reply clearly
      const onlyPdfNoText =
        (!message || message.trim().length === 0) &&
        !imageParts.length &&
        extractedPdfText.trim().length === 0 &&
        attachments.some(
          (att) =>
            att?.mime_type?.includes("pdf") || att?.title?.endsWith?.(".pdf")
        );
      if (onlyPdfNoText) {
        await this.chatClient.updateMessage({
          id: channelMessage.id,
          text: "Cannot parse PDF as there is no text.",
          mentioned_users: [],
        });
        await this.channel.sendEvent({
          type: "ai_indicator.update",
          ai_state: "AI_STATE_DONE",
          cid: channelMessage.cid,
          message_id: channelMessage.id,
        });
        return;
      }

      // Build Gemini parts: prompt + user text + any images + extracted PDF text
      const parts: any[] = [];
      parts.push({ text: instructions });
      if (message) parts.push({ text: message });
      if (extractedPdfText) parts.push({ text: extractedPdfText });
      if (imageParts.length) parts.push(...imageParts);

      // Create AbortController
      const abortController = new AbortController();

      // Start streaming with cancellation support
      const result = await this.chatSession.sendMessageStream(parts, {
        signal: abortController.signal, // 👈 pass signal
      });

      // Pass abortController into the handler
      const handler = new GeminiResponseHandler(
        result.stream,
        this.chatClient,
        this.channel,
        channelMessage,
        () => this.removeHandler(handler),
        abortController // 👈 new argument
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
