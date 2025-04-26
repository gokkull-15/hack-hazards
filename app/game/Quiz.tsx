"use client";

import { useState, useEffect } from 'react';

type Question = {
  question: string;
  options: string[];
  answer: string;
};

const questions: Question[] = [
  {
    question: "What is the smallest country in the world by land area?",
    options: ["Australia", "San Marino", "Monaco", "Vatican City"],
    answer: "Vatican City"
  },
  {
    question: "Which is the longest river in the world?",
    options: ["Yangtze River", "Nile River", "Mississippi River", "Amazon Fresh water River"],
    answer: "Nile River"
  },
  {
    question: "What is the capital city of Australia?",
    options: ["Canberra", "Melbourne", "Sydney", "Tokyo"],
    answer: "Canberra"
  },
  {
    question: "Which continent is known as the 'Dark Continent'?",
    options: ["Asia", "Africa", "Europe", "Antartica"],
    answer: "Africa"
  },
  {
    question: "What is the capital city of Canada?",
    options: ["Vancouver", "Sydney", "Ottawa", "Toronto"],
    answer: "Ottawa"
  },
  {
    question: "Which European country has the largest population?",
    options: ["Spain", "Russia", "France", "Bhutan"],
    answer: "Russia"
  },
  {
    question: "What is the smallest country in Europe by area?",
    options: ["Australia", "San Marino", "Monaco", "Vatican City"],
    answer: "Vatican City"
  },
  {
    question: "Which country is known as the Land of the Rising Sun?",
    options: ["China", "Japan", "South Korea", "Taiwan"],
    answer: "Japan"
  },
  {
    question: "What is the capital city of Spain?",
    options: ["Barcelona", "Madrid", "Tokyo", "Valencia"],
    answer: "Madrid"
  },
  {
    question: "Which river flows through Paris?",
    options: ["Seine", "Rhone", "Loire", "Amazon"],
    answer: "Seine"
  },
  {
    question: "What is the largest desert in the world?",
    options: ["Gobi desert", "Amazon", "Kalahari", "Sahara"],
    answer: "Sahara"
  },
  {
    question: "Which country is known for its unique social network called 'Weibo'?",
    options: ["Japan", "Brazil", "South Korea", "China"],
    answer: "China"
  },
  {
    question: "What is the capital of Italy?",
    options: ["Florence", "Tokyo", "Rome", "Milan"],
    answer: "Rome"
  },
  {
    question: "Which European capital city is located on the Danube River?",
    options: ["Tokyo", "Prague", "Vienna", "Budapest"],
    answer: "Vienna"
  },
  {
    question: "What is the highest mountain in North America?",
    options: ["Mount Saint Elias", "Mount Logan", "Mount McKinley", "Mount Olympus"],
    answer: "Denali (Mount McKinley)"
  },
  {
    question: "Which country has the most time zones?",
    options: ["Russia", "Serbia", "France", "Germany"],
    answer: "France"
  },
  {
    question: "What is the main ingredient of the traditional Japanese dish sushi?",
    options: ["Chocolate", "Tofu", "Sashimi", "Vinegared rice"],
    answer: "Vinegared rice"
  },
  {
    question: "What is the capital of New Zealand?",
    options: ["Auckland", "Bhopal", "Wellington", "Texas"],
    answer: "Wellington"
  },
  {
    question: "Which European country is famous for its windmills and tulips?",
    options: ["Belgium", "Denmark", "Netherlands", "Kosovo"],
    answer: "Netherlands"
  },
  {
    question: "Which country is home to the Great Barrier Reef?",
    options: ["New Zealand", "Papua new guinea", "Australia", "Switzerland"],
    answer: "Australia"
  }
];

const QuizGame = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.answer;
    setIsAnswered(true);

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizCompleted(false);
  };

  const getOptionClasses = (option: string) => {
    if (!isAnswered) {
      return "bg-white hover:bg-gray-100";
    }

    if (option === currentQuestion.answer) {
      return "bg-green-500 text-white";
    }

    if (option === selectedOption && option !== currentQuestion.answer) {
      return "bg-red-500 text-white";
    }

    return "bg-gray-200";
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Quiz Completed!</h1>
          <p className="text-center text-lg mb-8">
            Your final score is: <span className="font-bold">{score}</span> out of {questions.length}
          </p>
          <button
            onClick={restartQuiz}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-200"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Quiz Game</h1>
          <p className="text-gray-700">Question {currentQuestionIndex + 1}/{questions.length}</p>
        </div>
        
        <div className="mb-6">
          <p className="text-lg font-semibold mb-4">{currentQuestion.question}</p>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswered}
                className={`w-full text-left p-3 rounded transition duration-200 ${getOptionClasses(option)} ${
                  isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 p-3 rounded">
          <p className="text-center font-medium">Score: {score}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;