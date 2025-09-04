"use client";

import { Button } from '@/components/ui/button';
import { Evaluation } from '@/types';

interface StudentReportExportProps {
  studentId: string;
  evaluations: Evaluation[];
}

export default function StudentReportExport({ studentId, evaluations }: StudentReportExportProps) {
  const generateDetailedReport = () => {
     const studentEvals = evaluations.filter(e => e.studentId === studentId);
    const totalScore = studentEvals.reduce((sum, evaluation) => sum + (evaluation.score / evaluation.maxScore) * 100, 0);
    const averageScore = totalScore / studentEvals.length;

     // Analyse par module
    const moduleStats = {
      'open-questions': studentEvals.filter(e => e.type === 'open-questions'),
      'code-improvement': studentEvals.filter(e => e.type === 'code-improvement'),
      'mcq': studentEvals.filter(e => e.type === 'mcq')
    };

    // Évolution temporelle
    const chronologicalEvals = studentEvals
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    const report = `# Rapport Détaillé Étudiant

## Informations Générales
- **Étudiant**: ${studentId}
- **Nombre d'évaluations**: ${studentEvals.length}
- **Score moyen**: ${averageScore.toFixed(1)}%
- **Période**: Du ${new Date(chronologicalEvals[0]?.startedAt || new Date()).toLocaleDateString('fr-FR')} au ${new Date(chronologicalEvals[chronologicalEvals.length - 1]?.startedAt || new Date()).toLocaleDateString('fr-FR')}

## Performance par Module

${Object.entries(moduleStats).map(([module, evaluationsList]) => {
  if (evaluationsList.length === 0) return '';
  
  const moduleAvg = evaluationsList.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / evaluationsList.length;
  const moduleName = module === 'open-questions' ? 'Questions Ouvertes' :
                     module === 'code-improvement' ? 'Amélioration de Code' : 'QCM';
  
   return `
### ${moduleName}
- **Évaluations**: ${evaluationsList.length}
- **Score moyen**: ${moduleAvg.toFixed(1)}%
- **Meilleur score**: ${Math.max(...evaluationsList.map(e => (e.score / e.maxScore) * 100)).toFixed(1)}%
- **Score le plus faible**: ${Math.min(...evaluationsList.map(e => (e.score / e.maxScore) * 100)).toFixed(1)}%

**Détail des évaluations**:
${evaluationsList.map((evaluation, index) => `
${index + 1}. **${new Date(evaluation.startedAt).toLocaleDateString('fr-FR')}** - Score: ${((evaluation.score / evaluation.maxScore) * 100).toFixed(1)}%
   - Questions: ${evaluation.questions.length}
   - Durée: ${evaluation.completedAt ? Math.round((new Date(evaluation.completedAt).getTime() - new Date(evaluation.startedAt).getTime()) / 60000) : 'N/A'}min
   - Feedback: ${evaluation.feedback.substring(0, 100)}${evaluation.feedback.length > 100 ? '...' : ''}
`).join('')}
`;
}).join('')}

## Évolution Chronologique

${chronologicalEvals.map((evaluation, index) => `
### Évaluation ${index + 1} - ${new Date(evaluation.startedAt).toLocaleDateString('fr-FR')}

**Type**: ${evaluation.type === 'open-questions' ? 'Questions Ouvertes' :
            evaluation.type === 'code-improvement' ? 'Amélioration de Code' : 'QCM'}  
**Score**: ${((evaluation.score / evaluation.maxScore) * 100).toFixed(1)}% (${evaluation.score}/${evaluation.maxScore})  
**Durée**: ${evaluation.completedAt ? Math.round((new Date(evaluation.completedAt).getTime() - new Date(evaluation.startedAt).getTime()) / 60000) : 'N/A'} minutes

**Feedback Détaillé**:
${evaluation.feedback}

${evaluation.suggestions && evaluation.suggestions.length > 0 ? `
**Suggestions d'amélioration**:
${evaluation.suggestions.map(s => `- ${s}`).join('\n')}
` : ''}

**Questions et Réponses**:
${evaluation.questions.map((q, qIndex) => `
**Q${qIndex + 1}**: ${q.text}
**Réponse**: ${evaluation.responses[qIndex] || 'Pas de réponse'}
`).join('')}

---
`).join('')}

## Analyse et Recommandations

### Points Forts
${averageScore >= 80 ? '- Excellentes performances globales' :
  averageScore >= 70 ? '- Bonnes performances avec marge d\'amélioration' :
  '- Nécessite un accompagnement renforcé'}

${Object.entries(moduleStats).map(([module, evaluationsList]) => {
  if (evaluationsList.length === 0) return '';
  const moduleAvg = evaluationsList.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / evaluationsList.length;
  const moduleName = module === 'open-questions' ? 'Questions Ouvertes' :
                     module === 'code-improvement' ? 'Amélioration de Code' : 'QCM';
  
  if (moduleAvg >= 75) {
    return `- Maîtrise du module "${moduleName}" (${moduleAvg.toFixed(1)}%)`;
  }
  return '';
}).filter(Boolean).join('\n')}

### Axes d'Amélioration
${Object.entries(moduleStats).map(([module, evaluationsList]) => {
  if (evaluationsList.length === 0) return '';
  const moduleAvg = evaluationsList.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / evaluationsList.length;
  const moduleName = module === 'open-questions' ? 'Questions Ouvertes' :
                     module === 'code-improvement' ? 'Amélioration de Code' : 'QCM';
  
  if (moduleAvg < 60) {
    return `- Renforcement nécessaire en "${moduleName}" (${moduleAvg.toFixed(1)}%)`;
  } else if (moduleAvg < 75) {
    return `- Amélioration possible en "${moduleName}" (${moduleAvg.toFixed(1)}%)`;
  }
  return '';
}).filter(Boolean).join('\n')}

### Évolution
${chronologicalEvals.length > 1 ? (() => {
  const firstScore = (chronologicalEvals[0].score / chronologicalEvals[0].maxScore) * 100;
  const lastScore = (chronologicalEvals[chronologicalEvals.length - 1].score / chronologicalEvals[chronologicalEvals.length - 1].maxScore) * 100;
  const evolution = lastScore - firstScore;
  
  if (evolution > 10) {
    return `- **Progression excellente**: +${evolution.toFixed(1)} points depuis la première évaluation`;
  } else if (evolution > 0) {
    return `- **Progression positive**: +${evolution.toFixed(1)} points depuis la première évaluation`;
  } else if (evolution > -10) {
    return `- **Performance stable**: ${evolution.toFixed(1)} points d'évolution`;
  } else {
    return `- **Régression**: ${evolution.toFixed(1)} points depuis la première évaluation - Accompagnement recommandé`;
  }
})() : '- Pas assez d\'évaluations pour analyser l\'évolution'}

### Suggestions Pédagogiques
${averageScore < 60 ? `
- **Accompagnement individuel recommandé**
- **Révision des concepts fondamentaux**
- **Exercices supplémentaires ciblés**
` : averageScore < 75 ? `
- **Soutien sur les points faibles identifiés**
- **Exercices de renforcement**
- **Échanges réguliers pour motivation**
` : `
- **Encourager la continuité des efforts**
- **Défis supplémentaires pour maintenir l'engagement**
- **Possibilité de tutorat pour aider d'autres étudiants**
`}

---

*Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*  
*Plateforme IA Éducative - Dashboard Professeur*
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${studentId.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={generateDetailedReport} size="sm" variant="outline">
      📄 Rapport Détaillé
    </Button>
  );
}