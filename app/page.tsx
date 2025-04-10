'use client';

import { useState, useCallback } from 'react';
import { useBible } from './context/BibleContext';
import { bookOrder, Bible, Verse } from './types/bible';
import React from 'react';
import WordPopup from './components/WordPopup';

export default function Home() {
  const {
    tonganBible,
    esvBible,
    currentLanguage,
    setCurrentLanguage,
    viewMode,
    setViewMode,
    fontSize,
    isLoading
  } = useBible();
  const [currentBook, setCurrentBook] = useState('1TH');
  const [currentChapter, setCurrentChapter] = useState('1');
  const [selectedWord, setSelectedWord] = useState<{ word: string; x: number; y: number } | null>(null);

  const navigateChapter = useCallback((direction: 'prev' | 'next') => {
    if (!tonganBible) return;
    
    const currentBookIndex = bookOrder.indexOf(currentBook);
    let newBook = currentBook;
    let newChapter = currentChapter;

    if (direction === 'prev') {
      if (currentChapter === '1') {
        if (currentBookIndex > 0) {
          newBook = bookOrder[currentBookIndex - 1];
          const prevBook = tonganBible[newBook];
          if (prevBook) {
            newChapter = Object.keys(prevBook.chapters).length.toString();
          }
        }
      } else {
        newChapter = (parseInt(currentChapter) - 1).toString();
      }
    } else {
      const currentBookData = tonganBible[currentBook];
      if (currentBookData) {
        const maxChapter = Object.keys(currentBookData.chapters).length;
        if (currentChapter === maxChapter.toString()) {
          if (currentBookIndex < bookOrder.length - 1) {
            newBook = bookOrder[currentBookIndex + 1];
            newChapter = '1';
          }
        } else {
          newChapter = (parseInt(currentChapter) + 1).toString();
        }
      }
    }

    setCurrentBook(newBook);
    setCurrentChapter(newChapter);
  }, [currentBook, currentChapter, tonganBible]);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base';
      case 'large':
        return 'text-2xl';
      default:
        return 'text-xl';
    }
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  const saveToDictionary = async () => {
    // Implementation for saving to dictionary
  };

  const renderVerses = (bible: Bible | null) => {
    if (!bible) return null;
    const book = bible[currentBook];
    if (!book) return null;
    const chapter = book.chapters[currentChapter];
    if (!chapter) return null;

    return (
      <div className="space-y-6">
        {chapter.map((verse: Verse) => (
          <div key={verse.number} className={`text-gray-800 ${getFontSizeClass()} leading-[1.6] tracking-normal`}>
            <sup className="text-gray-500 font-medium mr-[2px] text-sm">{verse.number}</sup>
            {verse.text}
          </div>
        ))}
      </div>
    );
  };

  const renderParallelVerses = () => {
    if (!tonganBible || !esvBible) return null;
    
    const tonganBook = tonganBible[currentBook];
    const esvBook = esvBible[currentBook];
    if (!tonganBook || !esvBook) return null;

    const tonganChapter = tonganBook.chapters[currentChapter];
    const esvChapter = esvBook.chapters[currentChapter];
    if (!tonganChapter || !esvChapter) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-6">
          {tonganChapter.map((tonganVerse: Verse, index: number) => {
            const esvVerse = esvChapter[index];
            if (!esvVerse) return null;

            return (
              <div key={tonganVerse.number} className={`text-gray-800 ${getFontSizeClass()} leading-[1.6] tracking-normal`}>
                <sup className="text-gray-500 font-medium mr-[2px] text-sm">{tonganVerse.number}</sup>
                {tonganVerse.text}
              </div>
            );
          })}
        </div>
        <div className="space-y-6">
          {esvChapter.map((esvVerse: Verse) => (
            <div key={esvVerse.number} className={`text-gray-800 ${getFontSizeClass()} leading-[1.6] tracking-normal`}>
              <sup className="text-gray-500 font-medium mr-[2px] text-sm">{esvVerse.number}</sup>
              {esvVerse.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value as 'tongan' | 'english')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tongan">Tongan</option>
              <option value="english">English</option>
            </select>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'single' | 'parallel')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="single">Single View</option>
              <option value="parallel">Parallel View</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateChapter('prev')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              Previous
            </button>
            <button
              onClick={() => navigateChapter('next')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {viewMode === 'single' ? (
            renderVerses(currentLanguage === 'tongan' ? tonganBible : esvBible)
          ) : (
            renderParallelVerses()
          )}
        </div>
      </div>

      {selectedWord && (
        <WordPopup
          word={selectedWord.word}
          x={selectedWord.x}
          y={selectedWord.y}
          onClose={handleClosePopup}
          onSaveToDictionary={saveToDictionary}
        />
      )}
    </main>
  );
}
