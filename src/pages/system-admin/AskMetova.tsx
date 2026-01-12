import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from '@/components/student/ChatInput';
import { ChatMessage } from '@/components/student/ChatMessage';
import { ChatSidebar } from '@/components/student/ChatSidebar';
import { TypingIndicator } from '@/components/student/TypingIndicator';
import { AIDisabledBanner } from '@/components/ask-metova/AIDisabledBanner';
import { PromptUsageIndicator } from '@/components/ask-metova/PromptUsageIndicator';
import { useAskMetova } from '@/hooks/useAskMetova';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign,
  ClipboardCheck,
  Sparkles,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

export default function SystemAdminAskMetova() {
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
    handleClearHistory
  } = useAskMetova('system_admin');

  const isInputDisabled = isLoading || isAIDisabled || isLimitExceeded;

  const suggestedPrompts = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Staff Attendance",
      prompt: "Generate attendance report for all managers for this month"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Institution Performance",
      prompt: "Which institutions are performing well this year?"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Contract Renewals",
      prompt: "Show me all contracts expiring in the next 30 days"
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      title: "Revenue Report",
      prompt: "Generate monthly revenue report by institution"
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "CRM Tasks",
      prompt: "What CRM tasks are pending and on hold?"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Operational Insights",
      prompt: "Show me inventory status and projects behind schedule"
    }
  ];

  const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Ask Metova</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Your AI-powered business intelligence assistant
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate reports, analyze data, and get insights on attendance, revenue, 
            institution performance, CRM activities, and operational metrics - all in natural language.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center">Try asking me about:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestedPrompts.map((item, index) => (
              <Card
                key={index}
                className={`p-4 transition-colors ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}`}
                onClick={() => !isInputDisabled && sendMessage(item.prompt)}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.prompt}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What I Can Help You With
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Reports:</strong> Attendance, revenue, financial, operational reports</li>
            <li>• <strong>Analytics:</strong> Institution performance, engagement metrics, trends</li>
            <li>• <strong>CRM:</strong> Contract renewals, communication logs, pending tasks</li>
            <li>• <strong>Operations:</strong> Inventory status, project tracking, resource allocation</li>
            <li>• <strong>Insights:</strong> Data-driven recommendations and forecasts</li>
          </ul>
        </div>
      </div>
    </div>
  );

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
          <div className="border-b border-border p-4 flex items-center gap-4 bg-background">
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
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Ask Metova</h1>
              <p className="text-sm text-muted-foreground">AI Business Intelligence Assistant</p>
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

          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {currentMessages.length === 0 ? (
                <WelcomeMessage />
              ) : (
                <>
                  {currentMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <TypingIndicator />
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-background">
            <div className="max-w-4xl mx-auto">
              <ChatInput onSend={sendMessage} disabled={isInputDisabled} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {isAIDisabled 
                  ? 'AI Assistant is currently disabled by the administrator.'
                  : isLimitExceeded
                  ? 'You have reached your monthly prompt limit.'
                  : 'Ask Metova can generate reports and insights based on your data. Always verify important information.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
