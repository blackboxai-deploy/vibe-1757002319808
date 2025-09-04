"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/database';
import { Evaluation, StudentCode, CodeImprovement, LaTeXProject, Analytics } from '@/types';
import StudentReportExport from '@/components/StudentReportExport';
import TeacherAuth from '@/components/TeacherAuth';
import Link from 'next/link';

interface StudentPerformance {
  studentId: string;
  evaluations: Evaluation[];
  averageScore: number;
  totalEvaluations: number;
  lastActivity: Date;
  strengths: string[];
  weaknesses: string[];
}

interface DetailedStats {
  byModule: {
    openQuestions: { count: number; avgScore: number; };
    codeImprovement: { count: number; avgScore: number; };
    mcq: { count: number; avgScore: number; };
  };
  byDifficulty: {
    easy: { count: number; avgScore: number; };
    medium: { count: number; avgScore: number; };
    hard: { count: number; avgScore: number; };
  };
  byLanguage: {
    fr: number;
    en: number;
  };
  timeDistribution: {
    date: string;
    count: number;
    avgScore: number;
  }[];
}

export default function TeacherDashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [, setStudentCodes] = useState<StudentCode[]>([]);
  const [, setCodeImprovements] = useState<CodeImprovement[]>([]);
  const [, setLatexProjects] = useState<LaTeXProject[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7days');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setIsLoading(true);
      
      // Charger toutes les données
      const [evalData, codesData, improvementsData, projectsData, analyticsData] = await Promise.all([
        db.getAllEvaluations(),
        db.getAllStudentCodes(),
        db.readJSONFile('improvements.json', []),
        db.getAllLatexProjects(),
        db.getAnalytics()
      ]);

      setEvaluations(evalData);
      setStudentCodes(codesData);
      setCodeImprovements(improvementsData);
      setLatexProjects(projectsData);
      setAnalytics(analyticsData);

      // Calculer les performances par étudiant
      calculateStudentPerformances(evalData);
      calculateDetailedStats(evalData);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStudentPerformances = (evalData: Evaluation[]) => {
    const studentMap = new Map<string, Evaluation[]>();
    
    evalData.forEach(evaluation => {
      if (evaluation.studentId) {
        if (!studentMap.has(evaluation.studentId)) {
          studentMap.set(evaluation.studentId, []);
        }
        studentMap.get(evaluation.studentId)!.push(evaluation);
      }
    });

    const performances: StudentPerformance[] = [];
    studentMap.forEach((studentEvals, studentId) => {
      const totalScore = studentEvals.reduce((sum, evaluation) => sum + (evaluation.score / evaluation.maxScore) * 100, 0);
      const averageScore = totalScore / studentEvals.length;
      const lastActivity = new Date(Math.max(...studentEvals.map(e => new Date(e.startedAt).getTime())));

      // Analyser les forces et faiblesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      const moduleScores = {
        'open-questions': studentEvals.filter(e => e.type === 'open-questions').map(e => (e.score / e.maxScore) * 100),
        'code-improvement': studentEvals.filter(e => e.type === 'code-improvement').map(e => (e.score / e.maxScore) * 100),
        'mcq': studentEvals.filter(e => e.type === 'mcq').map(e => (e.score / e.maxScore) * 100)
      };

      Object.entries(moduleScores).forEach(([module, scores]) => {
        if (scores.length > 0) {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          if (avgScore >= 80) {
            strengths.push(module);
          } else if (avgScore < 60) {
            weaknesses.push(module);
          }
        }
      });

      performances.push({
        studentId,
        evaluations: studentEvals,
        averageScore,
        totalEvaluations: studentEvals.length,
        lastActivity,
        strengths,
        weaknesses
      });
    });

    // Trier par score décroissant
    performances.sort((a, b) => b.averageScore - a.averageScore);
    setStudentPerformances(performances);
  };

  const calculateDetailedStats = (evalData: Evaluation[]) => {
    const stats: DetailedStats = {
      byModule: {
        openQuestions: { count: 0, avgScore: 0 },
        codeImprovement: { count: 0, avgScore: 0 },
        mcq: { count: 0, avgScore: 0 }
      },
      byDifficulty: {
        easy: { count: 0, avgScore: 0 },
        medium: { count: 0, avgScore: 0 },
        hard: { count: 0, avgScore: 0 }
      },
      byLanguage: { fr: 0, en: 0 },
      timeDistribution: []
    };

    // Stats par module
    const moduleGroups = {
      'open-questions': evalData.filter(e => e.type === 'open-questions'),
      'code-improvement': evalData.filter(e => e.type === 'code-improvement'),
      'mcq': evalData.filter(e => e.type === 'mcq')
    };

    Object.entries(moduleGroups).forEach(([key, evaluationsList]) => {
      const moduleKey = key === 'open-questions' ? 'openQuestions' : 
                       key === 'code-improvement' ? 'codeImprovement' : 'mcq';
      
      stats.byModule[moduleKey as keyof typeof stats.byModule] = {
        count: evaluationsList.length,
        avgScore: evaluationsList.length > 0 ? evaluationsList.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / evaluationsList.length : 0
      };
    });

    // Distribution temporelle (derniers 7 jours)
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    stats.timeDistribution = last7Days.map(date => {
      const dayEvaluations = evalData.filter(e => 
        new Date(e.startedAt).toISOString().split('T')[0] === date
      );
      
      return {
        date,
        count: dayEvaluations.length,
        avgScore: dayEvaluations.length > 0 ? 
          dayEvaluations.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / dayEvaluations.length : 0
      };
    });

    setDetailedStats(stats);
  };

  const filterEvaluations = () => {
    let filtered = evaluations;

     if (selectedModule !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.type === selectedModule);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      const periodStart = new Date();
      
      switch (selectedPeriod) {
        case '24h':
          periodStart.setHours(now.getHours() - 24);
          break;
        case '7days':
          periodStart.setDate(now.getDate() - 7);
          break;
        case '30days':
          periodStart.setDate(now.getDate() - 30);
          break;
      }
      
       filtered = filtered.filter(evaluation => new Date(evaluation.startedAt) >= periodStart);
    }

    return filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'open-questions': return '❓';
      case 'code-improvement': return '⚡';
      case 'mcq': return '📝';
      default: return '📋';
    }
  };

  const exportStudentData = () => {
    const exportData = {
      evaluations: evaluations,
      studentPerformances: studentPerformances,
      detailedStats: detailedStats,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Professeur'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-classe-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard professeur...</p>
        </div>
      </div>
    );
  }

   return (
    <TeacherAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← Retour au dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Professeur
              </h1>
              <p className="text-gray-600">
                Supervision et analyse des performances étudiantes
              </p>
            </div>
            <Button onClick={exportStudentData} variant="outline">
              📊 Exporter Données
            </Button>
          </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              <SelectItem value="open-questions">Questions Ouvertes</SelectItem>
              <SelectItem value="code-improvement">Amélioration Code</SelectItem>
              <SelectItem value="mcq">QCM</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toute la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute la période</SelectItem>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription>Total Étudiants</CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  {studentPerformances.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription>Évaluations Totales</CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600">
                  {analytics.totalEvaluations}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription>Score Moyen Classe</CardDescription>
                <CardTitle className={`text-3xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                  {analytics.averageScore.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardDescription>Étudiants Actifs (7j)</CardDescription>
                <CardTitle className="text-3xl font-bold text-purple-600">
                  {studentPerformances.filter(s => 
                    new Date(s.lastActivity).getTime() > Date.now() - 7*24*60*60*1000
                  ).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Étudiants</TabsTrigger>
            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="details">Détail Évaluation</TabsTrigger>
          </TabsList>

          {/* Tab: Students */}
          <TabsContent value="students">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Performances par Étudiant</CardTitle>
                <CardDescription>
                  Classement et analyse des performances individuelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentPerformances.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Aucune donnée étudiant disponible
                    </p>
                  ) : (
                    studentPerformances.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Étudiant {student.studentId.slice(-8)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {student.totalEvaluations} évaluations • 
                              Dernière activité: {new Date(student.lastActivity).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                           <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreColor(student.averageScore)}`}>
                              {student.averageScore.toFixed(1)}%
                            </div>
                            <div className="flex space-x-1 mb-2">
                              {student.strengths.map((strength, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700">
                                  {strength}
                                </Badge>
                              ))}
                              {student.weaknesses.map((weakness, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                                  {weakness}
                                </Badge>
                              ))}
                            </div>
                            <StudentReportExport 
                              studentId={student.studentId} 
                              evaluations={evaluations} 
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Evaluations */}
          <TabsContent value="evaluations">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Toutes les Évaluations</CardTitle>
                <CardDescription>
                  Historique chronologique des évaluations avec filtres
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filterEvaluations().length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Aucune évaluation trouvée avec les filtres actuels
                    </p>
                  ) : (
                    filterEvaluations().map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                           onClick={() => setSelectedEvaluation(evaluation)}>
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {getModuleIcon(evaluation.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {evaluation.type === 'open-questions' ? 'Questions Ouvertes' :
                               evaluation.type === 'code-improvement' ? 'Amélioration Code' : 'QCM'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {evaluation.studentId ? `Étudiant ${evaluation.studentId.slice(-8)}` : 'Étudiant anonyme'} • 
                              {new Date(evaluation.startedAt).toLocaleString('fr-FR')}
                              {evaluation.completedAt && (
                                <span> • Durée: {Math.round((new Date(evaluation.completedAt).getTime() - new Date(evaluation.startedAt).getTime()) / 60000)}min</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor((evaluation.score / evaluation.maxScore) * 100)}`}>
                            {evaluation.score}/{evaluation.maxScore}
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round((evaluation.score / evaluation.maxScore) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {detailedStats && (
                <>
                  <Card className="bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Performance par Module</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span>❓</span>
                            <span>Questions Ouvertes</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{detailedStats.byModule.openQuestions.count} évals</div>
                            <div className={`text-sm ${getScoreColor(detailedStats.byModule.openQuestions.avgScore)}`}>
                              {detailedStats.byModule.openQuestions.avgScore.toFixed(1)}% moy
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span>⚡</span>
                            <span>Amélioration Code</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{detailedStats.byModule.codeImprovement.count} évals</div>
                            <div className={`text-sm ${getScoreColor(detailedStats.byModule.codeImprovement.avgScore)}`}>
                              {detailedStats.byModule.codeImprovement.avgScore.toFixed(1)}% moy
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span>📝</span>
                            <span>QCM</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{detailedStats.byModule.mcq.count} évals</div>
                            <div className={`text-sm ${getScoreColor(detailedStats.byModule.mcq.avgScore)}`}>
                              {detailedStats.byModule.mcq.avgScore.toFixed(1)}% moy
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>Activité des 7 derniers jours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {detailedStats.timeDistribution.map((day, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded">
                            <span className="text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">
                                {day.count} évals
                              </span>
                              {day.count > 0 && (
                                <span className={`text-sm ${getScoreColor(day.avgScore)}`}>
                                  {day.avgScore.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab: Evaluation Details */}
          <TabsContent value="details">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Détail d'une Évaluation</CardTitle>
                <CardDescription>
                  {selectedEvaluation ? 
                    `Évaluation ${selectedEvaluation.type} - ${new Date(selectedEvaluation.startedAt).toLocaleString('fr-FR')}` :
                    'Cliquez sur une évaluation dans l\'onglet "Évaluations" pour voir les détails'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEvaluation ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">Score</h4>
                        <p className={`text-2xl font-bold ${getScoreColor((selectedEvaluation.score / selectedEvaluation.maxScore) * 100)}`}>
                          {selectedEvaluation.score}/{selectedEvaluation.maxScore}
                        </p>
                        <p className="text-sm text-blue-700">
                          {Math.round((selectedEvaluation.score / selectedEvaluation.maxScore) * 100)}% de réussite
                        </p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Durée</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedEvaluation.completedAt ? 
                            Math.round((new Date(selectedEvaluation.completedAt).getTime() - new Date(selectedEvaluation.startedAt).getTime()) / 60000) :
                            'En cours'
                          }
                        </p>
                        <p className="text-sm text-green-700">minutes</p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900">Questions</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedEvaluation.questions.length}
                        </p>
                        <p className="text-sm text-purple-700">total</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Feedback Global</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{selectedEvaluation.feedback}</p>
                      </div>
                    </div>

                    {selectedEvaluation.suggestions && selectedEvaluation.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Suggestions</h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            {selectedEvaluation.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Réponses Détaillées</h4>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {selectedEvaluation.questions.map((question, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium mb-2">Question {index + 1}</h5>
                            <p className="text-sm text-gray-600 mb-2">{question.text}</p>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm">
                                <strong>Réponse:</strong> {selectedEvaluation.responses[index] || 'Pas de réponse'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Sélectionnez une évaluation dans l'onglet "Évaluations" pour voir ses détails complets.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
         </Tabs>
        </div>
      </div>
    </TeacherAuth>
  );
}