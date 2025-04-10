import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'my_tongan_dictionary.csv');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ found: false });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      if (values.length < 4) continue;
      
      const dictionaryWord = values[0]?.replace(/^"|"$/g, '').trim() || '';
      
      // Normalize apostrophes and remove diacritical marks for comparison
      const normalizedWord = word.toLowerCase().trim()
        .replace(/[''ʻʼ‘']/g, "'")
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      const normalizedEntry = dictionaryWord.toLowerCase().trim()
        .replace(/[''ʻʼ‘']/g, "'")
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "");

      if (normalizedWord === normalizedEntry) {
        return NextResponse.json({
          found: true,
          word: dictionaryWord,
          translation: values[1]?.replace(/^"|"$/g, '').trim() || '',
          partOfSpeech: values[2]?.replace(/^"|"$/g, '').trim() || '',
          example: values[3]?.replace(/^"|"$/g, '').trim() || ''
        });
      }
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error('Error checking dictionary:', error);
    return NextResponse.json({ error: 'Failed to check dictionary', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 