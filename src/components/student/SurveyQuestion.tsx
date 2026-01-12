import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Star } from "lucide-react";
import { SurveyQuestion as SurveyQuestionType } from "@/data/mockSurveyData";
import { useState } from "react";

interface SurveyQuestionProps {
  question: SurveyQuestionType;
  questionNumber: number;
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
}

export function SurveyQuestion({ question, questionNumber, value, onChange }: SurveyQuestionProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'mcq':
        return (
          <RadioGroup value={value as string} onValueChange={onChange}>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'multiple_select':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'rating':
        const rating = (value as number) || 0;
        return (
          <div className="flex gap-2">
            {Array.from({ length: question.scale_max || 5 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange(index + 1)}
                onMouseEnter={() => setHoverRating(index + 1)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    (hoverRating || rating) > index
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {rating} / {question.scale_max}
              </span>
            )}
          </div>
        );

      case 'linear_scale':
        const scaleValue = (value as number) || question.scale_min || 1;
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.scale_min}</span>
              <span>{question.scale_max}</span>
            </div>
            <Slider
              value={[scaleValue]}
              onValueChange={(values) => onChange(values[0])}
              min={question.scale_min || 1}
              max={question.scale_max || 10}
              step={1}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{scaleValue}</span>
              <span className="text-muted-foreground"> / {question.scale_max}</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer..."
          />
        );

      case 'long_text':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your detailed answer..."
            className="min-h-[120px]"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          {questionNumber}. {question.question_text}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {renderQuestionInput()}
    </div>
  );
}
