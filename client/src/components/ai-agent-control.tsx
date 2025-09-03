import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AgentStatus } from "@/hooks/use-ai-agent-status";
import { 
  AlertCircle, 
  Bot, 
  BotOff, 
  Loader2, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  Zap,
  Sparkles,
  Info
} from "lucide-react";
import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AIAgentControlProps {
  className?: string;
  status: AgentStatus;
  loading: boolean;
  error: string | null;
  toggleAgent: () => Promise<void>;
  checkStatus: () => Promise<void>;
  channelId?: string;
  lastActive?: Date | null;
  messageCount?: number;
}

const getStatusConfig = (status: AgentStatus, loading: boolean) => {
  if (loading) {
    return {
      variant: "secondary" as const,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      icon: Loader2,
      text: status === "connected" ? "Disconnecting..." : "Connecting...",
      description: status === "connected" 
        ? "AI assistant is disconnecting" 
        : "AI assistant is connecting",
    };
  }

  switch (status) {
    case "connected":
      return {
        variant: "default" as const,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-200 dark:border-green-800",
        icon: Bot,
        text: "AI Active",
        description: "AI assistant is connected and ready",
      };
    case "connecting":
      return {
        variant: "secondary" as const,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        borderColor: "border-amber-200 dark:border-amber-800",
        icon: Loader2,
        text: "Connecting...",
        description: "Connecting to AI assistant",
      };
    case "disconnected":
    default:
      return {
        variant: "outline" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        borderColor: "border-border",
        icon: BotOff,
        text: "AI Offline",
        description: "AI assistant is disconnected",
      };
  }
};

export const AIAgentControl: React.FC<AIAgentControlProps> = ({
  className = "",
  status,
  loading,
  error,
  toggleAgent,
  checkStatus,
  channelId,
  lastActive,
  messageCount = 0,
}) => {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = getStatusConfig(status, loading);
  const StatusIcon = statusConfig.icon;

  const handleToggle = async () => {
    try {
      if (status === "connected") {
        // For disconnect, show confirmation dialog
        setShowConfirmDialog(true);
      } else {
        // For connect, proceed immediately
        await toggleAgent();
        toast({
          title: "AI Connected",
          description: "AI assistant is now active and ready to help",
          duration: 3000,
        });
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: error || "Failed to connect to AI assistant",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const confirmDisconnect = async () => {
    try {
      await toggleAgent();
      setShowConfirmDialog(false);
      toast({
        title: "AI Disconnected",
        description: "AI assistant has been turned off",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: error || "Failed to disconnect AI agent",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await checkStatus();
      toast({
        title: "Status Updated",
        description: "AI agent status has been refreshed",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh AI agent status",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const formatLastActive = (date: Date | null) => {
    if (!date) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <>
      <div 
        className={`flex items-center gap-3 p-3 bg-background border rounded-lg ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Indicator with Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2",
          statusConfig.bgColor,
          statusConfig.borderColor
        )}>
          <StatusIcon
            className={`h-5 w-5 ${statusConfig.color} ${
              (loading || status === "connecting") ? "animate-spin" : ""
            }`}
          />
        </div>

        {/* Status Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {statusConfig.text}
            </span>
            {error && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{error}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {statusConfig.description}
          </p>
          
          {/* Additional stats when connected */}
          {status === "connected" && (lastActive || messageCount > 0) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {lastActive && (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Active {formatLastActive(lastActive)}
                </span>
              )}
              {messageCount > 0 && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {messageCount} messages
                </span>
              )}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={status === "connected" ? "outline" : "default"}
                  onClick={handleToggle}
                  disabled={loading || !channelId}
                  className={cn(
                    "h-9 px-3 gap-2 transition-all",
                    status === "connected" 
                      ? "border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  )}
                >
                  {status === "connected" ? (
                    <BotOff className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {status === "connected" ? "Disconnect" : "Connect"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status === "connected" ? "Disconnect AI assistant" : "Connect AI assistant"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={loading || !channelId}
                  className="h-9 w-9 p-0"
                >
                  <RotateCcw className={`h-4 w-4 ${isHovered ? "animate-spin-on-hover" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Confirmation Dialog for Disconnect */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BotOff className="h-5 w-5 text-destructive" />
              Disconnect AI Assistant?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect the AI assistant? 
              This will stop any ongoing conversations and the AI will no longer respond to messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnect}
              className="bg-destructive hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Styles for Animation */}
      {/* <style jsx>{`
        @keyframes spin-on-hover {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-on-hover {
          animation: spin-on-hover 1s linear infinite;
        }
      `}</style> */}
    </>
  );
};

// Helper function for conditional classes
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}