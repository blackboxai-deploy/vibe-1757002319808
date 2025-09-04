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
import { MCQQuestion, LaTeXProject, MCQAttempt } from '@/types';
import Link from 'next/link';

export default function MCQGeneratorPage() {
  const [step, setStep] = useState<'input' | 'generated' | 'exam' | 'results'>('input');
  const [latexContent, setLatexContent] = useState('');
   const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [projectTitle, setProjectTitle] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([]);
  const [reportedQuestions, setReportedQuestions] = useState<number[]>([]);
  const [results, setResults] = useState<any>(null);

  const handleGenerateQuestions = async () => {
    if (!latexContent.trim() || !projectTitle.trim()) {
      setError('Veuillez remplir le contenu LaTeX et le titre du projet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Générer les questions avec l'IA
      const generated = await aiService.generateMCQFromLatex(latexContent, language);
      
      // Sauvegarder le projet LaTeX
      const project: LaTeXProject = {
        id: '',
        title: projectTitle,
        content: latexContent,
        extractedCompetencies: generated.competencies || [],
        generatedQuestions: generated.questions || [],
        language,
        createdAt: new Date()
      };

      const projectId = await db.saveLatexProject(project);
      project.id = projectId;

      setGeneratedData(generated);
      setStep('generated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération des questions');
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = () => {
    if (!generatedData?.questions) return;
    
    // Randomiser les questions
    const shuffledQuestions = [...generatedData.questions]
      .sort(() => Math.random() - 0.5)
      .map((q: any) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));

    setQuestions(shuffledQuestions);
    setAnswers(new Array(shuffledQuestions.length).fill(-1));
    setCurrentQuestion(0);
    setExamStartTime(new Date());
    setSkippedQuestions([]);
    setReportedQuestions([]);
    setStep('exam');
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSkipQuestion = () => {
    const newSkipped = [...skippedQuestions];
    if (!newSkipped.includes(currentQuestion)) {
      newSkipped.push(currentQuestion);
      setSkippedQuestions(newSkipped);
    }
    handleNextQuestion();
  };

  const handleReportQuestion = () => {
    const newReported = [...reportedQuestions];
    if (!newReported.includes(currentQuestion)) {
      newReported.push(currentQuestion);
      setReportedQuestions(newReported);
    }
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

   const handleSubmitExam = async () => {
    if (!examStartTime) return;

    setIsLoading(true);

    try {
      // Calculer le score
      let correctAnswers = 0;
      questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = correctAnswers;
      const maxScore = questions.length;
      const timeSpent = Date.now() - examStartTime.getTime();

       // Créer l'attempt
      const attempt: MCQAttempt = {
        id: '',
        examId: 'temp',
        studentId: studentId || undefined,
        answers,
        score,
        maxScore,
        startedAt: examStartTime,
        completedAt: new Date(),
        timeSpent,
        skippedQuestions,
        reportedQuestions
      };

      const resultData = {
        attempt,
        questions,
        correctAnswers,
        percentage: Math.round((score / maxScore) * 100)
      };

      setResults(resultData);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
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

  const exportQuestions = () => {
    if (!generatedData?.questions) return;

    const jsonData = {
      title: projectTitle,
      language,
      competencies: generatedData.competencies,
      questions: generatedData.questions,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qcm-${projectTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            Générateur de QCM
          </h1>
          <p className="text-gray-600">
            Générez des QCM automatiquement à partir de contenu LaTeX
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Input */}
        {step === 'input' && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Contenu à Analyser</CardTitle>
              <CardDescription>
                Collez votre contenu LaTeX pour générer des questions QCM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom ou identifiant étudiant
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Votre nom ou identifiant"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du projet
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Ex: Introduction à l'algorithmique"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu LaTeX
                </label>
                <Textarea
                  value={latexContent}
                  onChange={(e) => setLatexContent(e.target.value)}
                  placeholder="Collez votre contenu LaTeX ici..."
                  className="min-h-64 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'IA analysera ce contenu pour identifier les compétences et générer des questions appropriées
                </p>
              </div>

              <Button 
                onClick={handleGenerateQuestions} 
                className="w-full" 
                disabled={isLoading || !latexContent.trim() || !projectTitle.trim()}
              >
                {isLoading ? 'Génération des questions...' : 'Générer les Questions QCM'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Generated Questions */}
        {step === 'generated' && generatedData && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Questions Générées</CardTitle>
                <CardDescription>
                  {generatedData.questions?.length || 0} questions créées automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {generatedData.questions?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedData.competencies?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Compétences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {language === 'fr' ? 'FR' : 'EN'}
                    </div>
                    <div className="text-sm text-gray-600">Langue</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={startExam} className="flex-1">
                    🎯 Passer l'Examen
                  </Button>
                  <Button onClick={exportQuestions} variant="outline">
                    📥 Exporter JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Competencies */}
            {generatedData.competencies && generatedData.competencies.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>Compétences Identifiées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {generatedData.competencies.map((comp: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions Preview */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Aperçu des Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedData.questions?.map((question: MCQQuestion, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          Question {index + 1}
                        </h4>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{question.text}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {question.options.map((option: string, optIndex: number) => (
                          <div 
                            key={optIndex} 
                            className={`p-2 rounded text-sm ${
                              optIndex === question.correctAnswer 
                                ? 'bg-green-50 border border-green-200 text-green-800' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {optIndex === question.correctAnswer && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Exam */}
        {step === 'exam' && questions.length > 0 && (
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
                  <div className="flex space-x-2">
                    <Badge className={getDifficultyColor(questions[currentQuestion].difficulty)}>
                      {questions[currentQuestion].difficulty}
                    </Badge>
                    {skippedQuestions.includes(currentQuestion) && (
                      <Badge variant="outline">Passée</Badge>
                    )}
                    {reportedQuestions.includes(currentQuestion) && (
                      <Badge variant="destructive">Signalée</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-base text-gray-700">
                  {questions[currentQuestion].text}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        answers[currentQuestion] === index
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="font-medium text-gray-500">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSkipQuestion}
                      variant="outline"
                      size="sm"
                    >
                      ⏭️ Passer
                    </Button>
                    <Button
                      onClick={handleReportQuestion}
                      variant="outline"
                      size="sm"
                      className={reportedQuestions.includes(currentQuestion) ? 'bg-red-50' : ''}
                    >
                      🚨 Signaler
                    </Button>
                  </div>

                  <div className="flex space-x-2">
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
                        onClick={handleSubmitExam}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Soumission...' : 'Terminer l\'Examen'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Navigation */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
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
                          : answers[index] !== -1
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : skippedQuestions.includes(index)
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-4">
                  <span>Répondues: {answers.filter(a => a !== -1).length}/{questions.length}</span>
                  <span>Passées: {skippedQuestions.length}</span>
                  <span>Signalées: {reportedQuestions.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && results && (
          <div className="space-y-6">
            {/* Score */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Résultats de l'Examen</CardTitle>
                <div className="text-6xl font-bold mt-4 mb-2">
                  <span className={results.percentage >= 80 ? 'text-green-600' : 
                                 results.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                    {results.percentage}%
                  </span>
                </div>
                <p className="text-xl text-gray-600">
                  {results.correctAnswers} / {questions.length} bonnes réponses
                </p>
                <p className="text-sm text-gray-500">
                  Temps: {Math.round(results.attempt.timeSpent / 60000)} minutes
                </p>
              </CardHeader>
            </Card>

            {/* Detailed Results */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Détail des Réponses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((question, index) => {
                    const isCorrect = answers[index] === question.correctAnswer;
                    const wasSkipped = skippedQuestions.includes(index);
                    const wasReported = reportedQuestions.includes(index);
                    
                    return (
                      <div key={index} className={`border rounded-lg p-4 ${
                        isCorrect ? 'border-green-200 bg-green-50' :
                        wasSkipped ? 'border-yellow-200 bg-yellow-50' :
                        'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <div className="flex space-x-2">
                            {isCorrect && <Badge className="bg-green-100 text-green-800">Correct</Badge>}
                            {!isCorrect && !wasSkipped && <Badge className="bg-red-100 text-red-800">Incorrect</Badge>}
                            {wasSkipped && <Badge className="bg-yellow-100 text-yellow-800">Passée</Badge>}
                            {wasReported && <Badge className="bg-orange-100 text-orange-800">Signalée</Badge>}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{question.text}</p>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded text-sm ${
                                optIndex === question.correctAnswer 
                                  ? 'bg-green-100 border border-green-300' 
                                  : optIndex === answers[index] && !isCorrect
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-gray-50'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {optIndex === question.correctAnswer && ' ✓ (Bonne réponse)'}
                              {optIndex === answers[index] && optIndex !== question.correctAnswer && ' ✗ (Votre réponse)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Nouveau QCM
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