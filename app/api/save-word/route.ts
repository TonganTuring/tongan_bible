import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { tongan_word, english_translation, part_of_speech, example_sentence } = await request.json();

    if (!tongan_word || !english_translation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const csvData = `"${tongan_word}","${english_translation}","${part_of_speech}","${example_sentence}"\n`;
    
    // Use data directory for file storage
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'my_tongan_dictionary.csv');
    
    console.log('Attempting to save to:', filePath);
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('Creating data directory:', dataDir);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if file exists, if not create it with headers
    if (!fs.existsSync(filePath)) {
      console.log('Creating new dictionary file with headers');
      const headers = 'tongan_word,english_translation,part_of_speech,example_sentence\n';
      fs.writeFileSync(filePath, headers);
    }
    
    // Append the new word
    console.log('Appending word to dictionary:', csvData);
    fs.appendFileSync(filePath, csvData);

    // Verify the file was written
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log('File content after append:', fileContent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving word:', error);
    return NextResponse.json({ error: 'Failed to save word', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 