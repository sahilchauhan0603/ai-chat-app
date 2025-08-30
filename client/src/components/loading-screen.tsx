import { Bot, Loader2, Sparkles, MessageSquare, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingTips = [
    "Preparing your AI writing assistant...",
    "Loading language models...",
    "Setting up your writing environment...",
    "Almost ready to start creating...",
    "Initializing creative tools..."
  ];

  useEffect(() => {
    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 300);

    // Tip rotation
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 max-w-md mx-4">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></div>
              <Sparkles className="h-5 w-5 relative text-blue-500" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Loading message with animation */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-foreground font-medium">
              {loadingTips[currentTip]}
            </p>
          </div>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground">AI Chat</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground">Writing Tools</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-xs text-muted-foreground">Creativity</p>
          </div>
        </div>

        {/* Subtle decorative elements */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground/60">
            Your AI writing assistant will be ready shortly...
          </p>
        </div>
      </div>
    </div>
  );
};