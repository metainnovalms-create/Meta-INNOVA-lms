import { Layout } from "@/components/layout/Layout";
import { ChatMessage } from "@/components/student/ChatMessage";
import { ChatInput } from "@/components/student/ChatInput";
import { ChatSidebar } from "@/components/student/ChatSidebar";
import { TypingIndicator } from "@/components/student/TypingIndicator";
import { AIDisabledBanner } from "@/components/ask-metova/AIDisabledBanner";
import { PromptUsageIndicator } from "@/components/ask-metova/PromptUsageIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PanelLeftClose, PanelLeft, Users, TrendingUp, FolderKanban, AlertCircle, Award, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { useAskMetova } from "@/hooks/useAskMetova";

export default function OfficerAskMetova() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const {
    conversations,
    activeConversationId,
    currentMessages,
    isLoading,
    isAIDisabled,
    isLimitExceeded,
    promptUsage,
    scrollAreaRef,
    sendMessage,
    handleNewChat,
    handleSelectConversation,
    handleClearHistory,
    userName
  } = useAskMetova('officer');

  const isInputDisabled = isLoading || isAIDisabled || isLimitExceeded;

  const suggestedPrompts = [
    { icon: <TrendingUp className="h-5 w-5" />, text: "How is Class 6A performing this month?" },
    { icon: <AlertCircle className="h-5 w-5" />, text: "Show me students who need more attention" },
    { icon: <FolderKanban className="h-5 w-5" />, text: "Which students are working on innovation projects?" },
    { icon: <Users className="h-5 w-5" />, text: "Compare performance between my classes" },
    { icon: <Award className="h-5 w-5" />, text: "Who are my top performing students?" },
    { icon: <CalendarCheck className="h-5 w-5" />, text: "Which students have low attendance?" }
  ];

  function OfficerWelcomeMessage() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ask Metova
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI assistant for student performance insights and class management
            </p>
          </div>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            I can help you track student performance, identify those who need support, monitor innovation projects, 
            analyze class trends, and provide data-driven insights for better decision-making.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {suggestedPrompts.map((prompt, index) => (
              <Card
                key={index}
                className={`p-4 transition-colors group ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}`}
                onClick={() => !isInputDisabled && sendMessage(prompt.text)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-0.5">
                    {prompt.icon}
                  </div>
                  <p className="text-sm text-left group-hover:text-foreground transition-colors">
                    {prompt.text}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {!sidebarCollapsed && (
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onClearHistory={handleClearHistory}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-border p-4 flex items-center justify-between bg-background">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Ask Metova</h1>
                <p className="text-xs text-muted-foreground">AI Assistant for Innovation Officers</p>
              </div>
            </div>
          </div>

          {isAIDisabled && (
            <div className="px-6 pt-4">
              <AIDisabledBanner />
            </div>
          )}

          {promptUsage && (
            <PromptUsageIndicator 
              used={promptUsage.used} 
              limit={promptUsage.limit} 
              limitEnabled={promptUsage.limit_enabled} 
            />
          )}

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {currentMessages.length === 0 ? (
                <OfficerWelcomeMessage />
              ) : (
                <>
                  {currentMessages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      userName={userName}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-semibold text-sm">M</span>
                      </div>
                      <TypingIndicator />
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-background">
            <ChatInput onSend={sendMessage} disabled={isInputDisabled} />
            {(isAIDisabled || isLimitExceeded) && (
              <p className="text-xs text-destructive text-center mt-2">
                {isAIDisabled 
                  ? 'AI Assistant is currently disabled by the administrator.'
                  : 'You have reached your monthly prompt limit.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
