import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Upload, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface PositionConfig {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface CertificateTemplate {
  id?: string;
  name: string;
  description: string | null;
  category: string;
  template_image_url: string | null;
  default_width: number;
  default_height: number;
  name_position: PositionConfig;
  date_position?: PositionConfig | null;
  course_name_position?: PositionConfig | null;
  level_title_position?: PositionConfig | null;
  is_active: boolean;
}

interface CertificateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CertificateTemplate;
  onSave: (template: Partial<CertificateTemplate>) => void;
}

const NAME_POSITION_PRESETS = [
  { label: 'Center', x: 600, y: 450 },
  { label: 'Upper Center', x: 600, y: 350 },
  { label: 'Lower Center', x: 600, y: 550 },
  { label: 'Left Aligned', x: 300, y: 450 },
  { label: 'Right Aligned', x: 900, y: 450 },
];

const SIZE_PRESETS = [
  { label: 'Standard (1200×900)', width: 1200, height: 900 },
  { label: 'A4 Landscape (1123×794)', width: 1123, height: 794 },
  { label: 'Letter Landscape (1056×816)', width: 1056, height: 816 },
  { label: 'Wide (1400×800)', width: 1400, height: 800 },
  { label: 'Square (1000×1000)', width: 1000, height: 1000 },
];

const FONT_FAMILIES = [
  { value: 'serif', label: 'Serif (Classic)' },
  { value: 'sans-serif', label: 'Sans Serif (Modern)' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'cursive', label: 'Cursive (Script)' },
  { value: 'monospace', label: 'Monospace' },
];

