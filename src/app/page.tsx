"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Analytics } from '@/types';
import { db } from '@/lib/database';
import TeacherAccessInfo from '@/components/TeacherAccessInfo';
import Link from 'next/link';

export default function HomePage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await db.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modules = [
    {
      id: 'open-questions',
      title: 'Questions Ouvertes',
      description: 'Évaluation de code par questions contextuelles',
      icon: '❓',
      color: 'bg-blue-500',
      href: '/open-questions',
      stats: analytics?.moduleUsage.openQuestions || 0
    },
    {
      id: 'code-improvement',
      title: 'Amélioration de Code',
      description: 'Analyse et suggestions d\'optimisation',
      icon: '⚡',
      color: 'bg-green-500',
      href: '/code-improvement',
      stats: analytics?.moduleUsage.codeImprovement || 0
    },
    {
      id: 'mcq-generator',
      title: 'Générateur QCM',
      description: 'Création de QCM à partir de LaTeX',
      icon: '📝',
      color: 'bg-purple-500',
      href: '/mcq-generator',
      stats: analytics?.moduleUsage.mcqGenerator || 0
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Plateforme IA Éducative
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Évaluez, améliorez et créez du contenu éducatif avec l'intelligence artificielle
        </p>
      </div>

      {/* Statistics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Total Évaluations</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600">
                {analytics.totalEvaluations}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Score Moyen</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600">
                {analytics.averageScore.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Questions Générées</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-600">
                {analytics.difficultyDistribution.easy + 
                 analytics.difficultyDistribution.medium + 
                 analytics.difficultyDistribution.hard}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardDescription>Langues Supportées</CardDescription>
              <CardTitle className="text-3xl font-bold text-orange-600">
                {analytics.languageDistribution.fr > 0 && analytics.languageDistribution.en > 0 ? '2' : '1'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {modules.map((module) => (
          <Card key={module.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center text-2xl mb-4`}>
                  {module.icon}
                </div>
                <Badge variant="outline" className="text-sm">
                  {module.stats} utilisations
                </Badge>
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {module.title}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={module.href}>
                <Button className="w-full" variant="outline">
                  Accéder au module
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      {analytics && analytics.recentActivity.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Activité Récente</CardTitle>
            <CardDescription>Dernières évaluations effectuées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'open-questions' ? 'bg-blue-500' :
                      activity.type === 'code-improvement' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {activity.type === 'open-questions' ? 'Questions Ouvertes' :
                         activity.type === 'code-improvement' ? 'Amélioration Code' :
                         'QCM'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.score && activity.score >= 70 ? 'default' : 'destructive'}>
                    {activity.score ? `${activity.score.toFixed(1)}%` : 'En cours'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-12">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-900">
            Commencer
          </CardTitle>
          <CardDescription className="text-blue-700">
            Choisissez un module pour débuter votre évaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/open-questions">
              <Button className="w-full" variant="outline">
                🚀 Évaluer du Code
              </Button>
            </Link>
            <Link href="/code-improvement">
              <Button className="w-full" variant="outline">
                🔧 Améliorer du Code
              </Button>
            </Link>
            <Link href="/mcq-generator">
              <Button className="w-full" variant="outline">
                📚 Créer un QCM
              </Button>
            </Link>
            <Link href="/teacher-login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                👨‍🏫 Dashboard Professeur
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center mt-16 py-8 border-t border-gray-200">
        <p className="text-gray-600 mb-4">
          Plateforme IA Éducative - Développée avec Next.js et IA
        </p>
         <div className="flex justify-center space-x-6">
          <Link href="/teacher-login" className="text-blue-600 hover:text-blue-800 transition-colors">
            👨‍🏫 Accès Professeur
          </Link>
          <Link href="/analytics" className="text-blue-600 hover:text-blue-800 transition-colors">
            Analytics Détaillées
          </Link>
          <Link href="/settings" className="text-blue-600 hover:text-blue-800 transition-colors">
            Paramètres
          </Link>
          <Link href="/export" className="text-blue-600 hover:text-blue-800 transition-colors">
            Export Données
          </Link>
        </div>
      </footer>
    </div>
  );
}