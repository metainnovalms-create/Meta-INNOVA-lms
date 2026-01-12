import { Sparkles, BookOpen, TrendingUp, Calendar, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WelcomeMessageProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
}

export function WelcomeMessage({ onSendMessage, disabled }: WelcomeMessageProps) {
  const suggestions = [
    { icon: BookOpen, text: "How am I doing in my courses?" },
    { icon: TrendingUp, text: "Show my progress summary" },
    { icon: Calendar, text: "What assignments are due soon?" },
    { icon: Award, text: "How can I improve my performance?" }
  ];

  const handleSuggestionClick = (text: string) => {
    if (!disabled && onSendMessage) {
      onSendMessage(text);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ask Metova</h1>
          <p className="text-muted-foreground">Your AI learning assistant</p>
        </div>
      </div>

      <p className="text-center text-muted-foreground mb-8 max-w-2xl">
        I'm here to help you with your courses, track your progress, answer questions, 
        and provide personalized guidance based on your learning journey.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        {suggestions.map((suggestion, index) => (
          <Card 
            key={index}
            className={`p-4 transition-colors flex items-center gap-3 group ${
              disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-accent cursor-pointer'
            }`}
            onClick={() => handleSuggestionClick(suggestion.text)}
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">{suggestion.text}</p>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Ask me anything about your courses, progress, or learning goals!</p>
      </div>
    </div>
  );
}
