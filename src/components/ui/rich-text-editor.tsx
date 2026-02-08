import * as React from "react";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  command: string;
  value?: string;
  tooltip: string;
  onClick?: () => void;
}

function ToolbarButton({ icon, command, value, tooltip, onClick }: ToolbarButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      document.execCommand(command, false, value);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={handleClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Start typing...", className, minHeight = "150px" }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);

    const handleInput = useCallback(() => {
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }, [onChange]);

    // Initialize content on mount and when value changes externally
    React.useEffect(() => {
      if (editorRef.current && !isInternalChange.current) {
        if (editorRef.current.innerHTML !== value) {
          editorRef.current.innerHTML = value;
        }
      }
      isInternalChange.current = false;
    }, [value]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, text);
    }, []);

    return (
      <div className={cn("border border-input rounded-md bg-background", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-input bg-muted/30">
          <div className="flex items-center">
            <ToolbarButton icon={<Bold className="h-4 w-4" />} command="bold" tooltip="Bold (Ctrl+B)" />
            <ToolbarButton icon={<Italic className="h-4 w-4" />} command="italic" tooltip="Italic (Ctrl+I)" />
            <ToolbarButton icon={<Underline className="h-4 w-4" />} command="underline" tooltip="Underline (Ctrl+U)" />
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center">
            <ToolbarButton icon={<List className="h-4 w-4" />} command="insertUnorderedList" tooltip="Bullet List" />
            <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} command="insertOrderedList" tooltip="Numbered List" />
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center">
            <ToolbarButton icon={<AlignLeft className="h-4 w-4" />} command="justifyLeft" tooltip="Align Left" />
            <ToolbarButton icon={<AlignCenter className="h-4 w-4" />} command="justifyCenter" tooltip="Align Center" />
            <ToolbarButton icon={<AlignRight className="h-4 w-4" />} command="justifyRight" tooltip="Align Right" />
            <ToolbarButton icon={<AlignJustify className="h-4 w-4" />} command="justifyFull" tooltip="Justify" />
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center">
            <ToolbarButton icon={<Undo className="h-4 w-4" />} command="undo" tooltip="Undo (Ctrl+Z)" />
            <ToolbarButton icon={<Redo className="h-4 w-4" />} command="redo" tooltip="Redo (Ctrl+Y)" />
          </div>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            "p-3 outline-none text-sm prose prose-sm max-w-none dark:prose-invert",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-b-md",
            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none"
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
