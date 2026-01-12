import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Image as ImageIcon, Code, Upload, Loader2 } from 'lucide-react';
import { AssessmentQuestion, MCQOption } from '@/types/assessment';
import { supabase } from '@/integrations/supabase/client';

interface QuestionBuilderProps {
  question?: Partial<AssessmentQuestion>;
  questionNumber: number;
  onSave: (question: Partial<AssessmentQuestion>) => void;
  onCancel: () => void;
}

export const QuestionBuilder = ({ question, questionNumber, onSave, onCancel }: QuestionBuilderProps) => {
  const [questionText, setQuestionText] = useState(question?.question_text || '');
  const [options, setOptions] = useState<MCQOption[]>(
    question?.options || [
      { id: 'opt-a', option_label: 'A', option_text: '', order: 1 },
      { id: 'opt-b', option_label: 'B', option_text: '', order: 2 },
      { id: 'opt-c', option_label: 'C', option_text: '', order: 3 },
      { id: 'opt-d', option_label: 'D', option_text: '', order: 4 }
    ]
  );
  const [correctOptionId, setCorrectOptionId] = useState(question?.correct_option_id || '');
  const [points, setPoints] = useState(question?.points || 5);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [imageUrl, setImageUrl] = useState(question?.image_url || '');
  const [codeSnippet, setCodeSnippet] = useState(question?.code_snippet || '');
  const [showImageInput, setShowImageInput] = useState(!!question?.image_url);
  const [showCodeInput, setShowCodeInput] = useState(!!question?.code_snippet);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('assessment-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('assessment-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = text;
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }

    if (options.some(opt => !opt.option_text.trim())) {
      alert('All options must have text');
      return;
    }

    if (!correctOptionId) {
      alert('Please select the correct answer');
      return;
    }

    if (points <= 0) {
      alert('Points must be greater than 0');
      return;
    }

    const newQuestion: Partial<AssessmentQuestion> = {
      id: question?.id || `q-${Date.now()}`,
      question_number: questionNumber,
      question_text: questionText,
      question_type: 'mcq',
      options,
      correct_option_id: correctOptionId,
      points,
      explanation: explanation || undefined,
      image_url: imageUrl || undefined,
      code_snippet: codeSnippet || undefined,
      order: questionNumber,
      created_at: question?.created_at || new Date().toISOString()
    };

    onSave(newQuestion);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question {questionNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text *</Label>
          <Textarea
            id="question-text"
            placeholder="Enter your question here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Media Options */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {showImageInput ? 'Remove' : 'Add'} Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCodeInput(!showCodeInput)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showCodeInput ? 'Remove' : 'Add'} Code
          </Button>
        </div>

        {/* Image Upload */}
        {showImageInput && (
          <div className="space-y-2">
            <Label>Question Image</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                className="flex-1"
              />
              {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img src={imageUrl} alt="Preview" className="max-h-40 rounded-lg border" />
                <p className="text-xs text-muted-foreground mt-1 truncate">{imageUrl}</p>
              </div>
            )}
          </div>
        )}

        {/* Code Snippet */}
        {showCodeInput && (
          <div className="space-y-2">
            <Label htmlFor="code-snippet">Code Snippet</Label>
            <Textarea
              id="code-snippet"
              placeholder="Enter code snippet here..."
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* MCQ Options */}
        <div className="space-y-4">
          <Label>Answer Options *</Label>
          <RadioGroup value={correctOptionId} onValueChange={setCorrectOptionId}>
            {options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`option-${index}`} className="font-medium">
                    Option {option.option_label}
                  </Label>
                  <Input
                    id={`option-${index}`}
                    placeholder={`Enter option ${option.option_label}...`}
                    value={option.option_text}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </RadioGroup>
          <p className="text-sm text-muted-foreground">Select the correct answer by clicking the radio button</p>
        </div>

        {/* Scoring */}
        <div className="space-y-2">
          <Label htmlFor="points">Points *</Label>
          <Input
            id="points"
            type="number"
            min="1"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explanation (shown after submission)</Label>
          <Textarea
            id="explanation"
            placeholder="Explain why this is the correct answer..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {question?.id ? 'Update' : 'Add'} Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
