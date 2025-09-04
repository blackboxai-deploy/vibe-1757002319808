import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;
    const filePath = path.join(dataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      // Retourner un tableau vide pour les nouveaux fichiers JSON
      return NextResponse.json([]);
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Erreur lecture fichier:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;
    const filePath = path.join(dataDir, filename);
    const data = await request.json();
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur écriture fichier:', error);
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
}