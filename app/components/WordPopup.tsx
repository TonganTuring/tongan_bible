import { useState, useEffect, useRef } from 'react';

interface DictionaryEntry {
  'Tongan Word': string;
  'Part of Speech': string;
  'Meaning in English': string;
}

interface CustomDictionaryEntry {
  word: string;
  translation: string;
  partOfSpeech: string;
  example: string;
}

interface AzureTranslation {
  text: string;
  to: string;
}

interface WordPopupProps {
  word: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaveToDictionary: (word: string, translation: string, partOfSpeech: string, exampleSentence: string) => Promise<void>;
}

export default function WordPopup({ word, x, y, onClose, onSaveToDictionary }: WordPopupProps) {
  const [dictionaryEntry, setDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [customDictionaryEntry, setCustomDictionaryEntry] = useState<CustomDictionaryEntry | null>(null);
  const [azureTranslation, setAzureTranslation] = useState<AzureTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    console.log('WordPopup mounted with word:', word);
    
    // Reset states for new word
    setDictionaryEntry(null);
    setCustomDictionaryEntry(null);
    setAzureTranslation(null);
    setIsLoading(true);
    setSaveSuccess(false);
    setIsSaving(false);
    
    // Cleanup previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchTranslation = async () => {
      try {
        // First check the main dictionary
        console.log('Checking main dictionary...');
        const dictionaryResponse = await fetch('/tongan_dictionary.csv', { signal });
        if (!dictionaryResponse.ok) {
          throw new Error(`HTTP error! status: ${dictionaryResponse.status}`);
        }
        const text = await dictionaryResponse.text();
        const lines = text.split('\n');
        
        let foundInDictionary = false;
        
        // Find the word in the dictionary
        for (let i = 1; i < lines.length; i++) {
          if (signal.aborted) break;
          
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          if (values.length < 8) continue;
          
          const dictionaryWord = values[1]?.replace(/^"|"$/g, '').trim() || '';
          
          const entry: DictionaryEntry = {
            'Tongan Word': dictionaryWord,
            'Part of Speech': values[6]?.replace(/^"|"$/g, '').trim() || '',
            'Meaning in English': values[7]?.replace(/^"|"$/g, '').trim() || ''
          };

          // Normalize apostrophes and remove diacritical marks
          const normalizedWord = word.toLowerCase().trim()
            .replace(/[''ʻʼ‘']/g, "'")
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "");
          const normalizedEntry = dictionaryWord.toLowerCase().trim()
            .replace(/[''ʻʼ‘']/g, "'")
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "");

          if (normalizedWord === normalizedEntry) {
            console.log('Found in main dictionary:', entry);
            setDictionaryEntry(entry);
            foundInDictionary = true;
            break;
          }
        }

        // If not found in main dictionary, check custom dictionary
        if (!foundInDictionary && !signal.aborted) {
          console.log('Checking custom dictionary...');
          const customResponse = await fetch('/api/check-dictionary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word }),
            signal,
          });

          if (!customResponse.ok) {
            throw new Error(`HTTP error! status: ${customResponse.status}`);
          }

          const customData = await customResponse.json();
          if (customData.found) {
            console.log('Found in custom dictionary:', customData);
            setCustomDictionaryEntry(customData);
            foundInDictionary = true;
          }
        }

        // If not found in either dictionary, try Azure Translator
        if (!foundInDictionary && !signal.aborted) {
          console.log('Word not found in dictionaries, trying Azure Translator...');
          try {
            const azureResponse = await fetch('/api/translate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: word }),
              signal,
            });

            if (!azureResponse.ok) {
              const errorData = await azureResponse.json();
              console.error('Azure Translator error:', {
                status: azureResponse.status,
                error: errorData
              });
              throw new Error(`Azure Translator error: ${azureResponse.status} - ${JSON.stringify(errorData)}`);
            }

            const translation = await azureResponse.json();
            console.log('Azure Translator success:', translation);
            setAzureTranslation(translation);
          } catch (error) {
            console.error('Azure Translator request failed:', error);
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error loading translation:', error);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [word]);

  // Adjust popup position if it would go off screen
  useEffect(() => {
    if (popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - rect.width - 20}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        popup.style.top = `${window.innerHeight - rect.height - 20}px`;
      }
    }
  }, [dictionaryEntry, azureTranslation, isLoading]);

  // Add effect to handle fade out
  useEffect(() => {
    if (!dictionaryEntry && !customDictionaryEntry && !azureTranslation && !isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade animation to complete
      }, 600); // Start fade out after .6 seconds
      return () => clearTimeout(timer);
    }
  }, [dictionaryEntry, customDictionaryEntry, azureTranslation, isLoading, onClose]);

  const saveToDictionary = async () => {
    if (!azureTranslation) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveToDictionary(word, azureTranslation.text, 'unknown', '');
      setSaveSuccess(true);
      // Update the dictionary entry to show the saved translation
      setDictionaryEntry({
        'Tongan Word': word,
        'Part of Speech': 'unknown',
        'Meaning in English': azureTranslation.text
      });
    } catch (error) {
      console.error('Error saving word:', error);
      // Show error message to user
      alert('Failed to save word to dictionary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  console.log('Rendering popup:', { isLoading, dictionaryEntry, azureTranslation });

  if (isLoading) {
    return (
      <div 
        ref={popupRef}
        className="fixed bg-white shadow-lg rounded-lg p-4 max-w-sm z-50"
        style={{ left: x, top: y }}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dictionaryEntry && !customDictionaryEntry && !azureTranslation) {
    return (
      <div 
        ref={popupRef}
        className={`fixed bg-white shadow-lg rounded-lg p-4 max-w-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ left: x, top: y }}
      >
        <div className="flex justify-between items-start">
          <p className="text-gray-600">No translation found for &quot;{word}&quot;</p>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={popupRef}
      className="fixed bg-white shadow-lg rounded-lg p-4 max-w-sm z-50"
      style={{ left: x, top: y }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {dictionaryEntry ? dictionaryEntry['Tongan Word'] : 
             customDictionaryEntry ? customDictionaryEntry.word : word}
          </h3>
          {(dictionaryEntry || customDictionaryEntry) && (
            <p className="text-sm text-gray-500">
              {dictionaryEntry ? dictionaryEntry['Part of Speech'] : 
               customDictionaryEntry ? customDictionaryEntry.partOfSpeech : ''}
            </p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2">
        {dictionaryEntry ? (
          <p className="text-gray-700">{dictionaryEntry['Meaning in English']}</p>
        ) : customDictionaryEntry ? (
          <div>
            <p className="text-gray-700">{customDictionaryEntry.translation}</p>
            {customDictionaryEntry.example && (
              <p className="text-sm text-gray-500 mt-1">Example: {customDictionaryEntry.example}</p>
            )}
          </div>
        ) : azureTranslation ? (
          <div>
            <p className="text-gray-700">{azureTranslation.text}</p>
            {!saveSuccess && (
              <button
                onClick={saveToDictionary}
                disabled={isSaving}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isSaving ? 'Saving...' : 'Save to Dictionary'}
              </button>
            )}
            {saveSuccess && (
              <p className="mt-2 text-green-600">Saved to dictionary!</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
} 