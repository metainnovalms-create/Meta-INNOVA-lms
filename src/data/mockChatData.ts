export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context_used?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export const mockChatConversations: ChatConversation[] = [
  {
    id: 'chat-1',
    title: 'Course Progress Assistance',
    created_at: '2024-03-20T10:00:00Z',
    updated_at: '2024-03-20T10:15:00Z',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How am I doing in my courses?',
        timestamp: '2024-03-20T10:00:00Z'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Based on your current progress, you\'re doing well! Here\'s a summary:\n\n• **Data Science**: 65% complete - You\'re making steady progress\n• **Web Development**: 80% complete - Excellent work!\n• **Attendance**: 85% - Keep it up!\n\nYou have 2 pending assignments due this week. Would you like help prioritizing them?',
        timestamp: '2024-03-20T10:00:30Z',
        context_used: ['course_progress', 'attendance', 'assignments']
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Yes, please help me prioritize',
        timestamp: '2024-03-20T10:01:00Z'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Here\'s how I suggest prioritizing your assignments:\n\n1. **Data Science Assignment 3** - Due in 2 days (March 22)\n   - Focus: Statistical Analysis\n   - Estimated time: 3-4 hours\n   - Priority: HIGH\n\n2. **Web Development Project** - Due in 5 days (March 25)\n   - Focus: React Components\n   - Estimated time: 5-6 hours\n   - Priority: MEDIUM\n\nI recommend starting with Data Science tonight to avoid last-minute stress!',
        timestamp: '2024-03-20T10:01:15Z',
        context_used: ['assignments', 'deadlines']
      }
    ]
  },
  {
    id: 'chat-2',
    title: 'Assignment Help',
    created_at: '2024-03-19T14:30:00Z',
    updated_at: '2024-03-19T14:45:00Z',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'Can you explain the concept of recursion in programming?',
        timestamp: '2024-03-19T14:30:00Z'
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'Recursion is when a function calls itself to solve a problem by breaking it down into smaller instances of the same problem.\n\n**Key Components:**\n1. **Base Case**: The stopping condition\n2. **Recursive Case**: The function calling itself\n\n**Example in Python:**\n```python\ndef factorial(n):\n    if n == 0:  # Base case\n        return 1\n    return n * factorial(n-1)  # Recursive case\n```\n\nThis relates to your current Web Development course where you\'re learning about algorithms. Would you like more examples?',
        timestamp: '2024-03-19T14:30:45Z',
        context_used: ['current_courses']
      }
    ]
  },
  {
    id: 'chat-3',
    title: 'Career Guidance',
    created_at: '2024-03-18T09:00:00Z',
    updated_at: '2024-03-18T09:20:00Z',
    messages: [
      {
        id: 'msg-7',
        role: 'user',
        content: 'What career paths can I pursue with my current courses?',
        timestamp: '2024-03-18T09:00:00Z'
      },
      {
        id: 'msg-8',
        role: 'assistant',
        content: 'Based on your enrolled courses (Data Science, Web Development, AI & Machine Learning), here are excellent career paths:\n\n**Immediate Opportunities:**\n• Data Analyst\n• Frontend Developer\n• Full-Stack Developer\n\n**With More Experience:**\n• Data Scientist\n• Machine Learning Engineer\n• AI Researcher\n• Product Manager (Tech)\n\n**Your Strengths:**\nBased on your 85% average across technical courses, you have strong analytical and problem-solving skills. Your high engagement in project work suggests you\'d excel in hands-on development roles.\n\nWould you like specific recommendations for internships or certifications?',
        timestamp: '2024-03-18T09:00:30Z',
        context_used: ['enrolled_courses', 'grades', 'project_performance']
      }
    ]
  }
];
