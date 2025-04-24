'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import GuessingGame from './GuessingGame';
import RockPaperScissor from './RPS';
import SnakeGame from './SnakeGame';
import TicTacToe from './TicTacToe';
import QuizGame from './Quiz';
import DinoRun from './DinoRun';
import SlidingPuzzle from './SlidingPuzzle';
import TypingAdventure from './TextAdventure';
import WordsMatch from './WordsMatch';

// Image imports - adjust paths according to your actual file structure
import IMG1 from "@/public/sprites/g1.jpg";
import IMG2 from "@/public/sprites/g2.jpg";
import IMG3 from "@/public/sprites/g3.jpg";
import IMG4 from "@/public/sprites/g4.jpg";
import IMG5 from "@/public/sprites/g5.jpg";
import IMG6 from "@/public/sprites/g6.jpg";
import IMG7 from "@/public/sprites/g7.jpg";
import IMG8 from "@/public/sprites/g8.jpg";
import IMG9 from "@/public/sprites/g9.jpg";

type Game = {
  name: string;
  image: StaticImageData;
  onClick: () => Promise<void>;
};

const GameSelector: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameOutput, setGameOutput] = useState<string[]>([]);

  const addOutput = (message: string) => {
    setGameOutput(prev => [...prev, message]);
  };

  // Game starters
  const startGuessingGame = async () => {
    setCurrentGame('Guessing Game');
    setGameOutput([<GuessingGame />]);
  };

  const startRPSGame = async () => {
    setCurrentGame('Rock-Paper-Scissors');
    setGameOutput([<RockPaperScissor />]);
  };

  const startTextAdventure = async () => {
    setCurrentGame('Text Adventure');
    setGameOutput([<TypingAdventure />]);
  };

  const startWordsMatch = async () => {
    setCurrentGame('Words Match');
    setGameOutput([<WordsMatch />]);
  };

  const startSlidingPuzzle = async () => {
    setCurrentGame('Sliding Puzzle');
    setGameOutput([<SlidingPuzzle />]);
  };

  const startDinoRun = async () => {
    setCurrentGame('Dino Run');
    setGameOutput([<DinoRun />]);
  };

  const startSnake = async () => {
    setCurrentGame('Snake Game');
    setGameOutput([<SnakeGame />]);
  };

  const startQuiz = async () => {
    setCurrentGame('Quiz');
    setGameOutput([<QuizGame />]);
  };

  const startTicTacToe = async () => {
    setCurrentGame('Tic Tac Toe');
    setGameOutput([<TicTacToe />]);
  };

  const exitGame = () => {
    setCurrentGame(null);
    setGameOutput([]);
  };

  const games: Game[] = [
    { name: 'Tic Tac Toe', image: IMG1, onClick: startTicTacToe },
    { name: 'Guessing Game', image: IMG2, onClick: startGuessingGame },
    { name: 'Rock-Paper-Scissors', image: IMG3, onClick: startRPSGame },
    { name: 'Words Match', image: IMG4, onClick: startWordsMatch },
    { name: 'Snake', image: IMG5, onClick: startSnake },
    { name: 'Sliding Puzzle', image: IMG6, onClick: startSlidingPuzzle },
    { name: 'Dino Run', image: IMG7, onClick: startDinoRun },
    { name: 'Quiz', image: IMG8, onClick: startQuiz },
    { name: 'Text Adventure', image: IMG9, onClick: startTextAdventure },
  ];

  // Split games into three columns
  const column1 = games.slice(0, 3);
  const column2 = games.slice(3, 6);
  const column3 = games.slice(6, 9);

  return (
    <div className="overflow-y-auto max-h-screen p-4 md:p-6 bg-white min-h-screen">
      {!currentGame ? (
        <>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-white">🎮 Mini Game Collection</h1>
          <div className="flex justify-center gap-4 md:gap-8 px-8 md:px-4">
            {/* Column 1 */}
            <div className="flex flex-col gap-8 md:gap-6">
              {column1.map((game, index) => (
                <button
                  key={index}
                  onClick={game.onClick}
                  className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg hover:scale-100 transition-transform duration-200 w-40 md:w-48 border-12 border-t-24 border-black mx-1"
                  aria-label={`Play ${game.name}`}
                >
                  <Image
                    src={game.image}
                    alt={game.name}
                    className="w-full h-28 md:h-32 object-cover brightness-75"
                    width={560}
                    height={400}
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <span className="text-white text-sm md:text-base font-bold text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {game.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Column 2 */}
            <div className="flex flex-col gap-8 md:gap-6">
              {column2.map((game, index) => (
                <button
                  key={index}
                  onClick={game.onClick}
                  className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg hover:scale-100 transition-transform duration-200 w-40 md:w-48 border-12 border-t-24 border-black mx-1"
                  aria-label={`Play ${game.name}`}
                >
                  <Image
                    src={game.image}
                    alt={game.name}
                    className="w-full h-28 md:h-32 object-cover brightness-75"
                    width={560}
                    height={400}
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <span className="text-white text-sm md:text-base font-bold text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {game.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Column 3 */}
            <div className="flex flex-col gap-8 md:gap-6">
              {column3.map((game, index) => (
                <button
                  key={index}
                  onClick={game.onClick}
                  className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg hover:scale-100 transition-transform duration-200 w-40 md:w-48 border-12 border-t-24 border-black mx-1"
                  aria-label={`Play ${game.name}`}
                >
                  <Image
                    src={game.image}
                    alt={game.name}
                    className="w-full h-28 md:h-32 object-cover brightness-75"
                    width={560}
                    height={400}
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <span className="text-white text-sm md:text-base font-bold text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {game.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg p-4 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{currentGame}</h2>
            <button 
              onClick={exitGame}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
              Exit Game
            </button>
          </div>
          
          <div className="bg-black p-4 rounded-lg h-64 overflow-y-auto mb-4 font-mono text-sm">
            {gameOutput.map((line, index) => (
              <p key={index} className="mb-1 last:mb-0">{line}</p>
            ))}
          </div>
          
          {/* Game-specific UI would go here */}
          <div className="text-center py-4">
            <p className="text-gray-400">Game interaction area will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;