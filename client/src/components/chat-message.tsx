import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Check, Copy, ThumbsUp, ThumbsDown, Edit3, MoreHorizontal, User } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  useAIState,
  useChannelStateContext,
  useMessageContext,
  useMessageTextStreaming,
} from "stream-chat-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChatMessage: React.FC = () => {
  const { message } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { aiState } = useAIState(channel);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const { streamedMessageText } = useMessageTextStreaming({
    text: message.text ?? "",
    renderingLetterCount: 10,
    streamingLetterIntervalMs: 30,
  });

  const isUser = !message.user?.id?.startsWith("ai-bot");
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll to bottom when new message streams in
  useEffect(() => {
    if (streamedMessageText && !isUser && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [streamedMessageText, isUser]);

  const copyToClipboard = async () => {
    if (streamedMessageText) {
      await navigator.clipboard.writeText(streamedMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAiStateMessage = () => {
    switch (aiState) {
      case "AI_STATE_THINKING":
        return "Thinking...";
      case "AI_STATE_GENERATING":
        return "Writing response...";
      case "AI_STATE_EXTERNAL_SOURCES":
        return "Researching...";
      case "AI_STATE_ERROR":
        return "An error occurred. Please try again.";
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleReaction = (type: 'like' | 'dislike') => {
    setReaction(current => current === type ? null : type);
  };

  return (
    <div
      className={cn(
        "flex w-full mb-6 px-4 group transition-all duration-200",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] transition-all duration-200",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 self-end transition-all duration-200",
          isUser ? "ml-3" : "mr-3"
        )}>
          <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
            <AvatarFallback className={cn(
              "text-xs font-medium",
              isUser 
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-primary-foreground" 
                : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
            )}>
              {isUser ? (
                message.user?.name?.charAt(0) || <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-1.5 flex-1">
          {/* Username */}
          {!isUser && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-medium text-foreground/80">
                {message.user?.name || "AI Assistant"}
              </span>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 shadow-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted/50 border rounded-bl-md"
            )}
          >
            {/* Message Text */}
            <div className="break-words">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  code: ({ children, ...props }) => {
                    const { node, ...rest } = props;
                    const isInline = !rest.className?.includes("language-");

                    return isInline ? (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/10 dark:bg-white/10"
                        {...rest}
                      >
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-3">
                        <pre className="p-3 rounded-md overflow-x-auto text-xs font-mono bg-black/5 dark:bg-white/5 border">
                          <code {...rest}>{children}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc ml-4 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal ml-4 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 pl-4 my-3 italic border-primary/50 bg-primary/5 py-1 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-semibold mb-3 mt-4 first:mt-0 border-b pb-1">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0">
                      {children}
                    </h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {streamedMessageText || message.text || ""}
              </ReactMarkdown>
            </div>

            {/* Loading State */}
            {aiState && !streamedMessageText && !message.text && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs opacity-70">
                  {getAiStateMessage()}
                </span>
              </div>
            )}

            {/* Invisible element for auto-scrolling */}
            <div ref={messageEndRef} />
          </div>

          {/* Timestamp and Actions */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground/70">
              {formatTime(message.created_at || new Date())}
            </span>

            {/* Message Actions */}
            <div className={cn(
              "flex items-center gap-1 transition-all duration-200",
              isHovered || !isUser ? "opacity-100" : "opacity-0"
            )}>
              {!isUser && !!streamedMessageText && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction('like')}
                    className={cn(
                      "h-6 w-6 p-0 rounded-md transition-colors",
                      reaction === 'like' 
                        ? "text-green-600 bg-green-100 dark:bg-green-900/30" 
                        : "text-muted-foreground hover:text-green-600 hover:bg-muted"
                    )}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction('dislike')}
                    className={cn(
                      "h-6 w-6 p-0 rounded-md transition-colors",
                      reaction === 'dislike' 
                        ? "text-red-600 bg-red-100 dark:bg-red-900/30" 
                        : "text-muted-foreground hover:text-red-600 hover:bg-muted"
                    )}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className={cn(
                      "h-6 px-2 text-xs rounded-md gap-1 transition-colors",
                      copied 
                        ? "text-green-600 bg-green-100 dark:bg-green-900/30" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy text
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit response
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Good response
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Needs improvement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;