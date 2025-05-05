import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

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
const GAME_DURATION = 120; // 120 seconds (2 minutes)

// Smart Contract Details
const CONTRACT_ADDRESS = "0x130c45f0a2e1ede51fce8948316dd5a7da9e6960";
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_completionTime",
				"type": "uint256"
			}
		],
		"name": "saveTime",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "completionTime",
				"type": "uint256"
			}
		],
		"name": "TimeSaved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			}
		],
		"name": "getTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "players",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "completionTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "hasPlayed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export default function WordsMatch() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [gameLost, setGameLost] = useState<boolean>(false);
  const [showAllWords, setShowAllWords] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [previousTime, setPreviousTime] = useState<number | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize grid and ethers provider
  useEffect(() => {
    initializeGrid(); // Initialize grid immediately
    const initEthers = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          setContract(contractInstance);

          // Check if wallet is connected
          const accounts = await provider.listAccounts();
          console.log('Accounts:', accounts); // Debug log
          if (accounts.length > 0 && typeof accounts[0] === 'string') {
            setWalletAddress(accounts[0]);
            console.log('Set walletAddress:', accounts[0]); // Debug log
            // Fetch previous completion time
            const time = await contractInstance.getTime(accounts[0]);
            setPreviousTime(Number(time));
          }
        } catch (error) {
          console.error('Error initializing ethers:', error);
        }
      } else {
        console.warn('MetaMask is not installed');
      }
    };
    initEthers();
  }, []);

  // Handle wallet connection
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        console.log('Connected accounts:', accounts); // Debug log
        if (accounts.length > 0 && typeof accounts[0] === 'string') {
          setWalletAddress(accounts[0]);
          if (contract) {
            const time = await contract.getTime(accounts[0]);
            setPreviousTime(Number(time));
          }
        } else {
          console.error('No valid accounts found');
          alert('No valid wallet address found. Please ensure MetaMask is connected.');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask to play with blockchain features.');
    }
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0 && !gameWon && !gameLost) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameLost(true);
            setShowAllWords(true);
            highlightUnfoundWords();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, gameWon, gameLost]);

  // Save time to blockchain when game is won
  useEffect(() => {
    const saveTimeToBlockchain = async () => {
      if (gameWon && contract && walletAddress) {
        try {
          const completionTime = GAME_DURATION - timeLeft;
          const tx = await contract.saveTime(completionTime);
          await tx.wait();
          console.log('Time saved to blockchain:', completionTime);
          setPreviousTime(completionTime);
        } catch (error) {
          console.error('Error saving time to blockchain:', error);
        }
      }
    };
    saveTimeToBlockchain();
  }, [gameWon, contract, walletAddress, timeLeft]);

  const highlightUnfoundWords = useCallback(() => {
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
  }, [grid, words]);

  const initializeGrid = () => {
    // Reset game states except grid and words
    setGameWon(false);
    setGameLost(false);
    setSelectedCells([]);
    setShowAllWords(false);
    setTimeLeft(GAME_DURATION);
    setTimerActive(false);
    setGameStarted(false);

    // Select 5 random words from the list
    const selectedWords = [...WORDS_LIST]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(word => word.toUpperCase());

    // Create empty grid with tracking for which cells are occupied
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

    const occupiedGrid: boolean[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));

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
          const tempOccupiedPositions: Position[] = [];
          
          // Check if positions are available and letters match where already occupied
          for (let i = 0; i < word.length; i++) {
            const checkRow = direction === 'vertical' ? row + i : row;
            const checkCol = direction === 'horizontal' ? col + i : col;
            
            if (occupiedGrid[checkRow][checkCol] && newGrid[checkRow][checkCol].letter !== word[i]) {
              fits = false;
              break;
            }
            tempOccupiedPositions.push({ row: checkRow, col: checkCol });
          }

          if (fits) {
            // Place the word
            for (let i = 0; i < word.length; i++) {
              const placeRow = direction === 'vertical' ? row + i : row;
              const placeCol = direction === 'horizontal' ? col + i : col;
              
              newGrid[placeRow][placeCol].letter = word[i];
              occupiedGrid[placeRow][placeCol] = true;
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

      if (!placed) {
        console.warn(`Failed to place word: ${word}`);
      }
    }

    // Fill remaining cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!occupiedGrid[row][col]) {
          newGrid[row][col].letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
      }
    }

    setGrid(newGrid);
    setWords(placedWords);
  };

  const handleStartGame = () => {
    if (!walletAddress) {
董事:       alert('Please connect your wallet to start the game.');
      return;
    }
    setGameStarted(true);
    setTimerActive(true);
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameWon || gameLost || !gameStarted) return;

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
          setTimerActive(false);
        }

        return;
      }
    }
  };

  const handleRestart = () => {
    initializeGrid();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                          ? 'bg-black hover:bg-gray-400'
                          : ''
                      }
                      ${!gameStarted && !cell.partOfFoundWord ? 'opacity-50' : ''}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={cell.partOfFoundWord || gameLost || gameWon || !gameStarted}
                  >
                    {cell.letter}
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-center gap-4">
              {!walletAddress ? (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </button>
              ) : !gameStarted ? (
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  onClick={handleStartGame}
                >
                  Start Game
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  onClick={() => {
                    setGameLost(true);
                    setShowAllWords(true);
                    setTimerActive(false);
                    highlightUnfoundWords();
                  }}
                  disabled={gameWon || gameLost}
                >
                  End Game
                </button>
              )}
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                onClick={handleRestart}
              >
                New Game
              </button>
            </div>
          </div>

          {/* Words Panel */}
          <div className="lg:w-64 bg-white p-4 rounded-lg shadow-lg">
            <div className="mb-4 text-center">
              <div className={`text-2xl font-bold ${
                timeLeft <= 10 && gameStarted ? 'text-red-600 animate-pulse' : 'text-blue-600'
              }`}>
                {gameStarted ? formatTime(timeLeft) : formatTime(GAME_DURATION)}
              </div>
            </div>

            {walletAddress && typeof walletAddress === 'string' && (
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">
                  Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                {previousTime !== null && previousTime > 0 && (
                  <p className="text-sm text-blue-600">
                    Previous Best: {formatTime(previousTime)}
                  </p>
                )}
              </div>
            )}

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
                      ? 'bg-purple-100 text-white'
                      : 'bg-black hover:bg-gray-200 hover:text-black'
                  }`}
                >
                  {word.text}
                </li>
              ))}
            </ul>

            {/* Game Status */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50">
              {!walletAddress && (
                <div className="text-center text-blue-600 font-bold">
                  Connect your wallet to play!
                </div>
              )}
              {walletAddress && !gameStarted && (
                <div className="text-center text-blue-600 font-bold">
                  Click "Start Game" to begin!
                </div>
              )}
              {gameWon && (
                <div className="text-center text-green-600 font-bold text-xl animate-bounce">
                  You Won! 🎉
                </div>
              )}
              {gameLost && (
                <div className="text-center text-red-600 font-bold text-xl">
                  You Lost ❌
                </div>
              )}
              {gameStarted && !gameWon && !gameLost && (
                <div className="text-center text-blue-600 font-bold">
                  {words.filter(w => w.found).length} / {words.length} words found
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-600">
              <p className="font-bold mb-1">How to play:</p>
              <p>1. Connect your wallet</p>
              <p>2. Click "Start Game" to begin</p>
              <p>3. Click adjacent letters to form words</p>
              <p>4. Found words will be highlighted in green</p>
              <p>5. Complete all words before time runs out!</p>
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