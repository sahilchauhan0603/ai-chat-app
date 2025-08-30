import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, Square, X, Paperclip, Mic, Sparkles, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WritingPromptsToolbar } from "./writing-prompts-toolbar";

export interface ChatInputProps {
  className?: string;
  sendMessage: (message: { text: string }) => Promise<void> | void;
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
  value: string;
  onValueChange: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  showPromptToolbar?: boolean;
  onFileUpload?: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  className,
  sendMessage,
  isGenerating,
  onStopGenerating,
  placeholder = "Ask me to write something, or paste text to improve...",
  value,
  onValueChange,
  textareaRef: externalTextareaRef,
  showPromptToolbar = false,
  onFileUpload,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalTextareaRef;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePromptSelect = (prompt: string) => {
    onValueChange(value ? `${value.trim()} ${prompt}` : prompt);
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  const updateTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 150; // ~7 lines
      const textareaHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${textareaHeight}px`;
    }
  }, [textareaRef]);

  // Auto-resize textarea
  useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || isGenerating || !sendMessage || isComposing) return;

    setIsLoading(true);
    try {
      await sendMessage({
        text: value.trim(),
      });
      onValueChange("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
      e.target.value = ""; // Reset file input
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const isSendDisabled = !value.trim() || isLoading || isGenerating || isComposing;

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-t border-border/50",
        isFocused && "ring-1 ring-primary/20"
      )}
    >
      {showPromptToolbar && (
        <WritingPromptsToolbar onPromptSelect={handlePromptSelect} />
      )}
      
      <div className={cn("p-4", className)}>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={cn(
                "min-h-[52px] max-h-[150px] resize-none py-3 pl-4 pr-24 text-base",
                "border-input focus:border-primary/50 rounded-xl",
                "transition-all duration-200 bg-background shadow-sm",
                "focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
              )}
              disabled={isLoading || isGenerating}
            />

            {/* Action buttons */}
            <div className="absolute right-6 bottom-2 flex items-center gap-1">
              {/* Clear button */}
              {value.trim() && !isLoading && !isGenerating && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onValueChange("")}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  title="Clear text"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* File upload button */}
              {onFileUpload && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 opacity-50"
                    title="Upload file"
                    disabled={isLoading || isGenerating}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx,.md"
                  />
                </>
              )}

              {/* Voice input button (placeholder) */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 opacity-50" // Disabled for now
                title="Voice input (coming soon)"
                disabled
              >
                <Mic className="h-4 w-4" />
              </Button>

              {/* Send/Stop Button */}
              <div className="relative">
                {isGenerating ? (
                  <Button
                    type="button"
                    onClick={onStopGenerating}
                    className="h-9 w-9 rounded-lg flex-shrink-0 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md"
                    title="Stop generating"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSendDisabled}
                    className={cn(
                      "h-9 w-9 rounded-lg flex-shrink-0 p-0 transition-all duration-200 shadow-md",
                      isSendDisabled
                        ? "bg-muted text-muted-foreground hover:bg-muted"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    )}
                    title={isSendDisabled ? "Type a message to send" : "Send message"}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {/* AI indicator */}
                {!isGenerating && !isLoading && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm border border-background">
                      <Sparkles className="h-2 w-2 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Character count */}
        {value.length > 0 && (
          <div className="mt-2 flex justify-between items-center px-1">
            <p className="text-xs text-muted-foreground">
              {value.length}/2000 characters
            </p>
            <p className="text-xs text-muted-foreground">
              Press ⏎ to send, Shift+⏎ for new line
            </p>
          </div>
        )}
      </div>
    </div>
  );
};