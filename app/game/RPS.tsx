import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

type Choice = 'rock' | 'paper' | 'scissors' | null;
type GameResult = 'win' | 'lose' | 'draw' | null;

export default function RockPaperScissor() {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [botChoice, setBotChoice] = useState<Choice>(null);
  const [result, setResult] = useState<GameResult>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');

  const choices: Choice[] = ['rock', 'paper', 'scissors'];

  // Replace with your deployed contract address
  const contractAddress = "0xb58af128c503ac14dd84717898fbf5f81be8c65c";

  // Replace with your contract ABI
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "playerScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "botScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        }
      ],
      "name": "storeScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "gameIds",
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
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getGameIds",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
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
          "name": "gameId",
          "type": "uint256"
        }
      ],
      "name": "getScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "playerScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "botScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "round",
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
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "scores",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "playerScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "botScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "round",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const determineWinner = (player: Choice, bot: Choice): GameResult => {
    if (player === bot) return 'draw';

    if (
      (player === 'rock' && bot === 'scissors') ||
      (player === 'paper' && bot === 'rock') ||
      (player === 'scissors' && bot === 'paper')
    ) {
      return 'win';
    }

    return 'lose';
  };

  const handlePlayerChoice = (choice: Choice) => {
    if (gameOver) return;

    const botRandomChoice = choices[Math.floor(Math.random() * choices.length)];
    const roundResult = determineWinner(choice, botRandomChoice);

    setPlayerChoice(choice);
    setBotChoice(botRandomChoice);
    setResult(roundResult);

    if (roundResult === 'win') {
      setPlayerScore(prev => prev + 1);
    } else if (roundResult === 'lose') {
      setBotScore(prev => prev + 1);
    }

    setRound(prev => prev + 1);
  };

  const storeScoreOnChain = async () => {
    if (!window.ethereum) {
      setTxStatus('Please install MetaMask');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const gameId = Date.now(); // Use timestamp as unique game ID
      const tx = await contract.storeScore(playerScore, botScore, round, gameId);
      setTxStatus('Transaction pending...');
      await tx.wait();
      setTxStatus('Score stored on-chain! Tx: ' + tx.hash);
    } catch (error) {
      console.error(error);
      setTxStatus('Error storing score: ' + (error as Error).message);
    }
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setBotChoice(null);
    setResult(null);
    setPlayerScore(0);
    setBotScore(0);
    setRound(0);
    setGameOver(false);
    setGameResult('');
    setTxStatus('');
  };

  useEffect(() => {
    if (round === 10) {
      setGameOver(true);
      if (playerScore > botScore) {
        setGameResult('You Won 🎉');
      } else if (botScore > playerScore) {
        setGameResult('You Lost ❌');
      } else {
        setGameResult("It's a Draw 🤝");
      }
      storeScoreOnChain(); // Store score on-chain when game ends
    }
  }, [round, playerScore, botScore]);

  const getEmoji = (choice: Choice) => {
    switch (choice) {
      case 'rock':
        return '✊';
      case 'paper':
        return '✋';
      case 'scissors':
        return '✌️';
      default:
        return '';
    }
  };

  const getResultColor = () => {
    if (result === 'win') return 'text-green-500';
    if (result === 'lose') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 border border-indigo-100">
        <h1 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">Rock Paper Scissors</h1>
  
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-2 mb-4 bg-blue-100 rounded-full text-blue-800 font-semibold">
            Round: {round}/10
          </div>
          
          <div className="flex justify-center gap-10 mb-4">
            <div className="text-center px-6 py-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg shadow-sm">
              <p className="font-bold text-blue-800 mb-1">You</p>
              <p className="text-3xl font-bold text-blue-600">{playerScore}</p>
            </div>
            <div className="text-center px-6 py-3 bg-gradient-to-b from-indigo-50 to-indigo-100 rounded-lg shadow-sm">
              <p className="font-bold text-indigo-800 mb-1">Bot</p>
              <p className="text-3xl font-bold text-indigo-600">{botScore}</p>
            </div>
          </div>
        </div>
  
        {!gameOver ? (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {choices.map(choice => (
              <button
                key={choice}
                onClick={() => handlePlayerChoice(choice)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg text-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md flex items-center"
              >
                <span className="text-2xl mr-2">{getEmoji(choice)}</span> 
                <span>{choice.charAt(0).toUpperCase() + choice.slice(1)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-8 text-center">
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md"
            >
              Restart Game
            </button>
          </div>
        )}
  
        {playerChoice && botChoice && (
          <div className="mb-8 p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-inner">
            <div className="flex justify-center gap-16 mb-6">
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-2">Your choice</p>
                <div className="text-5xl mb-2 bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-inner">
                  {getEmoji(playerChoice)}
                </div>
                <p className="text-blue-600 font-medium">{playerChoice}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-2">Bot's choice</p>
                <div className="text-5xl mb-2 bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-inner">
                  {getEmoji(botChoice)}
                </div>
                <p className="text-indigo-600 font-medium">{botChoice}</p>
              </div>
            </div>
            {result && (
              <div className={`text-2xl font-bold p-2 text-center rounded-lg ${
                result === 'win' ? 'bg-green-100 text-green-600' :
                result === 'lose' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {result === 'win' ? '🎉 You win!' : result === 'lose' ? '❌ You lose!' : '🤝 Draw!'}
              </div>
            )}
          </div>
        )}
  
        {gameOver && (
          <div className="text-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <h2 className={`text-3xl font-bold mb-4 ${
              playerScore > botScore ? 'text-green-600' :
              playerScore < botScore ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {gameResult}
            </h2>
            <p className="text-xl text-gray-700 font-semibold mb-4">
              Final Score: 
              <span className="text-blue-600 ml-2">{playerScore}</span>
              <span className="mx-2">-</span>
              <span className="text-indigo-600">{botScore}</span>
            </p>
            {txStatus && (
              <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                <p className="text-blue-700">{txStatus}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}