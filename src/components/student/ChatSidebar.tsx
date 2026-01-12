import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { ChatConversation } from "@/data/mockChatData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onClearHistory
}: ChatSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-background flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button onClick={onNewChat} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors hover:bg-accent",
                  activeConversationId === conversation.id && "bg-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate mb-1">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conversation.updated_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {conversations.length > 0 && (
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        </div>
      )}
    </div>
  );
}
