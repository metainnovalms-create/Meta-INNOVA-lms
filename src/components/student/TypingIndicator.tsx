export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-2xl rounded-bl-sm max-w-[80px]">
      <div className="flex gap-1">
        <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
