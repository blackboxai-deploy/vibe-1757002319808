// Service d'intégration IA avec OpenRouter

import { AIConfig } from '@/types';

export class AIService {
  private config: AIConfig;

  constructor() {
    this.config = {
      endpoint: typeof window !== 'undefined' ? 
        (window as any).ENV?.NEXT_PUBLIC_AI_ENDPOINT || 'https://oi-server.onrender.com/chat/completions' :
        'https://oi-server.onrender.com/chat/completions',
      customerId: typeof window !== 'undefined' ? 
        (window as any).ENV?.NEXT_PUBLIC_AI_CUSTOMER_ID || 'cus_RuCkUD5gposwKc' :
        'cus_RuCkUD5gposwKc',
      model: typeof window !== 'undefined' ? 
        (window as any).ENV?.NEXT_PUBLIC_DEFAULT_LLM_MODEL || 'openrouter/anthropic/claude-sonnet-4' :
        'openrouter/anthropic/claude-sonnet-4',
      temperature: 0.5,
      maxTokens: 4000,
      timeout: 300000 // 5 minutes
    };
  }

  async makeRequest(messages: any[], model?: string, temperature?: number): Promise<any> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer xxx',
          'customerId': this.config.customerId
        },
        body: JSON.stringify({
          model: model || this.config.model,
          messages,
          temperature: temperature ?? this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Erreur lors de l'appel à l'IA: ${error}`);
    }
  }

  // Génération de questions ouvertes à partir de code
  async generateOpenQuestions(code: string, language: string = 'javascript'): Promise<any[]> {
    const systemPrompt = `Tu es un expert en évaluation de code. Analyse le code fourni et génère exactement 10 questions ouvertes pertinentes pour évaluer la compréhension de l'étudiant.

Critères:
- Questions variées (compréhension, logique, bonnes pratiques, améliorations)
- Niveaux de difficulté mélangés (easy, medium, hard)
- Questions contextuelles au code fourni
- Format JSON strict

Retourne uniquement un JSON avec cette structure:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question en français",
      "difficulty": "easy|medium|hard",
      "context": "Partie du code concernée",
      "category": "compréhension|logique|bonnes-pratiques|amélioration"
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Analyse ce code ${language} et génère 10 questions d'évaluation:\n\n\`\`\`${language}\n${code}\n\`\`\`` 
      }
    ];

    const response = await this.makeRequest(messages);
    return JSON.parse(response).questions;
  }

  // Évaluation des réponses aux questions ouvertes
  async evaluateOpenAnswers(questions: any[], answers: string[], code: string): Promise<any> {
    const systemPrompt = `Tu es un correcteur expert. Évalue les réponses de l'étudiant aux questions sur le code fourni.

Critères d'évaluation:
- Justesse technique (40%)
- Compréhension du contexte (30%)
- Clarté de l'explication (20%)
- Propositions d'amélioration (10%)

Retourne uniquement un JSON avec cette structure:
{
  "evaluations": [
    {
      "questionId": "q1",
      "score": 8.5,
      "maxScore": 10,
      "feedback": "Feedback détaillé",
      "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
  ],
  "totalScore": 85,
  "maxTotalScore": 100,
  "overallFeedback": "Feedback général"
}`;

    const questionAnswerPairs = questions.map((q, i) => ({
      question: q.text,
      answer: answers[i] || 'Pas de réponse',
      difficulty: q.difficulty,
      context: q.context
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Code original:\n\`\`\`\n${code}\n\`\`\`\n\nQuestions et réponses à évaluer:\n${JSON.stringify(questionAnswerPairs, null, 2)}` 
      }
    ];

    const response = await this.makeRequest(messages);
    return JSON.parse(response);
  }

  // Analyse et suggestions d'amélioration de code
  async analyzeCodeImprovement(code: string, projectSpecs?: string, language: string = 'javascript'): Promise<any> {
    const systemPrompt = `Tu es un expert en révision de code. Analyse le code fourni et propose des améliorations concrètes.

${projectSpecs ? 'Considère les spécifications du projet fournies.' : ''}

Critères d'analyse:
- Bonnes pratiques de programmation
- Performance et optimisation
- Lisibilité et maintenabilité
- Sécurité
- Architecture et design patterns

Retourne uniquement un JSON avec cette structure:
{
  "improvements": [
    {
      "category": "performance|sécurité|lisibilité|architecture",
      "priority": "low|medium|high",
      "description": "Description du problème",
      "suggestion": "Suggestion d'amélioration",
      "lineNumbers": [5, 12]
    }
  ],
  "externalQuestions": [
    {
      "question": "Question pour une personne externe",
      "purpose": "Objectif de cette question"
    }
  ],
  "overallScore": 75,
  "report": "Rapport global d'analyse"
}`;

    const userContent = `Code à analyser (${language}):\n\`\`\`${language}\n${code}\n\`\`\`${projectSpecs ? `\n\nSpécifications du projet:\n${projectSpecs}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    const response = await this.makeRequest(messages);
    return JSON.parse(response);
  }

  // Génération de questions QCM à partir de LaTeX
  async generateMCQFromLatex(latexContent: string, language: 'fr' | 'en' = 'fr'): Promise<any> {
    const systemPrompt = `Tu es un expert en création d'examens. Analyse le contenu LaTeX fourni et génère des questions QCM basées sur les compétences à acquérir.

Objectifs:
- Identifier les compétences clés du document
- Créer des questions QCM pertinentes
- Varier les niveaux de difficulté
- 4 options par question avec 1 seule bonne réponse

Langue de réponse: ${language}

Retourne uniquement un JSON avec cette structure:
{
  "competencies": ["Compétence 1", "Compétence 2"],
  "questions": [
    {
      "id": "mcq1",
      "text": "Question QCM",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "difficulty": "easy|medium|hard",
      "category": "Catégorie de la question",
      "competency": "Compétence évaluée"
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Contenu LaTeX à analyser:\n\n${latexContent}` 
      }
    ];

    const response = await this.makeRequest(messages);
    return JSON.parse(response);
  }

  // Génération d'image (pour les illustrations si nécessaire)
  async generateImage(prompt: string): Promise<string> {
    const messages = [
      { 
        role: 'user', 
        content: prompt 
      }
    ];

    const imageModel = typeof window !== 'undefined' ? 
      (window as any).ENV?.NEXT_PUBLIC_IMAGE_MODEL || 'replicate/black-forest-labs/flux-1.1-pro' :
      'replicate/black-forest-labs/flux-1.1-pro';
    const response = await this.makeRequest(messages, imageModel);
    return response; // URL de l'image générée
  }
}

export const aiService = new AIService();