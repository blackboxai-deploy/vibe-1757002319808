// Service de base de données JSON locale

import { 
  StudentCode, 
  Evaluation, 
  Question, 
  CodeImprovement, 
  LaTeXProject, 
  MCQExam, 
  Analytics 
} from '@/types';

export class DatabaseService {
   // Utilitaire pour lire un fichier JSON
  async readJSONFile<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const response = await fetch(`/api/data/${filename}`);
      if (!response.ok) {
        return defaultValue;
      }
      return await response.json();
    } catch (error) {
      console.warn(`Fichier ${filename} non trouvé, utilisation valeur par défaut`);
      return defaultValue;
    }
  }

   // Utilitaire pour écrire un fichier JSON
  async writeJSONFile<T>(filename: string, data: T): Promise<void> {
    try {
      await fetch(`/api/data/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      });
    } catch (error) {
      console.error(`Erreur lors de l'écriture du fichier ${filename}:`, error);
      throw error;
    }
  }

  // Gestion des codes étudiants
  async saveStudentCode(code: StudentCode): Promise<string> {
    const codes = await this.readJSONFile<StudentCode[]>('codes.json', []);
    const newCode = {
      ...code,
      id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    };
    
    codes.push(newCode);
    await this.writeJSONFile('codes.json', codes);
    return newCode.id;
  }

  async getStudentCode(id: string): Promise<StudentCode | null> {
    const codes = await this.readJSONFile<StudentCode[]>('codes.json', []);
    return codes.find(code => code.id === id) || null;
  }

  async getAllStudentCodes(): Promise<StudentCode[]> {
    return this.readJSONFile<StudentCode[]>('codes.json', []);
  }

  // Gestion des questions
  async saveQuestion(question: Question): Promise<string> {
    const questions = await this.readJSONFile<Question[]>('questions.json', []);
    const newQuestion = {
      ...question,
      id: question.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const existingIndex = questions.findIndex(q => q.id === newQuestion.id);
    if (existingIndex >= 0) {
      questions[existingIndex] = newQuestion;
    } else {
      questions.push(newQuestion);
    }
    
    await this.writeJSONFile('questions.json', questions);
    return newQuestion.id;
  }

  async getQuestion(id: string): Promise<Question | null> {
    const questions = await this.readJSONFile<Question[]>('questions.json', []);
    return questions.find(q => q.id === id) || null;
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    const questions = await this.readJSONFile<Question[]>('questions.json', []);
    return questions.filter(q => q.category === category);
  }

  async getAllQuestions(): Promise<Question[]> {
    return this.readJSONFile<Question[]>('questions.json', []);
  }

  // Gestion des évaluations
  async saveEvaluation(evaluation: Evaluation): Promise<string> {
    const evaluations = await this.readJSONFile<Evaluation[]>('evaluations.json', []);
    const newEvaluation = {
      ...evaluation,
      id: evaluation.id || `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: evaluation.startedAt || new Date()
    };
    
    const existingIndex = evaluations.findIndex(e => e.id === newEvaluation.id);
    if (existingIndex >= 0) {
      evaluations[existingIndex] = newEvaluation;
    } else {
      evaluations.push(newEvaluation);
    }
    
    await this.writeJSONFile('evaluations.json', evaluations);
    return newEvaluation.id;
  }

  async getEvaluation(id: string): Promise<Evaluation | null> {
    const evaluations = await this.readJSONFile<Evaluation[]>('evaluations.json', []);
    return evaluations.find(e => e.id === id) || null;
  }

  async getEvaluationsByType(type: string): Promise<Evaluation[]> {
    const evaluations = await this.readJSONFile<Evaluation[]>('evaluations.json', []);
    return evaluations.filter(e => e.type === type);
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return this.readJSONFile<Evaluation[]>('evaluations.json', []);
  }

  // Gestion des améliorations de code
  async saveCodeImprovement(improvement: CodeImprovement): Promise<string> {
    const improvements = await this.readJSONFile<CodeImprovement[]>('improvements.json', []);
    const newImprovement = {
      ...improvement,
      id: improvement.id || `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const existingIndex = improvements.findIndex(i => i.id === newImprovement.id);
    if (existingIndex >= 0) {
      improvements[existingIndex] = newImprovement;
    } else {
      improvements.push(newImprovement);
    }
    
    await this.writeJSONFile('improvements.json', improvements);
    return newImprovement.id;
  }

  async getCodeImprovement(id: string): Promise<CodeImprovement | null> {
    const improvements = await this.readJSONFile<CodeImprovement[]>('improvements.json', []);
    return improvements.find(i => i.id === id) || null;
  }

  async getCodeImprovementsByCode(codeId: string): Promise<CodeImprovement[]> {
    const improvements = await this.readJSONFile<CodeImprovement[]>('improvements.json', []);
    return improvements.filter(i => i.codeId === codeId);
  }

  // Gestion des projets LaTeX
  async saveLatexProject(project: LaTeXProject): Promise<string> {
    const projects = await this.readJSONFile<LaTeXProject[]>('latex-projects.json', []);
    const newProject = {
      ...project,
      id: project.id || `latex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: project.createdAt || new Date()
    };
    
    const existingIndex = projects.findIndex(p => p.id === newProject.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = newProject;
    } else {
      projects.push(newProject);
    }
    
    await this.writeJSONFile('latex-projects.json', projects);
    return newProject.id;
  }

  async getLatexProject(id: string): Promise<LaTeXProject | null> {
    const projects = await this.readJSONFile<LaTeXProject[]>('latex-projects.json', []);
    return projects.find(p => p.id === id) || null;
  }

  async getAllLatexProjects(): Promise<LaTeXProject[]> {
    return this.readJSONFile<LaTeXProject[]>('latex-projects.json', []);
  }

  // Gestion des examens QCM
  async saveMCQExam(exam: MCQExam): Promise<string> {
    const exams = await this.readJSONFile<MCQExam[]>('mcq-exams.json', []);
    const newExam = {
      ...exam,
      id: exam.id || `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: exam.createdAt || new Date()
    };
    
    const existingIndex = exams.findIndex(e => e.id === newExam.id);
    if (existingIndex >= 0) {
      exams[existingIndex] = newExam;
    } else {
      exams.push(newExam);
    }
    
    await this.writeJSONFile('mcq-exams.json', exams);
    return newExam.id;
  }

  async getMCQExam(id: string): Promise<MCQExam | null> {
    const exams = await this.readJSONFile<MCQExam[]>('mcq-exams.json', []);
    return exams.find(e => e.id === id) || null;
  }

  async getAllMCQExams(): Promise<MCQExam[]> {
    return this.readJSONFile<MCQExam[]>('mcq-exams.json', []);
  }

  // Analytics et statistiques
  async getAnalytics(): Promise<Analytics> {
    const evaluations = await this.getAllEvaluations();
    const questions = await this.getAllQuestions();
    
    const totalEvaluations = evaluations.length;
    const averageScore = evaluations.length > 0 
      ? evaluations.reduce((sum, evaluation) => sum + (evaluation.score / evaluation.maxScore) * 100, 0) / evaluations.length 
      : 0;

    const moduleUsage = {
      openQuestions: evaluations.filter(e => e.type === 'open-questions').length,
      codeImprovement: evaluations.filter(e => e.type === 'code-improvement').length,
      mcqGenerator: evaluations.filter(e => e.type === 'mcq').length
    };

    const languageDistribution = {
      fr: questions.filter(q => q.language === 'fr').length,
      en: questions.filter(q => q.language === 'en').length
    };

    const difficultyDistribution = {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };

    const recentActivity = evaluations
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 10)
      .map(evaluation => ({
        date: evaluation.startedAt,
        type: evaluation.type,
        score: (evaluation.score / evaluation.maxScore) * 100
      }));

    return {
      totalEvaluations,
      averageScore,
      moduleUsage,
      languageDistribution,
      difficultyDistribution,
      recentActivity
    };
  }

  // Utilitaires de nettoyage et maintenance
  async clearAllData(): Promise<void> {
    const files = [
      'codes.json',
      'questions.json', 
      'evaluations.json',
      'improvements.json',
      'latex-projects.json',
      'mcq-exams.json'
    ];

    for (const file of files) {
      await this.writeJSONFile(file, []);
    }
  }

  async exportData(): Promise<string> {
    const data = {
      codes: await this.getAllStudentCodes(),
      questions: await this.getAllQuestions(),
      evaluations: await this.getAllEvaluations(),
      improvements: await this.readJSONFile<CodeImprovement[]>('improvements.json', []),
      latexProjects: await this.getAllLatexProjects(),
      mcqExams: await this.getAllMCQExams(),
      analytics: await this.getAnalytics(),
      exportedAt: new Date()
    };

    return JSON.stringify(data, null, 2);
  }
}

export const db = new DatabaseService();