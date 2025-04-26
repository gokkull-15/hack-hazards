"use client";

import { useState, useEffect } from 'react';
import IMG1 from "@/public/sprites/g1.jpg";
import IMG2 from "@/public/sprites/g2.jpg";
import IMG3 from "@/public/sprites/g3.jpg";
import IMG4 from "@/public/sprites/g4.jpg";

type Question = {
  imageUrl: string;
  options: string[];
  answer: string;
};

const questions: Question[] = [
  {
    imageUrl: IMG1,
    options: ['Dog', 'Cat', 'Bird', 'Fish'],
    answer: 'Dog'
  },
  {
    imageUrl: IMG2,
    options: ['Dog', 'Cat', 'Rabbit', 'Hamster'],
    answer: 'Cat'
  },
  {
    imageUrl: IMG3,
    options: ['Rhino', 'Hippo', 'Elephant', 'Giraffe'],
    answer: 'Elephant'
  },
  {
    imageUrl: IMG4,
    options: ['Tiger', 'Leopard', 'Lion', 'Cheetah'],
    answer: 'Lion'
  }
];

export default function GuessingGame() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isAnswerShown, setIsAnswerShown] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    if (selectedOption || gameOver) return;
    
    setSelectedOption(option);
    setIsAnswerShown(true);
    
    if (option === currentQuestion.answer) {
      setScore(prevScore => prevScore + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedOption(null);
        setIsAnswerShown(false);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setGameOver(false);
    setIsAnswerShown(false);
  };

  const getOptionClasses = (option: string) => {
    let baseClasses = 'p-4 rounded-lg text-center cursor-pointer transition-colors duration-200 ';
    
    if (!isAnswerShown) {
      return baseClasses + 'bg-blue-500 hover:bg-blue-600 text-white';
    }
    
    if (option === currentQuestion.answer) {
      return baseClasses + 'bg-green-500 text-white';
    }
    
    if (option === selectedOption && option !== currentQuestion.answer) {
      return baseClasses + 'bg-red-500 text-white';
    }
    
    return baseClasses + 'bg-gray-200 text-gray-800';
  };

  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6">Game Over!</h1>
          <p className="text-xl text-center mb-8">
            Your score: {score} out of {questions.length}
          </p>
          <button
            onClick={resetGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-700">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <p className="text-xl font-bold">Score: {score}</p>
        </div>
        
        <div className="mb-6">
          <img 
            src={currentQuestion.imageUrl} 
            alt="Guess what this is" 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              className={getOptionClasses(option)}
              disabled={isAnswerShown}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}