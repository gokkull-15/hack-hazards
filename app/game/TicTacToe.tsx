import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

type Player = 'X' | 'O';
type BoardState = (Player | null)[];

// Define contract details directly in the component
const CONTRACT_ADDRESS = "0xa85726d726825cfc8a5e94fa942ab3a852e9d16c"; // Replace with your actual contract address after deployment
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721IncorrectOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721InsufficientApproval",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOperator",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "ERC721InvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC721InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC721InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ERC721NonexistentToken",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "mintWinnerNFT",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "approved",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_fromTokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_toTokenId",
				"type": "uint256"
			}
		],
		"name": "BatchMetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "MetadataUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "baseURI",
				"type": "string"
			}
		],
		"name": "setBaseURI",
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
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "balanceOf",
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
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "getApproved",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "operator",
				"type": "address"
			}
		],
		"name": "isApprovedForAll",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
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
		"name": "lastWinTimestamp",
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
		"name": "MINT_COOLDOWN",
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
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceId",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "tokenURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const TicTacToe = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setWalletConnected(true);
        
        // Check if we're on Monad testnet (10143)
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(10143)) {
          // Try to switch to Monad testnet
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2797' }], // 10143 in hex
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x2797',
                    chainName: 'Monad Testnet',
                    nativeCurrency: {
                      name: 'Monad',
                      symbol: 'MONAD',
                      decimals: 18
                    },
                    rpcUrls: ['https://rpc.monad.xyz/testnet'],
                    blockExplorerUrls: ['https://explorer.monad.xyz/testnet']
                  },
                ],
              });
            }
          }
        }
      } else {
        alert("Please install MetaMask or another Ethereum wallet provider");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  // Mint NFT function
  const mintNFT = async () => {
    if (!walletConnected || !walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsMinting(true);
      setMintSuccess(false);
      setMintError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Call the mint function
      const tx = await contract.mintWinnerNFT(walletAddress);
      await tx.wait();
      
      setMintSuccess(true);
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setMintError(error.message || "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  // Check for winner after each move
  useEffect(() => {
    const gameWinner = calculateWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      setIsGameOver(true);
      return; // Exit early if game is over
    } else if (!board.includes(null)) {
      setWinner('draw');
      setIsGameOver(true);
      return; // Exit early if game is over
    }

    // Bot's turn if game isn't over and it's O's turn
    if (currentPlayer === 'O') {
      makeBotMove();
    }
  }, [board, currentPlayer]); // Removed isGameOver from dependencies

  // Auto-mint when player wins
  useEffect(() => {
    if (winner === 'X' && walletConnected) {
      mintNFT();
    }
  }, [winner, walletConnected]);

  const calculateWinner = (squares: BoardState): Player | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] as Player;
      }
    }
    return null;
  };

  const makeBotMove = () => {
    // Don't make a move if game is already over
    if (isGameOver) return;

    const emptyIndices = board
      .map((cell, index) => (cell === null ? index : null))
      .filter((index): index is number => index !== null);

    if (emptyIndices.length === 0) return;

    // 70% chance to make a random move instead of a winning move
    if (Math.random() < 0.7) {
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      setTimeout(() => handleCellClick(randomIndex, true), 500);
      return;
    }

    // Try to find a winning move for the bot
    for (const index of emptyIndices) {
      const newBoard = [...board];
      newBoard[index] = 'O';
      if (calculateWinner(newBoard) === 'O') {
        setTimeout(() => handleCellClick(index, true), 500);
        return;
      }
    }

    // If no winning move, make a random move
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    setTimeout(() => handleCellClick(randomIndex, true), 500);
  };

  const handleCellClick = (index: number, isBotMove = false) => {
    // Ignore clicks if game is over, cell is occupied, or it's bot's turn and not a bot move
    if (isGameOver || board[index] || (!isBotMove && currentPlayer === 'O')) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsGameOver(false);
    setMintSuccess(false);
    setMintError(null);
  };

  const renderCell = (index: number) => {
    return (
      <button
        key={index}
        className={`w-16 h-16 flex items-center justify-center text-3xl font-bold border border-gray-400 
          ${board[index] === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${!board[index] && !isGameOver && currentPlayer === 'X' ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
        onClick={() => handleCellClick(index)}
        disabled={!!board[index] || isGameOver || currentPlayer === 'O'}
      >
        {board[index]}
      </button>
    );
  };

  return (
	<div className="flex flex-col items-center justify-center min-h-[85vh] bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
	  <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-purple-100">
		<span className="text-4xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Tic Tac Toe</span>
		
		{!walletConnected ? (
		  <button
			onClick={connectWallet}
			className="w-full px-6 py-3 mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
		  >
			Connect Wallet
		  </button>
		) : (
		  <div className="mb-6 text-center">
			<span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 font-medium">
			  <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse"></span>
			  {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : ''}
			</span>
		  </div>
		)}
		
		<div className="mb-6 text-center">
		  {!isGameOver ? (
			<span className={`text-xl font-bold ${currentPlayer === 'X' ? 'text-indigo-600' : 'text-purple-600'}`}>
			  {currentPlayer === 'X' ? 'Your turn (X)' : 
				<div className="flex items-center justify-center">
				  <span>Bot is thinking</span>
				  <span className="flex ml-2">
					<span className="animate-bounce mx-0.5 h-1.5 w-1.5 rounded-full bg-purple-600"></span>
					<span className="animate-bounce mx-0.5 delay-75 h-1.5 w-1.5 rounded-full bg-purple-600"></span>
					<span className="animate-bounce mx-0.5 delay-150 h-1.5 w-1.5 rounded-full bg-purple-600"></span>
				  </span>
				</div>
			  }
			</span>
		  ) : (
			<div className={`text-xl font-bold ${winner === 'X' ? 'text-green-600' : winner === 'O' ? 'text-red-600' : 'text-yellow-600'} p-2 rounded-lg ${winner === 'X' ? 'bg-green-50' : winner === 'O' ? 'bg-red-50' : 'bg-yellow-50'}`}>
			  {winner === 'X' ? 'You won 🎉' : winner === 'O' ? 'You lost ❌' : 'It\'s a draw 🤝'}
			</div>
		  )}
		</div>
  
		{/* Reduced grid size here */}
		<div className="grid grid-cols-3 gap-2 mb-6 w-64 mx-auto">
		  {Array(9).fill(null).map((_, index) => {
			return (
			  <div 
				key={index} 
				onClick={() => handleCellClick(index)} 
				className="aspect-square bg-indigo-50 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer shadow-sm hover:shadow-md transition-shadow border-2 border-indigo-100 hover:border-indigo-300"
			  >
				{board[index] && (
				  <span className={board[index] === 'X' ? 'text-indigo-600' : 'text-purple-600'}>
					{board[index]}
				  </span>
				)}
			  </div>
			);
		  })}
		</div>
  
		{winner === 'X' && (
		  <div className="mb-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50 shadow-inner">
			{isMinting ? (
			  <div className="flex items-center justify-center text-blue-600">
				<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Minting your winner NFT...
			  </div>
			) : mintSuccess ? (
			  <div className="flex items-center justify-center text-green-600 font-semibold">
				<svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
				</svg>
				NFT successfully minted to your wallet! 🎉
			  </div>
			) : mintError ? (
			  <div className="text-center">
				<p className="text-red-600 mb-3">Error: {mintError}</p>
				<button
				  onClick={mintNFT}
				  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md"
				>
				  Try Again
				</button>
			  </div>
			) : (
			  <div className="flex items-center justify-center text-indigo-600">
				<svg className="animate-pulse mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd"></path>
				</svg>
				Preparing to mint your winner NFT...
			  </div>
			)}
		  </div>
		)}
  
		<button
		  onClick={resetGame}
		  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
		>
		  Restart Game
		</button>
	  </div>
	</div>
  );
};

export default TicTacToe;