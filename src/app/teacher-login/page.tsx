"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TEACHER_CODES = [
  'PROF2024',
  'EDUCATION123',
  'TEACHER_ACCESS',
  'ADMIN_COURS',
  'FORMATEUR2024'
];

export default function TeacherLoginPage() {
  const [teacherCode, setTeacherCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const handleLogin = async () => {
    if (!teacherCode.trim()) {
      setError('Veuillez entrer un code professeur');
      return;
    }

    if (attempts >= 5) {
      setError('Trop de tentatives incorrectes. Veuillez attendre avant de réessayer.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulation d'une vérification sécurisée
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValidCode = TEACHER_CODES.includes(teacherCode.toUpperCase());

    if (isValidCode) {
      // Stocker l'authentification dans le localStorage
      localStorage.setItem('teacherAuthenticated', 'true');
      localStorage.setItem('teacherCode', teacherCode.toUpperCase());
      localStorage.setItem('teacherLoginTime', new Date().toISOString());
      
      // Rediriger vers le dashboard professeur
      router.push('/teacher-dashboard');
    } else {
      setAttempts(prev => prev + 1);
      setError(`Code professeur invalide. Tentative ${attempts + 1}/5`);
      
      // Effacer le champ après une tentative incorrecte
      setTeacherCode('');
      
      if (attempts + 1 >= 5) {
        setError('Accès bloqué après 5 tentatives incorrectes. Contactez l\'administrateur.');
        // Bloquer temporairement (simulation)
        setTimeout(() => {
          setAttempts(0);
          setError(null);
        }, 60000); // Déblocage après 1 minute
      }
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accès Professeur
          </h1>
          <p className="text-gray-600">
            Entrez votre code professeur pour accéder au dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <CardTitle className="text-xl text-gray-900">
              Authentification Professeur
            </CardTitle>
            <CardDescription className="text-gray-600">
              Code d'accès requis pour la supervision des étudiants
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Professeur
              </label>
              <Input
                type="password"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Entrez votre code d'accès"
                className="text-center text-lg tracking-widest font-mono"
                disabled={isLoading || attempts >= 5}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Code fourni par l'administration
              </p>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading || !teacherCode.trim() || attempts >= 5}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Vérification...</span>
                </div>
              ) : (
                'Accéder au Dashboard'
              )}
            </Button>

            {attempts > 0 && attempts < 5 && (
              <div className="text-center text-sm text-orange-600">
                ⚠️ Tentatives restantes: {5 - attempts}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium text-blue-900 mb-2">
                Codes de Démonstration
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Pour cette démo, vous pouvez utiliser l'un de ces codes :
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono bg-white rounded p-3 border border-blue-200">
                <div className="flex justify-between">
                  <span className="text-blue-600">PROF2024</span>
                  <span className="text-gray-500">Code principal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">EDUCATION123</span>
                  <span className="text-gray-500">Code secondaire</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">TEACHER_ACCESS</span>
                  <span className="text-gray-500">Accès standard</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                ℹ️ En production, ces codes seraient confidentiels et personnalisés
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>🔒 Connexion sécurisée • Session limitée à 4 heures</p>
          <p>Système de protection contre les tentatives malveillantes</p>
        </div>
      </div>
    </div>
  );
}