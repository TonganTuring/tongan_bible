import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    console.log('Translation request received:', { text });
    
    if (!text) {
      console.error('No text provided in request');
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const key = process.env.AZURE_TRANSLATOR_KEY;
    const location = process.env.AZURE_TRANSLATOR_LOCATION;

    console.log('Azure Translator config:', {
      endpoint: endpoint ? 'present' : 'missing',
      key: key ? 'present' : 'missing',
      location: location ? 'present' : 'missing'
    });

    if (!endpoint || !key || !location) {
      console.error('Missing Azure Translator configuration');
      return NextResponse.json({ error: 'Azure Translator configuration missing' }, { status: 500 });
    }

    const requestBody = JSON.stringify([{ text }]);
    console.log('Sending request to Azure Translator:', {
      url: `${endpoint}/translate?api-version=3.0&from=to&to=en`,
      body: requestBody
    });

    const response = await fetch(`${endpoint}/translate?api-version=3.0&from=to&to=en`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    console.log('Azure Translator response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Translator API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Azure Translator API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Azure Translator response data:', data);
    
    if (!data || !data[0] || !data[0].translations || !data[0].translations[0]) {
      console.error('Invalid response format from Azure Translator:', data);
      throw new Error('Invalid response format from Azure Translator');
    }

    return NextResponse.json(data[0].translations[0]);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      error: 'Translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 