export function CertificateTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave
}: CertificateTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('course');
  const [imageUrl, setImageUrl] = useState('');
  const [defaultWidth, setDefaultWidth] = useState(1200);
  const [defaultHeight, setDefaultHeight] = useState(900);
  const [nameX, setNameX] = useState(600);
  const [nameY, setNameY] = useState(450);
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#1e3a8a');
  const [fontFamily, setFontFamily] = useState('serif');
  const [isActive, setIsActive] = useState(true);
  const [sampleName, setSampleName] = useState('Student Name');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showDatePosition, setShowDatePosition] = useState(false);
  const [dateX, setDateX] = useState(600);
  const [dateY, setDateY] = useState(650);
  const [dateFontSize, setDateFontSize] = useState(24);
  // Course name position
  const [showCourseNamePosition, setShowCourseNamePosition] = useState(false);
  const [courseNameX, setCourseNameX] = useState(600);
  const [courseNameY, setCourseNameY] = useState(300);
  const [courseNameFontSize, setCourseNameFontSize] = useState(32);
  // Level title position
  const [showLevelTitlePosition, setShowLevelTitlePosition] = useState(false);
  const [levelTitleX, setLevelTitleX] = useState(600);
  const [levelTitleY, setLevelTitleY] = useState(350);
  const [levelTitleFontSize, setLevelTitleFontSize] = useState(28);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setImageUrl(template.template_image_url || '');
      setDefaultWidth(template.default_width || 1200);
      setDefaultHeight(template.default_height || 900);
      const namePos = template.name_position || { x: 600, y: 450, fontSize: 48, color: '#1e3a8a', fontFamily: 'serif' };
      setNameX(namePos.x);
      setNameY(namePos.y);
      setFontSize(namePos.fontSize);
      setFontColor(namePos.color);
      setFontFamily(namePos.fontFamily);
      setIsActive(template.is_active);
      if (template.date_position) {
        setShowDatePosition(true);
        setDateX(template.date_position.x);
        setDateY(template.date_position.y);
        setDateFontSize(template.date_position.fontSize);
      } else {
        setShowDatePosition(false);
      }
      if (template.course_name_position) {
        setShowCourseNamePosition(true);
        setCourseNameX(template.course_name_position.x);
        setCourseNameY(template.course_name_position.y);
        setCourseNameFontSize(template.course_name_position.fontSize);
      } else {
        setShowCourseNamePosition(false);
      }
      if (template.level_title_position) {
        setShowLevelTitlePosition(true);
        setLevelTitleX(template.level_title_position.x);
        setLevelTitleY(template.level_title_position.y);
        setLevelTitleFontSize(template.level_title_position.fontSize);
      } else {
        setShowLevelTitlePosition(false);
      }
    } else {
      // Reset form for new template
      setName('');
      setDescription('');
      setCategory('course');
      setImageUrl('');
      setDefaultWidth(1200);
      setDefaultHeight(900);
      setNameX(600);
      setNameY(450);
      setFontSize(48);
      setFontColor('#1e3a8a');
      setFontFamily('serif');
      setIsActive(true);
      setShowDatePosition(false);
      setShowCourseNamePosition(false);
      setShowLevelTitlePosition(false);
    }
  }, [template, open]);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      drawPreview();
    }
  }, [imageUrl, nameX, nameY, fontSize, fontColor, fontFamily, sampleName, defaultWidth, defaultHeight, showDatePosition, dateX, dateY, dateFontSize, showCourseNamePosition, courseNameX, courseNameY, courseNameFontSize, showLevelTitlePosition, levelTitleX, levelTitleY, levelTitleFontSize]);

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const previewWidth = 800;
      const aspectRatio = defaultHeight / defaultWidth;
      const previewHeight = previewWidth * aspectRatio;
      
      canvas.width = previewWidth;
      canvas.height = previewHeight;
      ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
      
      // Draw course name if enabled
      if (showCourseNamePosition) {
        const scaledCourseNameFontSize = (courseNameFontSize * previewWidth) / defaultWidth;
        ctx.font = `${scaledCourseNameFontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sample Course Name', (courseNameX * previewWidth) / defaultWidth, (courseNameY * previewHeight) / defaultHeight);
      }
      
      // Draw level title if enabled
      if (showLevelTitlePosition) {
        const scaledLevelTitleFontSize = (levelTitleFontSize * previewWidth) / defaultWidth;
        ctx.font = `${scaledLevelTitleFontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Level 1 - Module Title', (levelTitleX * previewWidth) / defaultWidth, (levelTitleY * previewHeight) / defaultHeight);
      }
      
      // Draw name
      const scaledFontSize = (fontSize * previewWidth) / defaultWidth;
      ctx.font = `${scaledFontSize}px ${fontFamily}`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sampleName, (nameX * previewWidth) / defaultWidth, (nameY * previewHeight) / defaultHeight);
      
      // Draw date if enabled
      if (showDatePosition) {
        const scaledDateFontSize = (dateFontSize * previewWidth) / defaultWidth;
        ctx.font = `${scaledDateFontSize}px ${fontFamily}`;
        ctx.fillText(new Date().toLocaleDateString(), (dateX * previewWidth) / defaultWidth, (dateY * previewHeight) / defaultHeight);
      }
    };
    img.src = imageUrl;
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    onSave({
      name,
      description,
      category,
      template_image_url: imageUrl || null,
      default_width: defaultWidth,
      default_height: defaultHeight,
      name_position: {
        x: nameX,
        y: nameY,
        fontSize,
        color: fontColor,
        fontFamily
      },
      date_position: showDatePosition ? {
        x: dateX,
        y: dateY,
        fontSize: dateFontSize,
        color: fontColor,
        fontFamily
      } : null,
      course_name_position: showCourseNamePosition ? {
        x: courseNameX,
        y: courseNameY,
        fontSize: courseNameFontSize,
        color: fontColor,
        fontFamily
      } : null,
      level_title_position: showLevelTitlePosition ? {
        x: levelTitleX,
        y: levelTitleY,
        fontSize: levelTitleFontSize,
        color: fontColor,
        fontFamily
      } : null,
      is_active: isActive
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = defaultWidth / canvas.width;
    const scaleY = defaultHeight / canvas.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    setNameX(x);
    setNameY(y);
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG or JPG images only.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB. Please upload a smaller image.');
      return false;
    }

    return true;
  };

  const handleFileUpload = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
      setFileName(file.name);
      toast.success('Template image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applySizePreset = (preset: typeof SIZE_PRESETS[0]) => {
    setDefaultWidth(preset.width);
    setDefaultHeight(preset.height);
    // Adjust position proportionally
    setNameX(Math.round(preset.width / 2));
    setNameY(Math.round(preset.height / 2));
  };

  const applyPositionPreset = (preset: typeof NAME_POSITION_PRESETS[0]) => {
    setNameX(preset.x);
    setNameY(preset.y);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit' : 'Create'} Certificate Template</DialogTitle>
          <DialogDescription>
            Upload a certificate template and configure the display settings
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Course Completion Certificate" />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course Completion</SelectItem>
                    <SelectItem value="level">Level Completion</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="event">Event Participation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this certificate template" />
            </div>

            {/* Size Configuration */}
            <div className="space-y-2">
              <Label>Certificate Size</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SIZE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={defaultWidth === preset.width && defaultHeight === preset.height ? "default" : "outline"}
                    size="sm"
                    onClick={() => applySizePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width (px)</Label>
                  <Input type="number" value={defaultWidth} onChange={(e) => setDefaultWidth(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input type="number" value={defaultHeight} onChange={(e) => setDefaultHeight(Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Template Image *</Label>
              {!imageUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG or JPG (max 5MB) • {defaultWidth}×{defaultHeight}px recommended
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border rounded-lg p-3 bg-accent/50">
                  <div className="flex items-center gap-3">
                    <FileImage className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileName || 'Template Image'}</p>
                      <p className="text-xs text-muted-foreground">Image uploaded</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Name Position & Font Settings */}
            {imageUrl && (
              <>
                <div className="space-y-2">
                  <Label>Name Position Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {NAME_POSITION_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={nameX === preset.x && nameY === preset.y ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyPositionPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sample Name</Label>
                    <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([val]) => setFontSize(val)}
                      min={24}
                      max={96}
                      step={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-14 h-10 p-1" />
                      <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Position: X={nameX}, Y={nameY} • Click on preview to reposition
                </div>

                {/* Course Name Position Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Course Name</Label>
                    <p className="text-xs text-muted-foreground">Configure course name display position</p>
                  </div>
                  <Switch checked={showCourseNamePosition} onCheckedChange={setShowCourseNamePosition} />
                </div>

                {showCourseNamePosition && (
                  <div className="grid grid-cols-3 gap-2 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Course X</Label>
                      <Input type="number" value={courseNameX} onChange={(e) => setCourseNameX(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Course Y</Label>
                      <Input type="number" value={courseNameY} onChange={(e) => setCourseNameY(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Course Font Size</Label>
                      <Input type="number" value={courseNameFontSize} onChange={(e) => setCourseNameFontSize(Number(e.target.value))} />
                    </div>
                  </div>
                )}

                {/* Level Title Position Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Level Title</Label>
                    <p className="text-xs text-muted-foreground">Configure level/module title position</p>
                  </div>
                  <Switch checked={showLevelTitlePosition} onCheckedChange={setShowLevelTitlePosition} />
                </div>

                {showLevelTitlePosition && (
                  <div className="grid grid-cols-3 gap-2 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Level X</Label>
                      <Input type="number" value={levelTitleX} onChange={(e) => setLevelTitleX(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Level Y</Label>
                      <Input type="number" value={levelTitleY} onChange={(e) => setLevelTitleY(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Level Font Size</Label>
                      <Input type="number" value={levelTitleFontSize} onChange={(e) => setLevelTitleFontSize(Number(e.target.value))} />
                    </div>
                  </div>
                )}

                {/* Date Position Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Date Position</Label>
                    <p className="text-xs text-muted-foreground">Configure date display position</p>
                  </div>
                  <Switch checked={showDatePosition} onCheckedChange={setShowDatePosition} />
                </div>

                {showDatePosition && (
                  <div className="grid grid-cols-3 gap-2 pl-4 border-l-2 border-primary/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Date X</Label>
                      <Input type="number" value={dateX} onChange={(e) => setDateX(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date Y</Label>
                      <Input type="number" value={dateY} onChange={(e) => setDateY(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date Font Size</Label>
                      <Input type="number" value={dateFontSize} onChange={(e) => setDateFontSize(Number(e.target.value))} />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>Active Template</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <Label>Preview {imageUrl && '(Click to set name position)'}</Label>
            {imageUrl ? (
              <canvas 
                ref={canvasRef} 
                onClick={handleCanvasClick}
                className="border rounded cursor-crosshair w-full"
              />
            ) : (
              <div className="border rounded h-80 flex items-center justify-center bg-muted text-muted-foreground">
                Upload an image to see preview
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
