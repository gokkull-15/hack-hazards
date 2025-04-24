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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Snake Game</h1>
     
      <div className="mb-4 flex items-center gap-4">
        <div className="text-xl font-semibold text-gray-700">
          Score: <span className="text-green-600">{score}</span>
        </div>
        <div className="text-xl font-semibold text-gray-700">
          Highest: <span className="text-blue-600">{highestScore}</span>
        </div>
       
        {!gameStarted ? (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Start Game'}
          </button>
        ) : gameOver ? (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            Play Again
          </button>
        ) : null}

        {!walletConnected ? (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded">
            {shortenAddress(walletAddress)}
          </div>
        )}
      </div>

      <div
        className="relative bg-white border-2 border-gray-300 shadow-lg"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: '#f0fdf4'
        }}
      >
        {/* Game Over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">Game Over!</div>
          </div>
        )}

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
            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
            zIndex: 5
          }}
        >
          <div className="absolute w-1 h-1 bg-white rounded-full" style={{ top: '25%', left: '25%' }}></div>
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
                  width: 4,
                  height: 4,
                  top: '30%',
                  left: '30%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 4,
                  height: 4,
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
              style={style}
            >
              {eyes}
            </div>
          );
        })}
      </div>

      {/* Top Scores Table */}
      {topScores.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Top Scores</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topScores.map((playerScore, index) => (
                  <tr key={index} className={playerScore.player === walletAddress ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {playerScore.player === walletAddress ? 'You' : shortenAddress(playerScore.player)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{playerScore.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 text-gray-600">
        <p className="text-center">Use arrow keys or WASD to control the snake</p>
        <p className="text-center mt-2">Eat the red berries to grow longer</p>
        {walletConnected && (
          <p className="text-center mt-2 text-sm text-purple-600">
            Your high scores will be saved on the Monad blockchain!
          </p>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;