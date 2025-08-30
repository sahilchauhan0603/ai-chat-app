import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Check, Copy, ThumbsUp, ThumbsDown, Edit3, User, Send, Download, Eye, FileText, Image, File, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  useAIState,
  useChannelStateContext,
  useMessageContext,
  useMessageTextStreaming,
  useChannelActionContext,
} from "stream-chat-react";

// File attachment component
const FileAttachment: React.FC<{ attachment: any }> = ({ attachment }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const isImage = attachment.mime_type?.startsWith('image/');
  const isDocument = attachment.mime_type?.includes('pdf') || 
                    attachment.mime_type?.includes('document') || 
                    attachment.mime_type?.includes('text');
  
  const getFileIcon = () => {
    if (isImage) return <Image className="h-4 w-4" />;
    if (isDocument) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (attachment.asset_url) {
      const link = document.createElement('a');
      link.href = attachment.asset_url;
      link.download = attachment.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-muted/50">
      <div className="flex items-start gap-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {isImage && attachment.image_url ? (
            <img
              src={attachment.image_url}
              alt={attachment.title || 'Image'}
              className="h-12 w-12 object-cover rounded border"
            />
          ) : (
            <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {attachment.title || 'Untitled'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.file_size || 0)}
          </p>
          {attachment.mime_type && (
            <p className="text-xs text-muted-foreground/70">
              {attachment.mime_type}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isImage && attachment.image_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && isImage && attachment.image_url && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={attachment.image_url}
              alt={attachment.title || 'Image preview'}
              className="max-w-full max-h-full object-contain rounded"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage: React.FC = () => {
  const { message } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { sendMessage } = useChannelActionContext();
  const { aiState } = useAIState(channel);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const { streamedMessageText } = useMessageTextStreaming({
    text: message.text ?? "",
    renderingLetterCount: 10,
    streamingLetterIntervalMs: 30,
  });

  const isUser = !message.user?.id?.startsWith("ai-bot");
  const [copied, setCopied] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if message has been edited
  const isEdited = message.updated_at && 
    new Date(message.updated_at).getTime() > new Date(message.created_at || 0).getTime();

  // Check if message can be edited (within 24 hours and user is author)
  const canEdit = isUser && 
    message.user?.id && 
    new Date(message.created_at || 0).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  // Check if message has attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;

  // Auto-scroll to bottom when new message streams in
  useEffect(() => {
    if (streamedMessageText && !isUser && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [streamedMessageText, isUser]);

  // Reset edit value when message changes
  useEffect(() => {
    setEditValue(message.text || "");
  }, [message.text]);

  const copyToClipboard = async () => {
    if (streamedMessageText) {
      await navigator.clipboard.writeText(streamedMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyQueryToClipboard = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  // Handle resubmitting the edited query
  const handleResubmitQuery = async () => {
    if (!editValue.trim() || !channel) return;
    
    // Validate message length
    if (editValue.length > 1000) {
      alert("Message is too long. Please keep it under 1000 characters.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Send the edited message
      await sendMessage({
        text: editValue,
        parent_id: message.id, // Link to the original message
      });
      
      // Exit edit mode
      setIsEditing(false);
      setEditValue("");
      
      // Show success feedback (optional)
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to send edited message:", error);
      alert("Failed to send edited message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(message.text || ""); // Reset to original text
  };

  // Handle Enter key in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleResubmitQuery();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
                ? isEditing 
                  ? "bg-primary/90 text-primary-foreground rounded-br-md ring-2 ring-primary/50"
                  : "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted/50 border rounded-bl-md"
            )}
          >
            {/* Message Text or Edit Input */}
            <div className="break-words">
              {/* Edit indicator for edited messages */}
              {isUser && isEdited && !isEditing && (
                <div className="mb-2 text-xs text-muted-foreground/60 italic border-l-2 border-muted/30 pl-2 group relative">
                  <span className="cursor-help flex items-center gap-1">
                    <span>✏️</span>
                    <span>Message edited at {formatTime(message.updated_at || new Date())}</span>
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-muted/90 border rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <div className="font-medium mb-1">Original message:</div>
                    <div className="text-muted-foreground">
                      "{message.text?.substring(0, 50)}{message.text && message.text.length > 50 ? '...' : ''}"
                    </div>
                  </div>
                </div>
              )}
              
              {isUser && isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <textarea
                      className="w-full rounded border p-3 text-sm text-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      rows={Math.max(2, Math.min(editValue.split('\n').length + 1, 6))}
                      placeholder="Edit your message..."
                      autoFocus
                    />
                    <div className={cn(
                      "absolute bottom-2 right-2 text-xs transition-colors",
                      editValue.length > 900 ? "text-orange-500" : 
                      editValue.length > 1000 ? "text-red-500" : 
                      "text-muted-foreground"
                    )}>
                      {editValue.length}/1000
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleResubmitQuery}
                        disabled={!editValue.trim() || isSubmitting}
                        className="gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-black text-center">
                      💡 Press Enter to send, Shift+Enter for new line, Esc to cancel
                    </div>
                    {isSubmitting && (
                      <div className="text-xs text-primary/70 text-center animate-pulse">
                        📤 Sending edited message...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
                      <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 pl-4 my-3 italic border-primary/50 bg-primary/5 py-1 rounded-r">{children}</blockquote>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-semibold mb-3 mt-4 first:mt-0 border-b pb-1">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
                    ),
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
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
              )}

              {/* File Attachments */}
              {hasAttachments && !isEditing && (
                <div className="mt-3 space-y-2">
                  {message.attachments?.map((attachment, index) => (
                    <FileAttachment key={index} attachment={attachment} />
                  ))}
                </div>
              )}

              {/* Loading State */}
              {aiState && !streamedMessageText && !message.text && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs opacity-70">{getAiStateMessage()}</span>
                </div>
              )}

              {/* Invisible element for auto-scrolling */}
              <div ref={messageEndRef} />
            </div>
          </div>

          {/* Timestamp and Actions */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/70">
                {formatTime(message.created_at || new Date())}
              </span>
              {isEdited && (
                <span className="text-xs text-muted-foreground/50 italic">
                  (edited)
                </span>
              )}
            </div>

            {/* Message Actions */}
            <div className={cn(
              "flex items-center gap-1 transition-all duration-200",
              isHovered || !isUser ? "opacity-100" : "opacity-0"
            )}>
              {/* AI message actions (like, dislike, copy response) */}
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
                </>
              )}
              
              {/* User message actions (edit, copy query) */}
              {isUser && (!!message.text || hasAttachments) && (
                <>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-6 px-2 text-xs rounded-md gap-1 transition-colors text-muted-foreground hover:text-blue-600 hover:bg-muted"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-6 px-2 text-xs rounded-md gap-1 transition-colors text-muted-foreground/50 cursor-not-allowed"
                      title="Messages can only be edited within 24 hours"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyQueryToClipboard}
                    className={cn(
                      "h-6 px-2 text-xs rounded-md gap-1 transition-colors",
                      copiedQuery
                        ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {copiedQuery ? (
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