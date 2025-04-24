import { useState, useEffect } from 'react';

type Player = 'X' | 'O';
type BoardState = (Player | null)[];

const TicTacToe = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Check for winner after each move
  useEffect(() => {
    const gameWinner = calculateWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      setIsGameOver(true);
    } else if (!board.includes(null)) {
      setWinner('draw');
      setIsGameOver(true);
    }

    // Bot's turn if game isn't over and it's O's turn
    if (!isGameOver && currentPlayer === 'O') {
      makeBotMove();
    }
  }, [board, currentPlayer, isGameOver]);

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
    // Simple bot: first tries to win, then blocks player, then random move
    const emptyIndices = board
      .map((cell, index) => (cell === null ? index : null))
      .filter((index): index is number => index !== null);

    if (emptyIndices.length === 0) return;

    // Try to find a winning move for the bot
    for (const index of emptyIndices) {
      const newBoard = [...board];
      newBoard[index] = 'O';
      if (calculateWinner(newBoard) === 'O') {
        setTimeout(() => handleCellClick(index, true), 500);
        return;
      }
    }

    // Try to block the player
    for (const index of emptyIndices) {
      const newBoard = [...board];
      newBoard[index] = 'X';
      if (calculateWinner(newBoard) === 'X') {
        setTimeout(() => handleCellClick(index, true), 500);
        return;
      }
    }

    // Otherwise make a random move
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tic Tac Toe</h1>
      
      <div className="mb-4 text-xl font-semibold">
        {!isGameOver ? (
          <p>{currentPlayer === 'X' ? 'Your turn (X)' : 'Bot is thinking...'}</p>
        ) : (
          <p className={`font-bold ${winner === 'X' ? 'text-green-600' : winner === 'O' ? 'text-red-600' : 'text-yellow-600'}`}>
            {winner === 'X' ? 'You won 🎉' : winner === 'O' ? 'You lost ❌' : 'It\'s a draw 🤝'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {Array(9).fill(null).map((_, index) => renderCell(index))}
      </div>

      <button
        onClick={resetGame}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Restart Game
      </button>
    </div>
  );
};

export default TicTacToe;