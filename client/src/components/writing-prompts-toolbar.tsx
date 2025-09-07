import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  List,
  Minimize2,
  Palette,
  PenLine,
  Search,
  Smile,
  SpellCheck,
  Type,
  X,
  Lightbulb,
  Wand2,
  Sparkles,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WritingPromptsToolbarProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
  disabled?: boolean;   // NEW
}

const toolbarPrompts = [
  {
    icon: SpellCheck,
    text: "Fix grammar & spelling",
    category: "Editing",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Minimize2,
    text: "Make this more concise",
    category: "Refinement",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Briefcase,
    text: "Write this more professionally",
    category: "Tone",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Smile,
    text: "Make it sound more human",
    category: "Style",
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    icon: List,
    text: "Summarize the key points",
    category: "Summary",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    icon: PenLine,
    text: "Continue writing from here",
    category: "Generation",
    color: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    icon: Type,
    text: "Suggest a title for this",
    category: "Ideas",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: Palette,
    text: "Change the tone to be more...",
    category: "Tone",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    icon: Lightbulb,
    text: "Generate creative ideas",
    category: "Ideas",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    icon: Wand2,
    text: "Improve this paragraph",
    category: "Editing",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    icon: Sparkles,
    text: "Make this more engaging",
    category: "Style",
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
];

export const WritingPromptsToolbar: React.FC<WritingPromptsToolbarProps> = ({
  onPromptSelect,
  className = "",
  disabled = false,  // NEW
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(toolbarPrompts.map(prompt => prompt.category))
    );
    return uniqueCategories;
  }, []);

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    return toolbarPrompts.filter(prompt => {
      const matchesSearch = prompt.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? prompt.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Reset filters when menu is closed
  useEffect(() => {
    if (!isExpanded) {
      setSearchQuery("");
      setSelectedCategory(null);
    }
  }, [isExpanded]);

  const handlePromptSelect = (text: string) => {
    onPromptSelect(text);
    setIsExpanded(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Expanded Menu */}
      {isExpanded && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />

          {/* Menu content */}
          <div className="absolute bottom-full left-0 right-0 mb-2 z-20 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-background border rounded-lg shadow-xl mx-4 max-h-96 overflow-hidden flex flex-col">
              {/* Search and filter header */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Category filters */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      !selectedCategory 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(
                        selectedCategory === category ? null : category
                      )}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompts list */}
              <ScrollArea className="h-80">
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredPrompts.length > 0 ? (
                    filteredPrompts.map((prompt, index) => {
                      const IconComponent = prompt.icon;
                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => !disabled && handlePromptSelect(prompt.text)}
                                disabled={disabled} 
                                className="h-auto p-3 text-sm text-left justify-start hover:bg-muted/50 transition-colors"
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0",
                                  prompt.bgColor
                                )}>
                                  <IconComponent className={cn("h-4 w-4", prompt.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground">
                                    {prompt.text}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {prompt.category}
                                  </div>
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{prompt.text}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No prompts found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </>
      )}

      {/* Toolbar - always visible */}
      <div className="bg-background border-t">
        <div className="flex items-center px-2 sm:px-4 py-2 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isExpanded ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => !disabled  && setIsExpanded(!isExpanded)}
                  disabled={disabled}
                  className="h-8 px-2 sm:px-3 text-xs font-medium flex-shrink-0 gap-1.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  <Sparkles className="h-3.5 w-3.5" />
                  Prompts
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isExpanded ? "Hide prompts" : "Show prompts"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1 max-w-full overflow-x-auto">
            <div className="flex gap-1 pb-1 min-w-max">
              {toolbarPrompts.slice(0, 4).map((prompt, index) => {
                const IconComponent = prompt.icon;
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => !disabled  && onPromptSelect(prompt.text)}
                          disabled={disabled}
                          className="h-8 px-2 sm:px-3 text-xs whitespace-nowrap flex-shrink-0 hover:bg-muted/50 gap-1.5"
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                          <span className="hidden xs:inline">{prompt.text}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{prompt.text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};