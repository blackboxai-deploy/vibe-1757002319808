"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { aiService } from '@/lib/ai-service';
import { db } from '@/lib/database';
import { OpenQuestion, Evaluation } from '@/types';
import Link from 'next/link';

export default function OpenQuestionsPage() {
  const [step, setStep] = useState<'upload' | 'questions' | 'results'>('upload');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [studentId, setStudentId] = useState('');
  const [questions, setQuestions] = useState<OpenQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setError('Veuillez entrer du code à évaluer');
      return;
    }
    
    if (!studentId.trim()) {
      setError('Veuillez entrer votre nom ou identifiant étudiant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sauvegarder le code
      await db.saveStudentCode({
        id: '',
        content: code,
        language,
        filename: `code.${language}`,
        uploadedAt: new Date()
      });

      // Générer les questions
      const generatedQuestions = await aiService.generateOpenQuestions(code, language);
      
      const processedQuestions: OpenQuestion[] = generatedQuestions.map(q => ({
        ...q,
        type: 'open' as const,
        language: 'fr' as const
      }));

      setQuestions(processedQuestions);
      setAnswers(new Array(processedQuestions.length).fill(''));
      setStep('questions');

      // Sauvegarder les questions dans la base
      for (const question of processedQuestions) {
        await db.saveQuestion(question);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération des questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitAnswers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Évaluer les réponses avec l'IA
      const evaluationResult = await aiService.evaluateOpenAnswers(questions, answers, code);
      
      // Sauvegarder l'évaluation
      const evaluationData: Evaluation = {
        id: '',
        type: 'open-questions',
        studentId: studentId.trim(),
        questions: questions,
        responses: answers,
        score: evaluationResult.totalScore,
        maxScore: evaluationResult.maxTotalScore,
        startedAt: new Date(),
        completedAt: new Date(),
        feedback: evaluationResult.overallFeedback,
        suggestions: evaluationResult.evaluations.flatMap((e: any) => e.suggestions)
      };

      await db.saveEvaluation(evaluationData);
      setEvaluation(evaluationResult);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'évaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Évaluation par Questions Ouvertes
          </h1>
          <p className="text-gray-600">
            Uploadez votre code et répondez aux questions contextuelles générées par l'IA
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Upload Code */}
        {step === 'upload' && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Upload du Code à Évaluer</CardTitle>
              <CardDescription>
                Collez votre code et sélectionnez le langage pour commencer l'évaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langage de programmation
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code source
                </label>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Collez votre code ici..."
                  className="min-h-64 font-mono text-sm"
                />
              </div>

               <Button 
                onClick={handleCodeSubmit} 
                className="w-full" 
                disabled={isLoading || !code.trim() || !studentId.trim()}
              >
                {isLoading ? 'Génération des questions...' : 'Générer les Questions'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Answer Questions */}
        {step === 'questions' && questions.length > 0 && (
          <div className="space-y-6">
            {/* Progress */}
            <Card className="bg-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    Question {currentQuestion + 1} sur {questions.length}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}% complété
                  </span>
                </div>
                <Progress 
                  value={((currentQuestion + 1) / questions.length) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Question */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    Question {currentQuestion + 1}
                  </CardTitle>
                  <Badge className={getDifficultyColor(questions[currentQuestion].difficulty)}>
                    {questions[currentQuestion].difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-base text-gray-700">
                  {questions[currentQuestion].text}
                </CardDescription>
                {questions[currentQuestion].context && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Contexte:</p>
                    <p className="text-sm text-blue-700">{questions[currentQuestion].context}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answers[currentQuestion]}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Votre réponse détaillée..."
                  className="min-h-32"
                />

                <div className="flex justify-between mt-6">
                  <Button
                    onClick={handlePreviousQuestion}
                    variant="outline"
                    disabled={currentQuestion === 0}
                  >
                    ← Précédente
                  </Button>
                  
                  {currentQuestion < questions.length - 1 ? (
                    <Button onClick={handleNextQuestion}>
                      Suivante →
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitAnswers}
                      disabled={isLoading || answers.some(answer => !answer.trim())}
                    >
                      {isLoading ? 'Évaluation...' : 'Terminer l\'évaluation'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question Overview */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Vue d'ensemble</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        index === currentQuestion
                          ? 'bg-blue-600 text-white'
                          : answers[index]?.trim()
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {answers.filter(a => a.trim()).length} / {questions.length} questions répondues
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && evaluation && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Résultats de l'Évaluation</CardTitle>
                <div className="text-6xl font-bold mt-4 mb-2">
                  <span className={getScoreColor(evaluation.totalScore, evaluation.maxTotalScore)}>
                    {evaluation.totalScore}
                  </span>
                  <span className="text-gray-400">/{evaluation.maxTotalScore}</span>
                </div>
                <p className="text-xl text-gray-600">
                  {Math.round((evaluation.totalScore / evaluation.maxTotalScore) * 100)}% de réussite
                </p>
              </CardHeader>
            </Card>

            {/* Overall Feedback */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Feedback Général</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{evaluation.overallFeedback}</p>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Détail par Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {evaluation.evaluations.map((evalResult: any, index: number) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(questions[index]?.difficulty || 'medium')}>
                            {questions[index]?.difficulty || 'medium'}
                          </Badge>
                          <span className={`font-bold ${getScoreColor(evalResult.score, evalResult.maxScore)}`}>
                            {evalResult.score.toFixed(1)}/{evalResult.maxScore}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {questions[index]?.text}
                      </p>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700 font-medium mb-1">Votre réponse:</p>
                        <p className="text-sm text-gray-600">{answers[index]}</p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-blue-800 font-medium mb-1">Feedback:</p>
                        <p className="text-sm text-blue-700">{evalResult.feedback}</p>
                      </div>
                      
                      {evalResult.suggestions && evalResult.suggestions.length > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-800 font-medium mb-1">Suggestions:</p>
                          <ul className="text-sm text-green-700 list-disc list-inside">
                            {evalResult.suggestions.map((suggestion: string, i: number) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Nouvelle Évaluation
              </Button>
              <Link href="/">
                <Button>
                  Retour au Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}