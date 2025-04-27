'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RockPaperScissor from './RPS';
import SnakeGame from './SnakeGame';
import TicTacToe from './TicTacToe';
import DinoRun from './DinoRun';
import TypingAdventure from './TextAdventure';
import WordsMatch from './WordsMatch';

import IMG1 from "@/public/sprites/g1.jpg";
import IMG2 from "@/public/sprites/g3.jpg";
import IMG3 from "@/public/sprites/g4.jpg";
import IMG4 from "@/public/sprites/g5.jpg";
import IMG5 from "@/public/sprites/g7.jpg";
import IMG6 from "@/public/sprites/g9.jpg";

import Bi from "@/public/sprites/3.png";

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

  const startDinoRun = async () => {
    setCurrentGame('Dino Run');
    setGameOutput([<DinoRun />]);
  };

  const startSnake = async () => {
    setCurrentGame('Snake Game');
    setGameOutput([<SnakeGame />]);
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
    { name: 'Rock-Paper-Scissors', image: IMG2, onClick: startRPSGame },
    { name: 'Words Match', image: IMG3, onClick: startWordsMatch },
    { name: 'Snake', image: IMG4, onClick: startSnake },
    { name: 'Dino Run', image: IMG5, onClick: startDinoRun },
    { name: 'Text Adventure', image: IMG6, onClick: startTextAdventure },
  ];

  return (
    <div
  className="overflow-y-auto min-h-screen p-4 md:p-6 bg-white"
  style={{
    backgroundImage: `url(${Bi.src})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  }}
>
      {!currentGame ? (
        <>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-white font-press-start-2p-regular">🎮 MINI MONAD GAME COLLECTION</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 justify-items-center px-4">
            {games.map((game, index) => (
              <button
                key={index}
                onClick={game.onClick}
                className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200 w-66 md:w-96 border-2 border-black"
                aria-label={`Play ${game.name}`}
              >
                <Image
                  src={game.image}
                  alt={game.name}
                  className="w-full h-48 md:h-72 object-cover brightness-75"
                  width={560}
                  height={400}
                />
                <div className="absolute inset-0 flex items-center pt-68 justify-center p-2">
                  <span className="text-white text-sm md:text-base font-bold text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {game.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-screen mx-auto bg-gray-900 rounded-lg p-4 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{currentGame}</h2>
            <button 
              onClick={exitGame}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
              Exit Game
            </button>
          </div>
          
          <div className="bg-black p-4 rounded-lg h-screen overflow-y-auto mb-4 font-mono text-sm">
            {gameOutput.map((line, index) => (
              <p key={index} className="mb-1 last:mb-0">{line}</p>
            ))}
          </div>
          
          <div className="text-center py-4">
            <p className="text-gray-400">Game interaction area will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelector;