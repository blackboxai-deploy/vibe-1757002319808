"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

interface TeacherAuthProps {
  children: React.ReactNode;
}

export default function TeacherAuth({ children }: TeacherAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [teacherCode, setTeacherCode] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const authenticated = localStorage.getItem('teacherAuthenticated');
    const code = localStorage.getItem('teacherCode');
    const loginTime = localStorage.getItem('teacherLoginTime');

    if (!authenticated || !code || !loginTime) {
      setIsAuthenticated(false);
      router.push('/teacher-login');
      return;
    }

    // Vérifier si la session n'a pas expiré (4 heures)
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursDifference = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > 4) {
      // Session expirée
      localStorage.removeItem('teacherAuthenticated');
      localStorage.removeItem('teacherCode');
      localStorage.removeItem('teacherLoginTime');
      setIsAuthenticated(false);
      router.push('/teacher-login');
      return;
    }

    setIsAuthenticated(true);
    setTeacherCode(code);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherAuthenticated');
    localStorage.removeItem('teacherCode');
    localStorage.removeItem('teacherLoginTime');
    router.push('/');
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Vérification de l'authentification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated - redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirection vers la page de connexion...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - show header with logout and render children
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Teacher Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">👨‍🏫</span>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-900">
                  Mode Professeur
                </h2>
                <p className="text-xs text-gray-600">
                  Connecté avec le code: {teacherCode}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500">
                Session active • Expire dans {(() => {
                  const loginTime = localStorage.getItem('teacherLoginTime');
                  if (!loginTime) return '0h';
                  
                  const loginDate = new Date(loginTime);
                  const now = new Date();
                  const hoursDifference = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
                  const hoursLeft = Math.max(0, 4 - hoursDifference);
                  
                  if (hoursLeft < 1) {
                    const minutesLeft = Math.max(0, (4 - hoursDifference) * 60);
                    return `${Math.floor(minutesLeft)}min`;
                  }
                  
                  return `${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}min`;
                })()}
              </div>
              
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Protected Content */}
      <div className="pb-4">
        {children}
      </div>
    </div>
  );
}