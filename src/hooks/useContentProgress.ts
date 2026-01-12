import { useState, useEffect } from 'react';

export function useContentProgress(studentId: string, courseId: string) {
  const [completedContentIds, setCompletedContentIds] = useState<string[]>([]);

  useEffect(() => {
    const key = `content_progress_${studentId}_${courseId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setCompletedContentIds(JSON.parse(stored));
    }
  }, [studentId, courseId]);

  const markContentComplete = (contentId: string) => {
    const key = `content_progress_${studentId}_${courseId}`;
    const updated = [...new Set([...completedContentIds, contentId])];
    setCompletedContentIds(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const isContentComplete = (contentId: string) => {
    return completedContentIds.includes(contentId);
  };

  const resetProgress = () => {
    const key = `content_progress_${studentId}_${courseId}`;
    setCompletedContentIds([]);
    localStorage.removeItem(key);
  };

  return {
    completedContentIds,
    markContentComplete,
    isContentComplete,
    resetProgress
  };
}
