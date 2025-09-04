"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TeacherAccessInfo() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-8">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👨‍🏫</span>
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-blue-900">
              Espace Professeur Sécurisé
            </CardTitle>
            <CardDescription className="text-blue-700">
              Accès réservé aux enseignants avec code d'authentification
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Fonctionnalités Professeur</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Suivi des performances étudiantes</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Analytics détaillées par module</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Rapports personnalisés par étudiant</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Export des données de classe</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Historique complet des évaluations</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Sécurité et Accès</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  🔐 Code requis
                </Badge>
                <span className="text-sm text-blue-700">Authentification sécurisée</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  ⏱️ Session 4h
                </Badge>
                <span className="text-sm text-blue-700">Expiration automatique</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  🛡️ Protection
                </Badge>
                <span className="text-sm text-blue-700">Limite de tentatives</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 mb-2">
                <strong>Codes de démonstration disponibles :</strong>
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                <span className="text-blue-600">PROF2024</span>
                <span className="text-blue-600">EDUCATION123</span>
                <span className="text-blue-600">TEACHER_ACCESS</span>
                <span className="text-blue-600">ADMIN_COURS</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Link 
            href="/teacher-login"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <span>🔑</span>
            <span>Accéder à l'Espace Professeur</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}