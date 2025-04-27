import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 250;

// Replace with your deployed contract address
const CONTRACT_ADDRESS = '0xe940a67c83a9b9fdce85af250a1dabb3c5b8f38a';
const CONTRACT_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
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
          "name": "score",
          "type": "uint256"
        }
      ],
      "name": "ScoreSubmitted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        }
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getHighScore",
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
      "inputs": [],
      "name": "getTopScores",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "score",
              "type": "uint256"
            }
          ],
          "internalType": "struct SnakeGame.PlayerScore[]",
          "name": "",
          "type": "tuple[]"
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
      "name": "highScores",
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
      "inputs": [],
      "name": "MAX_TOP_SCORES",
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "topScores",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [topScores, setTopScores] = useState<{player: string, score: number}[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Initialize provider and contract
  const getProvider = () => {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  const getContract = async () => {
    const provider = getProvider();
    if (!provider) return null;
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to connect your wallet!');
      return;
    }
  
    try {
      setLoading(true);
      const provider = getProvider();
      if (!provider) return;
  
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
  
      // Switch to Monad testnet if not already on it
      const chainId = await provider.send('eth_chainId', []);
      if (chainId !== '0x279f') { // 10143 in hex
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279f' }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x279f',
                  chainName: 'Monad Testnet',
                  nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MON',
                    decimals: 18,
                  },
                  rpcUrls: ['https://testnet-rpc.monad.xyz/'],
                  blockExplorerUrls: ['https://testnet-explorer.monad.xyz/'],
                },
              ],
            });
          }
        }
      }
  
      // Load high score from contract
      const contract = await getContract();
      if (contract) {
        const highScore = await contract.getHighScore(accounts[0]);
        setHighestScore(Number(highScore));
        
        // Load top scores
        const scores = await contract.getTopScores();
        setTopScores(scores.map((s: any) => ({
          player: s.player,
          score: Number(s.score)
        })));
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Load highest score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighestScore');
    if (savedHighScore) {
      setHighestScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    return { x, y };
  }, []);

  // Check if position is occupied by snake
  const isPositionOccupied = useCallback(
    (pos: Position): boolean => {
      return snake.some((segment) => segment.x === pos.x && segment.y === pos.y);
    },
    [snake]
  );

  // Place food in a valid position
  const placeFood = useCallback(() => {
    let newFood = generateFood();
    while (isPositionOccupied(newFood)) {
      newFood = generateFood();
    }
    setFood(newFood);
  }, [generateFood, isPositionOccupied]);

  // Submit score to blockchain
  const submitScoreToBlockchain = async (score: number) => {
    if (!walletConnected) return;
    
    try {
      setLoading(true);
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.submitScore(walletAddress, score);
      await tx.wait();

      // Refresh high score and top scores
      const highScore = await contract.getHighScore(walletAddress);
      setHighestScore(Number(highScore));
      
      const scores = await contract.getTopScores();
      setTopScores(scores.map((s: any) => ({
        player: s.player,
        score: Number(s.score)
      })));
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score to blockchain');
    } finally {
      setLoading(false);
    }
  };

  // Reset game state
  const resetGame = useCallback(() => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]);
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    placeFood();
  }, [placeFood]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver, gameStarted]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver) return;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

      // Move head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        if (score > highestScore) {
          const newHighScore = score;
          setHighestScore(newHighScore);
          localStorage.setItem('snakeHighestScore', newHighScore.toString());
          if (walletConnected) {
            submitScoreToBlockchain(newHighScore);
          }
        }
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        if (score > highestScore) {
          const newHighScore = score;
          setHighestScore(newHighScore);
          localStorage.setItem('snakeHighestScore', newHighScore.toString());
          if (walletConnected) {
            submitScoreToBlockchain(newHighScore);
          }
        }
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        placeFood();

        // Increase speed every 5 points
        if (newScore > 0 && newScore % 5 === 0) {
          setSpeed((prev) => Math.max(prev - 10, 50));
        }

        return newSnake;
      }

      // Remove tail if no food eaten
      newSnake.pop();
      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, placeFood, score, highestScore, walletConnected]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      clearInterval(gameLoopRef.current);
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, moveSnake, speed]);

  // Start game handler
  const startGame = () => {
    resetGame();
    setGameStarted(true);
  };

  // Calculate snake segment styles for more realistic appearance
  const getSnakeSegmentStyle = (index: number, segment: Position, nextSegment?: Position) => {
    const isHead = index === 0;
    const isTail = index === snake.length - 1;
    const segmentSize = CELL_SIZE - 2;

    // Head style
    if (isHead) {
      return {
        width: segmentSize,
        height: segmentSize,
        left: segment.x * CELL_SIZE + 1,
        top: segment.y * CELL_SIZE + 1,
        borderRadius: '50%',
        background: '#4d7c0f',
        border: '2px solid #3f6212',
        zIndex: 10,
        boxShadow: '0 0 5px rgba(0,0,0,0.3)'
      };
    }

    // Tail style
    if (isTail) {
      return {
        width: segmentSize - 4,
        height: segmentSize - 4,
        left: segment.x * CELL_SIZE + 3,
        top: segment.y * CELL_SIZE + 3,
        borderRadius: '50%',
        background: '#65a30d',
        border: '1px solid #4d7c0f',
        zIndex: 1
      };
    }

    // Body style - tapered effect
    const sizeReduction = Math.min(4, index * 0.5);
    const bodySize = segmentSize - sizeReduction;
    const offset = (segmentSize - bodySize) / 2;

    // Determine curve direction based on next segment position
    let borderRadius = '30%';
    if (nextSegment) {
      if (segment.x < nextSegment.x || segment.x > nextSegment.x) {
        borderRadius = '50% 30% 30% 50%';
      } else if (segment.y < nextSegment.y || segment.y > nextSegment.y) {
        borderRadius = '30% 50% 50% 30%';
      }
    }

    return {
      width: bodySize,
      height: bodySize,
      left: segment.x * CELL_SIZE + offset,
      top: segment.y * CELL_SIZE + offset,
      borderRadius,
      background: '#65a30d',
      border: '1px solid #4d7c0f',
      zIndex: snake.length - index
    };
  };

  // Shorten wallet address for display
  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 border border-green-100">
        <h1 className="text-4xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700">
          Snake Game
        </h1>
        
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <div className="px-5 py-2 bg-gradient-to-b from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200">
            <div className="text-xl font-semibold text-gray-700">
              Score: <span className="text-green-600 font-bold">{score}</span>
            </div>
          </div>
          
          <div className="px-5 py-2 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200">
            <div className="text-xl font-semibold text-gray-700">
              Highest: <span className="text-blue-600 font-bold">{highestScore}</span>
            </div>
          </div>
          
          {!gameStarted ? (
            <button
              onClick={startGame}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-70 disabled:transform-none disabled:hover:translate-y-0"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : 'Start Game'}
            </button>
          ) : gameOver ? (
            <button
              onClick={startGame}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-70 disabled:transform-none disabled:hover:translate-y-0"
              disabled={loading}
            >
              Play Again
            </button>
          ) : null}
  
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-70 disabled:transform-none disabled:hover:translate-y-0"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                  Connect Wallet
                </span>
              )}
            </button>
          ) : (
            <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full border border-purple-200 shadow-sm font-medium flex items-center">
              <span className="w-2 h-2 mr-2 rounded-full bg-purple-500 animate-pulse"></span>
              {shortenAddress(walletAddress)}
            </div>
          )}
        </div>
  
        <div className="flex justify-center">
          <div
            className="relative rounded-lg border-4 border-green-300 shadow-lg overflow-hidden"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
              background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Game Over overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                <div className="text-white text-3xl font-bold mb-4">Game Over!</div>
                <div className="text-white text-xl">Final Score: {score}</div>
              </div>
            )}
  
            {/* Grid lines for better visualization */}
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'repeating-linear-gradient(to right, #00000008 0px, #00000008 1px, transparent 1px, transparent ' + CELL_SIZE + 'px), repeating-linear-gradient(to bottom, #00000008 0px, #00000008 1px, transparent 1px, transparent ' + CELL_SIZE + 'px)',
                backgroundSize: CELL_SIZE + 'px ' + CELL_SIZE + 'px',
                zIndex: 1
              }}
            ></div>
  
            {/* Food - realistic berry */}
            <div
              className="absolute rounded-full"
              style={{
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                background: 'radial-gradient(circle at 30% 30%, #ef4444, #b91c1c)',
                border: '1px solid #991b1b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 10
              }}
            >
              <div className="absolute w-2 h-2 bg-white rounded-full opacity-70" style={{ top: '25%', left: '25%' }}></div>
              <div className="absolute w-1 h-3 bg-green-800 rounded-full" style={{ top: '-2px', left: '50%', transform: 'translateX(-50%) rotate(10deg)' }}></div>
            </div>
  
            {/* Snake - realistic design */}
            {snake.map((segment, index) => {
              const nextSegment = index < snake.length - 1 ? snake[index + 1] : undefined;
              const style = getSnakeSegmentStyle(index, segment, nextSegment);
              
              // Add eyes to the head
              const eyes = index === 0 ? (
                <>
                  <div
                    className="absolute bg-white rounded-full"
                    style={{
                      width: 5,
                      height: 5,
                      top: '30%',
                      left: '30%',
                      boxShadow: 'inset 0 0 2px #000',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  <div
                    className="absolute bg-white rounded-full"
                    style={{
                      width: 5,
                      height: 5,
                      top: '30%',
                      left: '70%',
                      boxShadow: 'inset 0 0 2px #000',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  <div
                    className="absolute bg-black rounded-full"
                    style={{
                      width: 2,
                      height: 2,
                      top: '30%',
                      left: '30%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  <div
                    className="absolute bg-black rounded-full"
                    style={{
                      width: 2,
                      height: 2,
                      top: '30%',
                      left: '70%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </>
              ) : null;
  
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className="absolute"
                  style={{
                    ...style,
                    zIndex: 5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {eyes}
                </div>
              );
            })}
          </div>
        </div>
  
        {/* Controls Hint */}
        <div className="mt-6 flex justify-center">
          <div className="grid grid-cols-3 gap-2 w-28">
            <div></div>
            <button className="flex items-center justify-center h-10 w-10 bg-gray-200 rounded-lg text-gray-700 font-bold shadow hover:bg-gray-300 focus:outline-none">↑</button>
            <div></div>
            <button className="flex items-center justify-center h-10 w-10 bg-gray-200 rounded-lg text-gray-700 font-bold shadow hover:bg-gray-300 focus:outline-none">←</button>
            <button className="flex items-center justify-center h-10 w-10 bg-gray-200 rounded-lg text-gray-700 font-bold shadow hover:bg-gray-300 focus:outline-none">↓</button>
            <button className="flex items-center justify-center h-10 w-10 bg-gray-200 rounded-lg text-gray-700 font-bold shadow hover:bg-gray-300 focus:outline-none">→</button>
          </div>
        </div>
  
        {/* Top Scores Table */}
        {topScores.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="text-xl font-semibold mb-3 text-gray-700 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8l-3.293-3.293A1 1 0 0112 4z" clipRule="evenodd"></path>
              </svg>
              Top Scores
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-green-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-100 to-green-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black divide-y divide-gray-200">
                  {topScores.map((playerScore, index) => (
                    <tr 
                      key={index} 
                      className={`${playerScore.player === walletAddress ? 'bg-blue-50' : index % 2 === 0 ? 'bg-gray-50' : ''} hover:bg-gray-100 transition-colors`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {index + 1 <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            'bg-yellow-600 text-yellow-100'
                          } font-bold text-sm`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {playerScore.player === walletAddress ? (
                          <span className="text-blue-600 font-semibold">You</span>
                        ) : shortenAddress(playerScore.player)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-700">{playerScore.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  
        <div className="mt-6 text-gray-600 bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            How to Play
          </h3>
          <p className="text-center">Use <span className="font-semibold">arrow keys</span> or <span className="font-semibold">WASD</span> to control the snake</p>
          <p className="text-center mt-2">Eat the red berries to grow longer</p>
          {walletConnected && (
            <p className="text-center mt-2 text-sm text-purple-600 bg-purple-50 p-2 rounded border border-purple-100">
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Your high scores will be saved on the Monad blockchain!
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;