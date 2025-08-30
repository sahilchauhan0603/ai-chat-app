import type { Channel, MessageResponse, StreamChat } from "stream-chat";

export class GeminiResponseHandler {
  private message_text = "";
  private chunk_counter = 0;
  private is_done = false;
  private last_update_time = 0;

  constructor(
    private readonly responseStream: AsyncIterable<any>,
    private readonly chatClient: StreamChat,
    private readonly channel: Channel,
    private readonly message: MessageResponse,
    private readonly onDispose: () => void
  ) {
    this.chatClient.on("ai_indicator.stop", this.handleStopGenerating);
  }

  run = async () => {
    const { cid, id: message_id } = this.message;

    try {
      for await (const chunk of this.responseStream) {
        if (this.is_done) break;

        // ✅ Extract text properly from Gemini stream
        const text =
          chunk?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text)
            .join("") || "";

        if (!text) continue;

        this.message_text += text;
        this.chunk_counter++;

        // Periodic update (every 5 chunks or 500ms)
        const now = Date.now();
        if (this.chunk_counter % 5 === 0 || now - this.last_update_time > 500) {
          await this.updateMessage();
          this.last_update_time = now;
        }
      }

      // ✅ Final update
      if (!this.is_done) {
        await this.updateMessage();
        await this.channel.sendEvent({
          type: "ai_indicator.update",
          ai_state: "AI_STATE_DONE",
          cid,
          message_id,
        });
      }
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      await this.handleError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.dispose();
    }
  };

  private updateMessage = async () => {
    if (this.is_done) return;

    try {
      await this.chatClient.updateMessage({
        id: this.message.id,               // ✅ only ID required
        text: this.message_text,           // ✅ updated text
        mentioned_users: [],               // ✅ must be string[]
      });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  private handleError = async (error: Error) => {
    console.error("Gemini response error:", error);

    const { cid, id: message_id } = this.message;

    try {
      await this.chatClient.updateMessage({
        id: this.message.id,
        text: this.message_text || "I encountered an error while processing your request.",
        mentioned_users: [],
      });

      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
        cid,
        message_id,
        error: error.message,
      });

      // Ensure the UI state is cleared after an error
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_DONE",
        cid,
        message_id,
      });
    } catch (updateError) {
      console.error("Error handling error state:", updateError);
    }
  };

  private handleStopGenerating = async (e: any) => {
    if (e.message_id !== this.message.id) return;

    this.is_done = true;
    const { cid, id: message_id } = this.message;

    try {
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_STOPPED",
        cid,
        message_id,
      });
    } catch (error) {
      console.error("Error handling stop event:", error);
    }
  };

  public dispose = () => {
    this.chatClient.off("ai_indicator.stop", this.handleStopGenerating);
    this.onDispose();
  };
}