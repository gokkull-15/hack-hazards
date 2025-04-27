import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import IMG01 from '@/public/sprites/dinosaur.png';
import Web3 from 'web3';

interface Obstacle {
  id: number;
  x: number;
}

const DinoRun: React.FC = () => {
  const [dinoY, setDinoY] = useState<number>(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'lost' | 'won'>('idle');
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [web3, setWeb3] = useState<any>(null);
  const [networkError, setNetworkError] = useState<string>('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastObstacleSpawn = useRef<number>(0);

  const DINO_WIDTH = 50;
  const DINO_HEIGHT = 50;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_HEIGHT = 30;
  const JUMP_HEIGHT = 100;
  const GAME_DURATION = 30; // seconds
  const SPAWN_INTERVAL = 2000; // milliseconds
  
  // Monad testnet details
  const MONAD_CHAIN_ID = 10143;
  const MONAD_CHAIN_ID_HEX = '0x279f'; // 10143 in lowercase hex
  const MONAD_RPC_URL = "https://rpc.testnet.monad.xyz/";

  // Monad testnet contract details
  const contractAddress = "0xcaa579d44cfeb7d660d727590732abd66171ee2f"; // Replace with your deployed contract address
  const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timeScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "NewHighScore",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timeScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ScoreSubmitted",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getHighestScore",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
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
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerBestScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
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
      "name": "highestScore",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timeScore",
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
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerBestScores",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timeScore",
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
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_timeScore",
          "type": "uint256"
        }
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  // Function to check if we're on Monad testnet
  const checkNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) return false;
    
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      // Handle both numeric and hex chainId formats
      const chainId = parseInt(chainIdHex, 16);
      
      console.log("Current chain ID:", chainId);
      console.log("Chain ID hex:", chainIdHex);
      
      // Check if we're on Monad testnet (chainId 10143)
      return chainId === MONAD_CHAIN_ID || chainIdHex.toLowerCase() === MONAD_CHAIN_ID_HEX;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  };

  // Initialize Web3 and load high score on component mount
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          // Initialize web3 with the injected provider
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Check if already connected
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Check if we're on Monad testnet
            const isOnMonad = await checkNetwork();
            if (isOnMonad) {
              setNetworkError('');
              // If on Monad testnet, fetch high score
              try {
                await fetchHighScore(web3Instance, accounts[0]);
              } catch (fetchError) {
                console.error("Failed to fetch score:", fetchError);
              }
            } else {
              setNetworkError('Please switch to Monad testnet');
            }
          }
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', (chainId: string) => {
            console.log('Network changed to:', chainId);
            // Check if the new chain is Monad testnet
            const isMonad = parseInt(chainId, 16) === MONAD_CHAIN_ID || 
                            chainId.toLowerCase() === MONAD_CHAIN_ID_HEX;
            
            if (isMonad) {
              setNetworkError('');
              if (isConnected) {
                fetchHighScore(web3Instance, walletAddress);
              }
            } else {
              setNetworkError('Please switch to Monad testnet');
            }
          });
          
          // Listen for accounts changed
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              setIsConnected(false);
              setWalletAddress('');
            } else {
              setWalletAddress(accounts[0]);
              checkNetwork().then(isMonad => {
                if (isMonad && isConnected) {
                  fetchHighScore(web3Instance, accounts[0]);
                }
              });
            }
          });
          
        } catch (error) {
          console.error("Failed to initialize web3:", error);
        }
      } else {
        console.log("No Ethereum browser extension detected");
      }
    };

    initWeb3();

    // Local storage fallback for high score
    const savedHighScore = localStorage.getItem('dinoRunHighScore');
    if (savedHighScore) {
      setHighScore(parseFloat(savedHighScore));
    }
    
    // Cleanup event listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Add Monad network to MetaMask
  const addMonadNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: MONAD_CHAIN_ID_HEX,
            chainName: 'Monad Testnet',
            nativeCurrency: {
              name: 'Monad',
              symbol: 'MONAD',
              decimals: 18
            },
            rpcUrls: [MONAD_RPC_URL],
            blockExplorerUrls: ['https://explorer.testnet.monad.xyz/']
          }
        ]
      });
      return true;
    } catch (error) {
      console.error("Error adding Monad network:", error);
      return false;
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another compatible wallet!");
      return;
    }
    
    try {
      setNetworkError('');
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Update connection state
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      
      // Check if we're on Monad testnet
      const isOnMonad = await checkNetwork();
      
      if (!isOnMonad) {
        try {
          // Try to switch to Monad testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MONAD_CHAIN_ID_HEX }],
          });
          
          // Double-check we switched successfully
          const nowOnMonad = await checkNetwork();
          if (!nowOnMonad) {
            setNetworkError('Failed to switch to Monad testnet');
            return;
          }
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            const added = await addMonadNetwork();
            if (!added) {
              setNetworkError('Please add and switch to Monad testnet (Chain ID: 10143)');
              return;
            }
            
            // Try to switch again after adding
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MONAD_CHAIN_ID_HEX }],
              });
            } catch (error) {
              setNetworkError('Please manually switch to Monad testnet');
              return;
            }
          } else {
            console.error("Failed to switch network:", switchError);
            setNetworkError('Please manually switch to Monad testnet (Chain ID: 10143)');
            return;
          }
        }
      }
      
      // If we made it here, we're connected to Monad
      setNetworkError('');
      
      // Initialize web3 with direct RPC connection for reliability
      const web3Instance = new Web3(MONAD_RPC_URL);
      setWeb3(web3Instance);
      
      // Fetch the player's high score from the contract
      try {
        await fetchHighScore(web3Instance, accounts[0]);
      } catch (fetchError) {
        console.error("Error fetching score:", fetchError);
        // Continue anyway, will use localStorage score
      }
      
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setNetworkError('Failed to connect wallet. Please try again.');
    }
  };

  // Fetch high score from contract
  const fetchHighScore = async (web3Instance: any, address: string) => {
    try {
      // Set up a new web3 instance with direct RPC URL for reliability
      const directWeb3 = new Web3(MONAD_RPC_URL);
      const contract = new directWeb3.eth.Contract(contractABI, contractAddress);
      
      // Get player's best score
      const playerScore = await contract.methods.getPlayerBestScore(address).call();
      if (playerScore && parseInt(playerScore[0]) > 0) {
        // Convert from wei to seconds - assuming score is stored in wei units
        const scoreInSeconds = parseFloat(directWeb3.utils.fromWei(playerScore[0].toString(), 'ether'));
        setHighScore(scoreInSeconds);
        // Also update local storage as fallback
        localStorage.setItem('dinoRunHighScore', scoreInSeconds.toString());
      }
      
      // Get global high score (optional display)
      const globalHighScore = await contract.methods.getHighestScore().call();
      console.log("Global high score:", globalHighScore);
      
    } catch (error) {
      console.error("Error fetching high score:", error);
      throw error; // Re-throw to be handled by caller
    }
  };

  // Save high score to blockchain
  const saveHighScoreOnChain = async () => {
    if (!isConnected || timeElapsed <= 0) return;
    
    // Check network before submitting
    const isOnMonad = await checkNetwork();
    if (!isOnMonad) {
      setNetworkError('Please switch to Monad testnet before saving score');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Set up a direct contract instance for gas estimation
      const directWeb3 = new Web3(MONAD_RPC_URL);
      const contract = new directWeb3.eth.Contract(contractABI, contractAddress);
      
      // Convert time to wei (multiply by 10^18) to store as uint256
      const scoreInWei = directWeb3.utils.toWei(timeElapsed.toString(), 'ether');
      
      // Create the transaction data
      const data = contract.methods.submitScore(scoreInWei).encodeABI();
      
      // Get gas estimate (optional, can use fixed value)
      let gasEstimate;
      try {
        gasEstimate = await contract.methods.submitScore(scoreInWei).estimateGas({
          from: walletAddress
        });
        // Add some buffer
        gasEstimate = Math.floor(gasEstimate * 1.2);
      } catch (gasError) {
        console.warn("Gas estimation failed, using default:", gasError);
        gasEstimate = 300000; // Default gas limit
      }
      
      // Send the transaction via MetaMask
      const transactionParameters = {
        to: contractAddress,
        from: walletAddress,
        data: data,
        gas: directWeb3.utils.toHex(gasEstimate),
      };
      
      // Send transaction via wallet provider
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      console.log("Transaction sent:", txHash);
      setTransactionHash(txHash);
      
      // Update local storage as well
      localStorage.setItem('dinoRunHighScore', timeElapsed.toString());
      
    } catch (error) {
      console.error("Error saving high score:", error);
      alert("Failed to save score on blockchain. Your score is saved locally.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Dino jump
  const handleJump = () => {
    if (gameState !== 'playing' || dinoY > 0) return;
    setDinoY(JUMP_HEIGHT);
    setTimeout(() => setDinoY(0), 500); // Return to ground after 500ms
  };

  // Start game
  const startGame = () => {
    setDinoY(0);
    setObstacles([]);
    setGameState('playing');
    setTimeElapsed(0);
    lastObstacleSpawn.current = 0;
    setTransactionHash('');
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handleJump();
      if (e.key === ' ' && gameState === 'idle') startGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dinoY]);

  // Update high score when game ends
  useEffect(() => {
    if (gameState === 'lost' || gameState === 'won') {
      if (timeElapsed > highScore) {
        setHighScore(timeElapsed);
        localStorage.setItem('dinoRunHighScore', timeElapsed.toString());
        
        // If wallet is connected, save to blockchain
        if (isConnected) {
          checkNetwork().then(isMonad => {
            if (isMonad) {
              saveHighScoreOnChain();
            } else {
              setNetworkError('Please switch to Monad testnet to save score');
            }
          });
        }
      }
    }
  }, [gameState, timeElapsed, highScore, isConnected]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = (currentTime: number) => {
      // Update time elapsed
      setTimeElapsed((prev) => {
        const newTime = prev + 0.016; // Approx 60fps
        if (newTime >= GAME_DURATION) {
          setGameState('won');
          return prev;
        }
        return newTime;
      });

      // Spawn obstacles
      if (currentTime - lastObstacleSpawn.current > SPAWN_INTERVAL) {
        setObstacles((prev) => [
          ...prev,
          { id: Date.now(), x: 800 }, // Start at right edge
        ]);
        lastObstacleSpawn.current = currentTime;
      }

      // Move obstacles and check collisions
      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, x: obs.x - 5 })) // Move left
          .filter((obs) => {
            // Check collision
            if (
              obs.x < 100 + DINO_WIDTH &&
              obs.x + OBSTACLE_WIDTH > 100 &&
              dinoY < OBSTACLE_HEIGHT
            ) {
              setGameState('lost');
              return false;
            }
            return obs.x > -OBSTACLE_WIDTH; // Remove if off-screen
          })
      );

      animationFrameRef.current = requestAnimationFrame(updateGame);
    };

    animationFrameRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, dinoY]);

  // Restart game
  const restartGame = () => {
    setDinoY(0);
    setObstacles([]);
    setGameState('playing');
    setTimeElapsed(0);
    lastObstacleSpawn.current = 0;
    setTransactionHash('');
  };

  // Force network check
  const forceNetworkCheck = async () => {
    const isOnMonad = await checkNetwork();
    if (isOnMonad) {
      setNetworkError('');
      return true;
    } else {
      setNetworkError('Not on Monad testnet. Please switch networks.');
      return false;
    }
  };

  return (
    <div className="relative w-full max-w-[800px] h-[400px] mx-auto mt-10 rounded-lg shadow-xl overflow-hidden bg-gradient-to-b from-orange-100 to-orange-300 border-4 border-yellow-600">
      {/* Game Canvas */}
      <div ref={canvasRef} className="w-full h-full relative">
        {/* Background Ground */}
        <div className="absolute bottom-0 w-full h-16 bg-yellow-600" />

        {/* Score Display */}
        <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full shadow-md">
          <span className="text-lg font-bold text-gray-800">
            Time: {timeElapsed.toFixed(1)}s
          </span>
        </div>

        {/* High Score Display */}
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
          <span className="text-lg font-bold text-gray-800">
            Best: {highScore.toFixed(1)}s
          </span>
        </div>

        {/* Wallet Connection */}
        <div className="absolute top-16 right-4 bg-white px-3 py-1 rounded-full shadow-md">
          {isConnected ? (
            <div className="flex items-center">
              <span className="text-sm font-bold text-green-600">
                {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
              </span>
              <button 
                onClick={forceNetworkCheck}
                className="ml-2 text-xs bg-blue-100 px-1 py-0.5 rounded-full"
                title="Check network"
              >
                🔄
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Network Status Display */}
        {isConnected && (
          <div className={`absolute top-28 right-4 px-3 py-1 rounded-full shadow-md ${
            networkError ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <span className={`text-sm font-bold ${
              networkError ? 'text-red-600' : 'text-green-600'
            }`}>
              {networkError || 'Monad Testnet ✓'}
            </span>
          </div>
        )}

        {/* Dino */}
        <Image
          src={IMG01}
          alt="Dinosaur"
          width={DINO_WIDTH}
          height={DINO_HEIGHT}
          className="absolute bottom-16 left-[100px] transition-all duration-250"
          style={{ transform: `translateY(-${dinoY}px)` }}
        />

        {/* Obstacles (Cactus-like) */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className="absolute bottom-16 bg-green-800 w-[20px] h-[30px] rounded-t-md border-2 border-green-900"
            style={{ left: `${obs.x}px` }}
          />
        ))}

        {/* Idle Screen with Start Button */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center flex-col">
            <h1 className="text-4xl text-white font-extrabold mb-6 drop-shadow-lg">
              Dino Run
            </h1>
            {highScore > 0 && (
              <div className="text-2xl text-yellow-300 font-bold mb-4">
                Best Time: {highScore.toFixed(1)}s
              </div>
            )}
            
            {!isConnected && (
              <button
                onClick={connectWallet}
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold text-md hover:bg-blue-400 transition transform hover:scale-105 shadow-lg mb-4"
              >
                Connect Wallet
              </button>
            )}
            
            {isConnected && networkError && (
              <button
                onClick={() => window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: MONAD_CHAIN_ID_HEX }]
                }).then(() => forceNetworkCheck())}
                className="px-6 py-2 bg-red-500 text-white rounded-full font-bold text-md hover:bg-red-400 transition transform hover:scale-105 shadow-lg mb-4"
              >
                Switch to Monad
              </button>
            )}
            
            <button
              onClick={startGame}
              className="px-8 py-3 bg-yellow-500 text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg"
            >
              Start Game
            </button>
            <p className="text-white mt-4">Press Space or click to start</p>
            <p className="text-gray-300 mt-2 text-sm">Connect wallet to save scores on-chain</p>
          </div>
        )}

        {/* Game Over / Win Screen */}
        {(gameState === 'lost' || gameState === 'won') && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center flex-col">
            <h1 className="text-5xl text-white font-extrabold mb-6 drop-shadow-lg">
              {gameState === 'lost' ? 'You Lost ❌' : 'You Won 🎉'}
            </h1>
            <div className="text-2xl text-white mb-2">Your Time: {timeElapsed.toFixed(1)}s</div>
            {timeElapsed >= highScore && (
              <div className="text-2xl text-yellow-300 font-bold mb-4">
                New Best Time! 🏆
              </div>
            )}
            
            {/* Blockchain status */}
            {isConnected && timeElapsed > 0 && timeElapsed >= highScore && (
              <div className="text-md text-gray-300 mb-4">
                {networkError ? (
                  <div className="flex items-center">
                    <span className="text-red-400">{networkError}</span>
                    <button 
                      onClick={() => window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: MONAD_CHAIN_ID_HEX }]
                      }).then(() => {
                        forceNetworkCheck();
                        saveHighScoreOnChain();
                      })}
                      className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full"
                    >
                      Switch & Save
                    </button>
                  </div>
                ) : isSubmitting ? (
                  <span>Saving score to blockchain...</span>
                ) : transactionHash ? (
                  <div>
                    <span>Score saved on-chain! ✅</span>
                    <a 
                      href={`https://explorer.testnet.monad.xyz/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 ml-2 hover:underline"
                    >
                      View Transaction
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={saveHighScoreOnChain}
                    className="px-4 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-400"
                  >
                    Save Score On-Chain
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-yellow-500 text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DinoRun;