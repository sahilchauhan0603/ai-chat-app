import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LogOut,
  MessageCircle,
  MessageSquare,
  Moon,
  PlusCircle,
  Sun,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Channel, ChannelFilters, ChannelSort } from "stream-chat";
import { ChannelList, useChatContext } from "stream-chat-react";
import { useTheme } from "../hooks/use-theme";
import { useState, useEffect } from "react";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNewChat: () => void;
  onChannelDelete: (channel: Channel) => void;
}

const ChannelListEmptyStateIndicator = () => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-4">
      <div className="w-16 h-16 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent rounded-2xl flex items-center justify-center shadow-sm border border-primary/10">
        <MessageCircle className="h-8 w-8 text-primary/70" />
      </div>
    </div>
    <div className="space-y-2 max-w-xs">
      <h3 className="text-sm font-medium text-foreground">
        No writing sessions yet
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Start a new writing session to begin creating content with your AI
        assistant.
      </p>
    </div>
    <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground/60">
      <span>Click "New Writing Session" to get started</span>
    </div>
  </div>
);

export const ChatSidebar = ({
  isOpen,
  onClose,
  onLogout,
  onNewChat,
  onChannelDelete,
}: ChatSidebarProps) => {
  const { client, setActiveChannel } = useChatContext();
  const { user } = client;
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [channelToRename, setChannelToRename] = useState<Channel | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      // Auto-collapse sidebar on smaller screens
      if (!desktop) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const filters: ChannelFilters = {
    type: "messaging",
    members: { $in: [user.id] },
  };
  const sort: ChannelSort = { last_message_at: -1 };
  const options = { state: true, presence: true, limit: 10 };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleChannelClick = (channel: Channel) => {
    setActiveChannel(channel);
    navigate(`/chat/${channel.id}`);
    if (!isDesktop) onClose();
  };

  const handleRenameClick = (channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelToRename(channel);
    setNewChannelName(channel.data?.name || "New Writing Session");
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async () => {
    if (channelToRename && newChannelName.trim()) {
      try {
        setIsRenaming(true);
        // Update the channel with the new name without sending a message
        await channelToRename.update({ name: newChannelName.trim() });
        setIsRenaming(false);
        setShowRenameDialog(false);
        setChannelToRename(null);
      } catch (error) {
        console.error("Error renaming channel:", error);
        setIsRenaming(false);
      }
    }
  };

  const handleRenameCancel = () => {
    setShowRenameDialog(false);
    setChannelToRename(null);
    setNewChannelName("");
  };

  return (
    <>
      {/* Toggle button for collapsed state on desktop */}
      {isDesktop && isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-40 h-9 w-9 rounded-full bg-background border shadow-sm"
          onClick={toggleCollapse}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Backdrop for mobile */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* The Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 bg-background border-r flex flex-col transform transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-4 border-b flex justify-between items-center",
          isCollapsed && "flex-col space-y-2 p-3"
        )}>
          {!isCollapsed && <h2 className="text-lg font-semibold">Writing Sessions</h2>}
          <div className="flex items-center gap-2">
            {isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-7 w-7"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            {!isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Channel List */}
        {!isCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-0">
              <ChannelList
                filters={filters}
                sort={sort}
                options={options}
                EmptyStateIndicator={ChannelListEmptyStateIndicator}
                Preview={(previewProps) => (
                  <div
                    className={cn(
                      "flex items-center p-2 rounded-lg cursor-pointer transition-colors relative group mb-1",
                      previewProps.active
                        ? "bg-primary/20 text-primary-foreground"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleChannelClick(previewProps.channel)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm font-medium">
                      {previewProps.channel.data?.name || "New Writing Session"}
                    </span>
                    <div className="absolute right-1 flex opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 mr-1"
                        onClick={(e) => handleRenameClick(previewProps.channel, e)}
                        title="Rename writing session"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground/70 hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={async (e) => {
                          e.stopPropagation();
                          onChannelDelete(previewProps.channel);
                        }}
                        title="Delete writing session"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground/70 hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              />
            </div>
          </ScrollArea>
        )}

        {/* New Chat Button */}
        {!isCollapsed && (
          <div className="p-2 border-t">
            <Button onClick={onNewChat} className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Writing Session
            </Button>
          </div>
        )}

        {/* Collapsed New Chat Button */}
        {isCollapsed && (
          <div className="p-2 border-t flex justify-center">
            <Button
              onClick={onNewChat}
              size="icon"
              className="h-10 w-10"
              title="New Writing Session"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* User Profile / Logout */}
        <div className={cn(
          "p-2 border-t bg-background",
          isCollapsed && "flex justify-center"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start items-center p-2 h-auto",
                  isCollapsed && "w-10 h-10 p-0 rounded-full justify-center"
                )}
              >
                <Avatar className={cn("w-8 h-8", isCollapsed ? "mr-0" : "mr-2")}>
                  <AvatarImage src={user?.image} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align={isCollapsed ? "start" : "end"}>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>
                  Switch to {theme === "dark" ? "Light" : "Dark"} Theme
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Rename Chat Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Writing Session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="channel-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="channel-name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Enter a name for this writing session"
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenaming) {
                  handleRenameConfirm();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleRenameCancel} disabled={isRenaming}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!newChannelName.trim() || isRenaming}>
              {isRenaming ? (
                <>
                  <span className="mr-2">Renaming</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};