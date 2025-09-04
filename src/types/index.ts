// Types principaux pour la plateforme d'IA éducative

export interface StudentCode {
  id: string;
  content: string;
  language: string;
  filename: string;
  uploadedAt: Date;
  projectSpecs?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'open' | 'mcq';
  difficulty: 'easy' | 'medium' | 'hard';
  context: string;
  answer?: string;
  options?: string[];
  correctAnswer?: number;
  category: string;
  language: 'fr' | 'en';
}

export interface OpenQuestion extends Question {
  type: 'open';
  studentAnswer?: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
}

export interface MCQQuestion extends Question {
  type: 'mcq';
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

export interface Evaluation {
  id: string;
  type: 'open-questions' | 'code-improvement' | 'mcq';
  studentId?: string;
  codeId?: string;
  questions: Question[];
  responses: (string | number)[];
  score: number;
  maxScore: number;
  startedAt: Date;
  completedAt?: Date;
  feedback: string;
  suggestions: string[];
}

export interface CodeImprovement {
  id: string;
  codeId: string;
  improvements: {
    category: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
    lineNumbers?: number[];
  }[];
  externalQuestions: {
    question: string;
    purpose: string;
  }[];
  overallScore: number;
  report: string;
}

export interface LaTeXProject {
  id: string;
  title: string;
  content: string;
  extractedCompetencies: string[];
  generatedQuestions: MCQQuestion[];
  language: 'fr' | 'en';
  createdAt: Date;
}

export interface MCQExam {
  id: string;
  projectId: string;
  title: string;
  questions: MCQQuestion[];
  duration?: number;
  randomized: boolean;
  createdAt: Date;
  attempts: MCQAttempt[];
}

export interface MCQAttempt {
  id: string;
  examId: string;
  studentId?: string;
  answers: number[];
  score: number;
  maxScore: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  skippedQuestions: number[];
  reportedQuestions: number[];
}

export interface AIConfig {
  endpoint: string;
  customerId: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  timeout: number;
}

export interface SystemPrompt {
  id: string;
  name: string;
  purpose: string;
  prompt: string;
  variables: string[];
  isCustomizable: boolean;
}

export interface Analytics {
  totalEvaluations: number;
  averageScore: number;
  moduleUsage: {
    openQuestions: number;
    codeImprovement: number;
    mcqGenerator: number;
  };
  languageDistribution: {
    fr: number;
    en: number;
  };
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  recentActivity: {
    date: Date;
    type: string;
    score?: number;
  }[];
}

export interface AppState {
  currentModule: string;
  isLoading: boolean;
  error: string | null;
  user: {
    id: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
  } | null;
}

// Types utilitaires
export type ModuleType = 'open-questions' | 'code-improvement' | 'mcq-generator';
export type Language = 'fr' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type FileUploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';