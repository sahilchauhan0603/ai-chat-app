import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, Square, X, Paperclip, Sparkles, Loader2, FileText, Image, File, Trash2, Mic, MicOff } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WritingPromptsToolbar } from "./writing-prompts-toolbar";

export interface ChatInputProps {
  className?: string;
  sendMessage: (message: { text: string; files?: File[] }) => Promise<void> | void;
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
  value: string;
  onValueChange: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  showPromptToolbar?: boolean;
  onFileUpload?: (file: File) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'other';
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalTextareaRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  const getFileType = (file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: 'image' | 'document' | 'other') => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = fileArray.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
      e.target.value = ""; // Reset file input
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items || []);
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFileUpload(imageFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!value.trim() && uploadedFiles.length === 0) || isLoading || isGenerating || !sendMessage || isComposing) return;

    // Stop speech recognition if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // User is retrying; allow thinking dots again
    try { localStorage.removeItem("aiTypingSuppressed"); } catch {}
    setIsLoading(true);
    try {
      // Build Stream-compatible attachments for images as data URLs (so server can read)
      const imageFiles = uploadedFiles.filter(f => f.type === 'image');
      const otherFiles = uploadedFiles.filter(f => f.type !== 'image');

      const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageAttachments = await Promise.all(
        imageFiles.map(async ({ file }) => {
          const dataUrl = await toDataUrl(file);
          return {
            type: 'image',
            image_url: dataUrl,
            mime_type: file.type,
            fallback: file.name,
          } as any;
        })
      );

      // Send message; Stream's sendMessage will accept attachments, and
      // our server agent will read data URLs from attachments
      await (sendMessage as any)({
        text: value.trim(),
        attachments: imageAttachments.length ? imageAttachments : undefined,
        // keep original files for any custom handling upstream
        files: uploadedFiles.map(f => f.file),
      });
      onValueChange("");
      // Clear uploaded files
      uploadedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setUploadedFiles([]);
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

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const isSendDisabled = (!value.trim() && uploadedFiles.length === 0) || isLoading || isGenerating || isComposing;

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the input value with the transcribed text
      if (finalTranscript) {
        onValueChange(value + finalTranscript);
      }
      setTranscript(interimTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      // Stop recognition on unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Cleanup file previews on unmount
      uploadedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

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
        {/* File Upload Area */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-dashed border-muted">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 bg-background rounded-md border border-border/50 max-w-xs"
                >
                  {file.type === 'image' && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div 
            className={cn(
              "relative",
              isDragOver && "ring-2 ring-primary/50 ring-dashed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                uploadedFiles.length > 0 
                  ? "Ask a question about the uploaded files, or add more text..."
                  : placeholder
              }
              className={cn(
                "min-h-[52px] max-h-[150px] resize-none py-3 pl-4 pr-24 text-base",
                "border-input focus:border-primary/50 rounded-xl",
                "transition-all duration-200 bg-background shadow-sm",
                "focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                isDragOver && "border-primary/50 bg-primary/5"
              )}
              disabled={isLoading || isGenerating}
            />

            {/* Action buttons */}
            <div className="absolute right-6 bottom-2 flex items-center gap-1">
              {/* Clear button */}
              {(value.trim() || uploadedFiles.length > 0) && !isLoading && !isGenerating && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onValueChange("");
                    uploadedFiles.forEach(f => {
                      if (f.preview) URL.revokeObjectURL(f.preview);
                    });
                    setUploadedFiles([]);
                  }}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  title="Clear all"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* File upload button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                title="Upload files (PDF, images, documents)"
                disabled={isLoading || isGenerating}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                multiple
              />
              
              {/* Voice input button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                  } else if (recognitionRef.current) {
                    recognitionRef.current.start();
                  }
                }}
                className={cn(
                  "h-8 w-8 rounded-lg hover:bg-muted/80",
                  isListening 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isListening ? "Stop voice input" : "Start voice input"}
                disabled={isLoading || isGenerating || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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
                    title={
                      isSendDisabled 
                        ? (uploadedFiles.length > 0 ? "Type a question about the files" : "Type a message to send")
                        : "Send message"
                    }
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

        {/* Character count, file info, and voice status */}
        {(value.length > 0 || uploadedFiles.length > 0 || isListening) && (
          <div className="mt-2 flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              {value.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {value.length}/2000 characters
                </p>
              )}
              {uploadedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} attached
                </p>
              )}
              {isListening && (
                <p className="text-xs text-primary animate-pulse flex items-center gap-1">
                  <Mic className="h-3 w-3" /> Listening... {transcript && `"${transcript}"`}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Press ⏎ to send, Shift+⏎ for new line
            </p>
          </div>
        )}

        {/* Drag & Drop hint */}
        {uploadedFiles.length === 0 && (
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground/60">
              {/* 💡 Drag & drop files here or click the 📎 button to upload */}
              💡Upload Files (PDFs, Images, etc...)  &nbsp;&nbsp;&nbsp;&nbsp;  💡Give Voice Inputs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};