import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Smart contract ABI
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_completionTime",
				"type": "uint256"
			}
		],
		"name": "recordScore",
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
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ScoreRecorded",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getLeaderboard",
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
						"name": "completionTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct TypingAdventure.PlayerScore[]",
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
				"name": "_player",
				"type": "address"
			}
		],
		"name": "getPlayerBestTime",
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
		"name": "leaderboard",
		"outputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "completionTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0xb9831cd3a4991a8cc4276c60c5e4ebf4d5923632";

const WORDS = [
  'react', 'typescript', 'nextjs', 'tailwind', 'javascript',
  'adventure', 'keyboard', 'developer', 'coding', 'challenge',
  'interface', 'component', 'state', 'hooks', 'effect'
];

export default function TypingAdventure() {
  const [gameStatus, setGameStatus] = useState('idle');
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  // Initialize ethers provider and contract
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // Connect to wallet
  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await newProvider.send("eth_requestAccounts", []);
        const chainId = await newProvider.getNetwork().then(net => net.chainId);

        if (Number(chainId) !== 10143) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x27cf' }], // 10143 in hex
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x27cf',
                  chainName: 'Monad Testnet',
                  rpcUrls: ['https://testnet-rpc.monad.xyz'],
                  nativeCurrency: {
                    name: 'MON',
                    symbol: 'MON',
                    decimals: 18
                  }
                }]
              });
            } else {
              throw switchError;
            }
          }
        }

        setProvider(newProvider);
        setAccount(accounts[0]);
        setWalletConnected(true);

        const signer = await newProvider.getSigner();
        const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(newContract);

        // Fetch player's best time
        const best = await newContract.getPlayerBestTime(accounts[0]);
        setBestTime(Number(best));

        // Fetch leaderboard
        const lb = await newContract.getLeaderboard();
        setLeaderboard(lb.map(score => ({
          player: score.player,
          completionTime: Number(score.completionTime),
          timestamp: Number(score.timestamp)
        })));
      } catch (err) {
        setError("Failed to connect wallet: " + err.message);
      }
    } else {
      setError("Please install MetaMask");
    }
  }, []);

  // Generate 5 random words
  const generateWords = useCallback(() => {
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    setWords(shuffled.slice(0, 5));
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    generateWords();
    setGameStatus('playing');
    setInput('');
    setTimeLeft(20);
    setTimerActive(true);
    setStartTime(Date.now());
    setCompletionTime(null);
    setError(null);
  }, [generateWords]);

  // Check if the input matches all words
  const checkInput = useCallback(() => {
    const typedWords = input.trim().split(/\s+/);
    const isCorrect = words.every((word, index) => typedWords[index] === word);
    
    if (isCorrect && typedWords.length === words.length) {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000); // Time in seconds
      setCompletionTime(timeTaken);
      setGameStatus('won');
      setTimerActive(false);
    }
  }, [input, words, startTime]);

  // Submit score to blockchain
  const submitScore = useCallback(async () => {
    if (!contract || !completionTime) return;
    try {
      const tx = await contract.recordScore(completionTime);
      await tx.wait();
      setError(null);

      // Update best time
      const best = await contract.getPlayerBestTime(account);
      setBestTime(Number(best));

      // Update leaderboard
      const lb = await contract.getLeaderboard();
      setLeaderboard(lb.map(score => ({
        player: score.player,
        completionTime: Number(score.completionTime),
        timestamp: Number(score.timestamp)
      })));
    } catch (err) {
      setError("Failed to submit score: " + err.message);
    }
  }, [contract, completionTime, account]);

  // Timer effect
  useEffect(() => {
    let timer;
    
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameStatus === 'playing') {
      setGameStatus('lost');
      setTimerActive(false);
    }
    
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, gameStatus]);

  // Check input whenever it changes
  useEffect(() => {
    if (gameStatus === 'playing') {
      checkInput();
    }
  }, [input, gameStatus, checkInput]);

  // Auto-submit score when game is won
  useEffect(() => {
    if (gameStatus === 'won' && completionTime && walletConnected) {
      submitScore();
    }
  }, [gameStatus, completionTime, walletConnected, submitScore]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Typing Adventure</h1>
        
        {!walletConnected && (
          <div className="text-center mb-6">
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 mb-4">
            {error}
          </div>
        )}

        {walletConnected && (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">Wallet: {account.slice(0, 6)}...{account.slice(-4)}</p>
              {bestTime > 0 && (
                <p className="text-sm text-gray-600">Best Time: {bestTime}s</p>
              )}
            </div>

            {gameStatus === 'idle' && (
              <div className="text-center">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Game
                </button>
              </div>
            )}

            {(gameStatus === 'playing' || gameStatus === 'won' || gameStatus === 'lost') && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Time left:</h2>
                    <span className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg font-medium text-gray-800 text-center">
                      {words.join(' ')}
                    </p>
                  </div>
                </div>

                {gameStatus === 'playing' && (
                  <div className="mb-6">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type the words here..."
                      autoFocus
                    />
                  </div>
                )}

                {(gameStatus === 'won' || gameStatus === 'lost') && (
                  <div className={`text-center py-6 rounded-lg mb-6 ${gameStatus === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p className="text-2xl font-bold mb-4">
                      {gameStatus === 'won' ? `You won 🎉 Time: ${completionTime}s` : 'You lost ❌'}
                    </p>
                    <button
                      onClick={startGame}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </>
            )}

            {leaderboard.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Leaderboard</h2>
                <ul className="bg-gray-50 p-4 rounded-lg">
                  {leaderboard
                    .sort((a, b) => a.completionTime - b.completionTime)
                    .slice(0, 5)
                    .map((score, index) => (
                      <li key={index} className="text-gray-800 mb-2">
                        {score.player.slice(0, 6)}...{score.player.slice(-4)}: {score.completionTime}s
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}