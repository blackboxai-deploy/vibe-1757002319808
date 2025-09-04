"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { aiService } from '@/lib/ai-service';
import { db } from '@/lib/database';
import { CodeImprovement } from '@/types';
import Link from 'next/link';

export default function CodeImprovementPage() {
  const [step, setStep] = useState<'input' | 'analysis'>('input');
  const [code, setCode] = useState('');
   const [language, setLanguage] = useState('javascript');
  const [studentId, setStudentId] = useState('');
  const [projectSpecs, setProjectSpecs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

   const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Veuillez entrer du code à analyser');
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
      const codeId = await db.saveStudentCode({
        id: '',
        content: code,
        language,
        filename: `code.${language}`,
        uploadedAt: new Date(),
        projectSpecs: projectSpecs || undefined
      });

      // Analyser le code avec l'IA
      const analysisResult = await aiService.analyzeCodeImprovement(code, projectSpecs, language);
      
      // Sauvegarder l'analyse
      const improvement: CodeImprovement = {
        id: '',
        codeId,
        improvements: analysisResult.improvements,
        externalQuestions: analysisResult.externalQuestions,
        overallScore: analysisResult.overallScore,
        report: analysisResult.report
      };

      const improvementId = await db.saveCodeImprovement(improvement);
      improvement.id = improvementId;

      setAnalysis(analysisResult);
      setStep('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse du code');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return '⚡';
      case 'sécurité': return '🔒';
      case 'lisibilité': return '📖';
      case 'architecture': return '🏗️';
      default: return '🔧';
    }
  };

  const exportReport = () => {
    if (!analysis) return;

    const report = `# Rapport d'Amélioration de Code

## Score Global
${analysis.overallScore}/100

## Résumé
${analysis.report}

## Améliorations Suggérées

${analysis.improvements.map((imp: any, index: number) => `
### ${index + 1}. ${imp.category} - Priorité: ${imp.priority}

**Description:** ${imp.description}

**Suggestion:** ${imp.suggestion}

${imp.lineNumbers ? `**Lignes concernées:** ${imp.lineNumbers.join(', ')}` : ''}

---
`).join('')}

## Questions pour Compréhension Externe

${analysis.externalQuestions.map((q: any, index: number) => `
### ${index + 1}. ${q.question}

**Objectif:** ${q.purpose}

---
`).join('')}

---
*Rapport généré le ${new Date().toLocaleDateString('fr-FR')} par la Plateforme IA Éducative*
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-amelioration-${Date.now()}.md`;
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
            Amélioration de Code
          </h1>
          <p className="text-gray-600">
            Analysez votre code et recevez des suggestions d'amélioration basées sur l'IA
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
              <CardTitle>Code à Analyser</CardTitle>
              <CardDescription>
                Collez votre code et optionnellement les spécifications du projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécifications du projet (optionnel)
                </label>
                <Textarea
                  value={projectSpecs}
                  onChange={(e) => setProjectSpecs(e.target.value)}
                  placeholder="Décrivez les exigences du projet, les contraintes, les objectifs..."
                  className="min-h-32"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ces informations aident l'IA à fournir des suggestions plus pertinentes
                </p>
              </div>

               <Button 
                onClick={handleAnalyze} 
                className="w-full" 
                disabled={isLoading || !code.trim() || !studentId.trim()}
              >
                {isLoading ? 'Analyse en cours...' : 'Analyser le Code'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Analysis Results */}
        {step === 'analysis' && analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Analyse Terminée</CardTitle>
                <div className="text-6xl font-bold mt-4 mb-2">
                  <span className={analysis.overallScore >= 80 ? 'text-green-600' : 
                                 analysis.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                    {analysis.overallScore}
                  </span>
                  <span className="text-gray-400">/100</span>
                </div>
                <p className="text-xl text-gray-600">Score de qualité du code</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button onClick={exportReport} variant="outline">
                    📄 Exporter le Rapport
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Overall Report */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Rapport Global</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{analysis.report}</p>
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Suggestions d'Amélioration</CardTitle>
                <CardDescription>
                  {analysis.improvements.length} améliorations identifiées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.improvements.map((improvement: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCategoryIcon(improvement.category)}</span>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {improvement.category}
                          </h4>
                        </div>
                        <Badge className={getPriorityColor(improvement.priority)}>
                          {improvement.priority}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 font-medium mb-1">Problème identifié:</p>
                        <p className="text-sm text-gray-700">{improvement.description}</p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-blue-600 font-medium mb-1">Suggestion:</p>
                        <p className="text-sm text-blue-700">{improvement.suggestion}</p>
                      </div>
                      
                      {improvement.lineNumbers && improvement.lineNumbers.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">
                            Lignes concernées: {improvement.lineNumbers.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* External Questions */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Questions pour Compréhension Externe</CardTitle>
                <CardDescription>
                  Questions utiles pour quelqu'un qui découvre ce code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.externalQuestions.map((question: any, index: number) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {question.question}
                      </h4>
                      <p className="text-sm text-blue-700">
                        <strong>Objectif:</strong> {question.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Nouvelle Analyse
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