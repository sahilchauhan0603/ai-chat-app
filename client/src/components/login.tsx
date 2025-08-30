import { sha256 } from "js-sha256";
import { Bot, Eye, EyeOff, User as UserIcon, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { User } from "stream-chat";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface LoginProps {
  onLogin: (user: User) => void;
  isLoading?: boolean;
}

// Function to create a deterministic user ID from username using SHA-256
const createUserIdFromUsername = (username: string): string => {
  const hash = sha256(username.toLowerCase().trim());
  return `user_${hash.substring(0, 12)}`;
};

// Function to validate username
const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (!username.trim()) {
    return { valid: false, message: "Username is required" };
  }
  
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" };
  }
  
  if (username.length > 20) {
    return { valid: false, message: "Username must be less than 20 characters" };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, underscores and hyphens" };
  }
  
  return { valid: true };
};

export const Login: React.FC<LoginProps> = ({ onLogin, isLoading = false }) => {
  const [username, setUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load saved username if exists
  useEffect(() => {
    const savedUsername = localStorage.getItem("ai-chat-username");
    const savedRememberMe = localStorage.getItem("ai-chat-remember") === "true";
    
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
    
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.message || "Invalid username");
      return;
    }
    
    setError(null);
    
    if (rememberMe) {
      localStorage.setItem("ai-chat-username", username.trim());
      localStorage.setItem("ai-chat-remember", "true");
    } else {
      localStorage.removeItem("ai-chat-username");
      localStorage.removeItem("ai-chat-remember");
    }
    
    const user = {
      id: createUserIdFromUsername(username.trim().toLowerCase()),
      name: username.trim(),
    };
    
    onLogin(user);
  };

  const handleDemoLogin = () => {
    const demoUsername = `Guest_${Math.floor(Math.random() * 10000)}`;
    setUsername(demoUsername);
    
    // Small delay to show the username being set
    setTimeout(() => {
      const user = {
        id: createUserIdFromUsername(demoUsername.toLowerCase()),
        name: demoUsername,
      };
      onLogin(user);
    }, 300);
  };

  // Prevent flash of content while loading saved data
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-6 right-6 flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary">AI Assistant</span>
      </div>
      
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to AI Assistant
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Enter your username to start chatting with your AI assistant.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help">
                        What should I use?
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-48">Use 3-20 characters. Letters, numbers, <br />underscores and hyphens only.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter your username..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  className="h-11 pl-10 pr-10"
                  disabled={isLoading}
                  autoComplete="username"
                  aria-describedby="username-error"
                />
                {username && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setUsername("")}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription id="username-error" className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or try quickly
              </span>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={handleDemoLogin}
            variant="outline"
            className="w-full h-11"
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Try Demo Account
          </Button>
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!username.trim() || isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              'Start Chatting'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};