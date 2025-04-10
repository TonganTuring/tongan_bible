export type Verse = {
  number: string;
  text: string;
};

export type Chapter = Verse[];

export type Book = {
  name: string;
  chapters: {
    [key: string]: Chapter;
  };
};

export type Bible = {
  [key: string]: Book;
};

export type Language = 'tongan' | 'english';

export type ViewMode = 'single' | 'parallel';

export type FontSize = 'small' | 'medium' | 'large';

export const bookOrder = [
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
]; 