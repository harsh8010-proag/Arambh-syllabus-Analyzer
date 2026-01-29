
export interface Unit {
  unitName: string;
  veryImportant: string[];
  important: string[];
  optional: string[];
}

export interface Subject {
  subjectName: string;
  units: Unit[];
}

export interface StudyPlan {
  steps: string[];
  recommendedOrder: string[];
}

export interface AnalysisResult {
  subjects: Subject[];
  examFocusPoints: string[];
  suggestedStudyPlan: StudyPlan;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ViewType = 'home' | 'analyzer' | 'history' | 'about' | 'contact';

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
  previewUrl: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  date: string;
  time: string;
  name: string;
  result: AnalysisResult;
  isBookmarked: boolean;
}

export interface AppState {
  currentView: ViewType;
  isAnalyzing: boolean;
  error: string | null;
  result: AnalysisResult | null;
  selectedFile: FileData | null;
  textInput: string;
  history: HistoryItem[];
}
