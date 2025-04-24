import { useState, useEffect } from 'react';

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

  const choices: Choice[] = ['rock', 'paper', 'scissors'];

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

  const resetGame = () => {
    setPlayerChoice(null);
    setBotChoice(null);
    setResult(null);
    setPlayerScore(0);
    setBotScore(0);
    setRound(0);
    setGameOver(false);
    setGameResult('');
  };

  useEffect(() => {
    if (round === 10) {
      setGameOver(true);
      if (playerScore > botScore) {
        setGameResult('You Won �');
      } else if (botScore > playerScore) {
        setGameResult('You Lost ❌');
      } else {
        setGameResult('It\'s a Draw 🤝');
      }
    }
  }, [round, playerScore, botScore]);

  const getEmoji = (choice: Choice) => {
    switch (choice) {
      case 'rock': return '✊';
      case 'paper': return '✋';
      case 'scissors': return '✌️';
      default: return '';
    }
  };

  const getResultColor = () => {
    if (result === 'win') return 'text-green-500';
    if (result === 'lose') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Rock Paper Scissors</h1>
      
      <div className="mb-8 text-center">
        <p className="text-lg mb-2">Round: {round}/10</p>
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <p className="font-bold">You</p>
            <p className="text-2xl">{playerScore}</p>
          </div>
          <div className="text-center">
            <p className="font-bold">Bot</p>
            <p className="text-2xl">{botScore}</p>
          </div>
        </div>
      </div>

      {!gameOver ? (
        <div className="flex gap-4 mb-8">
          {choices.map(choice => (
            <button
              key={choice}
              onClick={() => handlePlayerChoice(choice)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-2xl transition-colors"
            >
              {getEmoji(choice)} {choice?.charAt(0).toUpperCase() + choice?.slice(1)}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <button
            onClick={resetGame}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Restart Game
          </button>
        </div>
      )}

      {playerChoice && botChoice && (
        <div className="mb-8 text-center">
          <div className="flex justify-center gap-8 mb-4">
            <div>
              <p className="font-bold">Your choice</p>
              <p className="text-4xl">{getEmoji(playerChoice)}</p>
              <p>{playerChoice}</p>
            </div>
            <div>
              <p className="font-bold">Bot's choice</p>
              <p className="text-4xl">{getEmoji(botChoice)}</p>
              <p>{botChoice}</p>
            </div>
          </div>
          {result && (
            <p className={`text-2xl font-bold ${getResultColor()}`}>
              {result === 'win' ? 'You win!' : 
               result === 'lose' ? 'You lose!' : 'Draw!'}
            </p>
          )}
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">{gameResult}</h2>
          <p className="text-xl">
            Final Score: You {playerScore} - {botScore} Bot
          </p>
        </div>
      )}
    </div>
  );
}