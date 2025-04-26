import { useState, useEffect } from 'react';

type Position = {
  row: number;
  col: number;
};

type Word = {
  text: string;
  found: boolean;
  positions: Position[];
};

type Cell = {
  letter: string;
  selected: boolean;
  partOfFoundWord: boolean;
  showHiddenWord: boolean;
};

const WORDS_LIST = [
  'REACT',
  'TYPESCRIPT',
  'JAVASCRIPT',
  'NEXTJS',
  'TAILWIND',
  'DEVELOPER',
  'COMPONENT',
  'HOOKS',
];

const GRID_SIZE = 8;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function WordsMatch() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [gameLost, setGameLost] = useState<boolean>(false);
  const [showAllWords, setShowAllWords] = useState<boolean>(false); // New state to track if we should show all words

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    setGameWon(false);
    setGameLost(false);
    setSelectedCells([]);
    setShowAllWords(false);

    // Select 5 random words from the list
    const selectedWords = [...WORDS_LIST]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(word => word.toUpperCase());

    // Create empty grid
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            letter: ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
            selected: false,
            partOfFoundWord: false,
            showHiddenWord: false,
          }))
      );

    const placedWords: Word[] = [];

    // Try to place each word in the grid
    for (const word of selectedWords) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const positions: Position[] = [];

        // Check if word fits in the chosen direction
        if (
          (direction === 'horizontal' && col + word.length <= GRID_SIZE) ||
          (direction === 'vertical' && row + word.length <= GRID_SIZE)
        ) {
          let fits = true;
          // Check if positions are available
          for (let i = 0; i < word.length; i++) {
            const checkRow = direction === 'vertical' ? row + i : row;
            const checkCol = direction === 'horizontal' ? col + i : col;
            const cell = newGrid[checkRow][checkCol];
            
            // If cell already has a letter from another word and it's not the same letter
            if (cell.letter !== word[i] && cell.partOfFoundWord) {
              fits = false;
              break;
            }
          }

          if (fits) {
            // Place the word
            for (let i = 0; i < word.length; i++) {
              const placeRow = direction === 'vertical' ? row + i : row;
              const placeCol = direction === 'horizontal' ? col + i : col;
              newGrid[placeRow][placeCol].letter = word[i];
              positions.push({ row: placeRow, col: placeCol });
            }
            placedWords.push({
              text: word,
              found: false,
              positions,
            });
            placed = true;
          }
        }
      }
    }

    setGrid(newGrid);
    setWords(placedWords);
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameWon || gameLost) return;

    const cell = grid[row][col];
    const isAlreadySelected = selectedCells.some(
      pos => pos.row === row && pos.col === col
    );

    // If clicking the last selected cell, deselect it
    if (
      selectedCells.length > 0 &&
      selectedCells[selectedCells.length - 1].row === row &&
      selectedCells[selectedCells.length - 1].col === col
    ) {
      const newSelectedCells = [...selectedCells];
      newSelectedCells.pop();
      setSelectedCells(newSelectedCells);

      const newGrid = [...grid];
      newGrid[row][col].selected = false;
      setGrid(newGrid);
      return;
    }

    // If clicking a cell that's not adjacent to the last selected cell, reset selection
    if (selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      const isAdjacent =
        Math.abs(lastCell.row - row) <= 1 && Math.abs(lastCell.col - col) <= 1;
      if (!isAdjacent) {
        // Deselect all
        const newGrid = grid.map(row =>
          row.map(cell => ({ ...cell, selected: false }))
        );
        setGrid(newGrid);
        setSelectedCells([{ row, col }]);
        newGrid[row][col].selected = true;
        return;
      }
    }

    // Prevent selecting the same cell twice
    if (isAlreadySelected) return;

    // Select the cell
    const newSelectedCells = [...selectedCells, { row, col }];
    setSelectedCells(newSelectedCells);

    const newGrid = [...grid];
    newGrid[row][col].selected = true;
    setGrid(newGrid);

    // Check if selected letters form a word
    checkForWord(newSelectedCells);
  };

  const checkForWord = (selectedCells: Position[]) => {
    const selectedWord = selectedCells
      .map(pos => grid[pos.row][pos.col].letter)
      .join('');

    const reversedWord = [...selectedWord].reverse().join('');

    for (const word of words) {
      if (word.found) continue;

      if (selectedWord === word.text || reversedWord === word.text) {
        // Mark word as found
        const newWords = words.map(w =>
          w.text === word.text ? { ...w, found: true } : w
        );
        setWords(newWords);

        // Highlight the cells in the grid
        const newGrid = [...grid];
        word.positions.forEach(pos => {
          newGrid[pos.row][pos.col].partOfFoundWord = true;
          newGrid[pos.row][pos.col].selected = false;
        });
        setGrid(newGrid);

        // Clear selection
        setSelectedCells([]);

        // Check if all words are found
        if (newWords.every(w => w.found)) {
          setGameWon(true);
        }

        return;
      }
    }
  };

  const handleGiveUp = () => {
    setGameLost(true);
    setShowAllWords(true);
    
    // Highlight all hidden words that weren't found
    const newGrid = [...grid];
    const newWords = [...words];
    
    newWords.forEach(word => {
      if (!word.found) {
        word.positions.forEach(pos => {
          newGrid[pos.row][pos.col].showHiddenWord = true;
        });
      }
    });
    
    setGrid(newGrid);
    setWords(newWords);
  };

  const handleRestart = () => {
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
          Words Match Game
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Game Board */}
          <div className="flex-1">
            <div className="grid grid-cols-8 gap-1 bg-blue-200 p-2 rounded-lg shadow-lg">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 flex items-center justify-center text-lg font-bold rounded transition-all
                      ${cell.selected ? 'bg-yellow-400 text-black' : ''}
                      ${cell.partOfFoundWord ? 'bg-green-400 text-white' : ''}
                      ${
                        cell.showHiddenWord
                          ? 'bg-purple-300 text-purple-900'
                          : !cell.selected && !cell.partOfFoundWord
                          ? 'bg-white hover:bg-blue-100'
                          : ''
                      }
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={cell.partOfFoundWord || gameLost || gameWon}
                  >
                    {cell.letter}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                onClick={handleGiveUp}
                disabled={gameWon || gameLost}
              >
                Give Up
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                onClick={handleRestart}
              >
                Restart
              </button>
            </div>
          </div>

          {/* Words Panel */}
          <div className="lg:w-64 bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-800 border-b pb-2">
              Words to Find
            </h2>
            <ul className="space-y-2">
              {words.map((word, index) => (
                <li
                  key={index}
                  className={`p-2 rounded ${
                    word.found
                      ? 'line-through bg-green-100 text-green-800'
                      : showAllWords
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {word.text}
                </li>
              ))}
            </ul>

            {/* Game Status */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50">
              {gameWon && (
                <div className="text-center text-green-600 font-bold text-xl animate-bounce">
                  You Won �
                </div>
              )}
              {gameLost && (
                <div className="text-center text-red-600 font-bold text-xl">
                  You Lost ❌
                </div>
              )}
              {!gameWon && !gameLost && (
                <div className="text-center text-blue-600 font-bold">
                  {words.filter(w => w.found).length} / {words.length} words found
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-600">
              <p className="font-bold mb-1">How to play:</p>
              <p>Click adjacent letters to form words.</p>
              <p>Found words will be highlighted in green.</p>
              {gameLost && (
                <p className="text-purple-600 mt-2">
                  Hidden words are shown in purple.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}