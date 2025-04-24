import React, { useState, useEffect, useRef, useCallback } from 'react';

type GameObject = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GameState = {
  dino: GameObject & { 
    isJumping: boolean; 
    isDucking: boolean;
    velocity: number;
    defaultHeight: number;
  };
  obstacles: GameObject[];
  isGameOver: boolean;
  isRunning: boolean;
  score: number;
  gameSpeed: number;
  highScore: number;
};

const DinoRun: React.FC = () => {
  // Game constants
  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const DINO_WIDTH = 50;
  const DINO_DEFAULT_HEIGHT = 70;
  const DINO_DUCK_HEIGHT = 40;
  const GROUND_HEIGHT = 30;
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_MIN_HEIGHT = 30;
  const OBSTACLE_MAX_HEIGHT = 60;
  const INITIAL_GAME_SPEED = 5;
  const OBSTACLE_SPAWN_RATE = 1500; // ms

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    dino: {
      x: 50,
      y: 0,
      width: DINO_WIDTH,
      height: DINO_DEFAULT_HEIGHT,
      defaultHeight: DINO_DEFAULT_HEIGHT,
      isJumping: false,
      isDucking: false,
      velocity: 0,
    },
    obstacles: [],
    isGameOver: false,
    isRunning: false,
    score: 0,
    gameSpeed: INITIAL_GAME_SPEED,
    highScore: 0,
  });

  // Get game area dimensions
  const getGameAreaDimensions = useCallback(() => {
    if (!gameAreaRef.current) return { width: 800, height: 300 };
    return {
      width: gameAreaRef.current.clientWidth,
      height: gameAreaRef.current.clientHeight,
    };
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const { height } = getGameAreaDimensions();
    const groundY = height - GROUND_HEIGHT - DINO_DEFAULT_HEIGHT;
  
    setGameState((prev) => ({
      ...prev,
      dino: {
        x: 50,
        y: groundY,
        width: DINO_WIDTH,
        height: prev.dino.isDucking ? DINO_DUCK_HEIGHT : DINO_DEFAULT_HEIGHT,
        defaultHeight: DINO_DEFAULT_HEIGHT,
        isJumping: false,
        isDucking: false,
        velocity: 0,
      },
      obstacles: [],
      isGameOver: false,
      isRunning: false,
      score: 0,
      gameSpeed: INITIAL_GAME_SPEED,
    }));
  }, [getGameAreaDimensions]);

  // Start game
  const startGame = useCallback(() => {
    if (gameState.isGameOver) {
      initGame();
    }
    gameStartTimeRef.current = Date.now();
    lastSpawnTimeRef.current = Date.now();
    setGameState(prev => ({ ...prev, isRunning: true }));
  }, [gameState.isGameOver, initGame]);

  // Stop game
  const stopGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: false }));
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  // Jump action
  const jump = useCallback(() => {
    if (!gameState.isRunning || gameState.isGameOver) return;

    if (!gameState.dino.isJumping) {
      setGameState((prev) => ({
        ...prev,
        dino: {
          ...prev.dino,
          isJumping: true,
          isDucking: false,
          height: prev.dino.defaultHeight,
          velocity: JUMP_FORCE,
        },
      }));
    }
  }, [gameState.dino.isJumping, gameState.isGameOver, gameState.isRunning]);

  // Duck action
  const duck = useCallback((isDucking: boolean) => {
    if (!gameState.isRunning || gameState.isGameOver || gameState.dino.isJumping) return;

    const { height } = getGameAreaDimensions();
    const groundY = height - GROUND_HEIGHT - (isDucking ? DINO_DUCK_HEIGHT : DINO_DEFAULT_HEIGHT);

    setGameState((prev) => ({
      ...prev,
      dino: {
        ...prev.dino,
        isDucking,
        height: isDucking ? DINO_DUCK_HEIGHT : DINO_DEFAULT_HEIGHT,
        y: groundY,
        defaultHeight: DINO_DEFAULT_HEIGHT,
      },
    }));
  }, [gameState.isRunning, gameState.isGameOver, gameState.dino.isJumping, getGameAreaDimensions]);

  // Spawn obstacle
  const spawnObstacle = useCallback(() => {
    const { height } = getGameAreaDimensions();
    const obstacleHeight = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
    const groundY = height - GROUND_HEIGHT;

    setGameState((prev) => ({
      ...prev,
      obstacles: [
        ...prev.obstacles,
        {
          x: getGameAreaDimensions().width,
          y: groundY - obstacleHeight,
          width: OBSTACLE_WIDTH,
          height: obstacleHeight,
        },
      ],
    }));
  }, [getGameAreaDimensions]);

  // Check collision
  const checkCollision = useCallback((dino: GameObject, obstacle: GameObject) => {
    return (
      dino.x < obstacle.x + obstacle.width &&
      dino.x + dino.width > obstacle.x &&
      dino.y < obstacle.y + obstacle.height &&
      dino.y + dino.height > obstacle.y
    );
  }, []);

  // Game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!gameState.isRunning || gameState.isGameOver) return;

      const { height } = getGameAreaDimensions();
      const groundY = height - GROUND_HEIGHT - gameState.dino.height;

      // Spawn obstacles
      if (timestamp - lastSpawnTimeRef.current > OBSTACLE_SPAWN_RATE / gameState.gameSpeed) {
        spawnObstacle();
        lastSpawnTimeRef.current = timestamp;
      }

      // Update dino position
      let newDinoY = gameState.dino.y;
      let newVelocity = gameState.dino.velocity;
      let isJumping = gameState.dino.isJumping;

      if (gameState.dino.isJumping) {
        newVelocity += GRAVITY;
        newDinoY += newVelocity;

        // Hit the ground
        if (newDinoY >= groundY) {
          newDinoY = groundY;
          newVelocity = 0;
          isJumping = false;
        }
      }

      // Update obstacles
      const newObstacles = gameState.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - gameState.gameSpeed,
        }))
        .filter((obstacle) => obstacle.x + obstacle.width > 0);

      // Check collisions
      let isGameOver = false;
      const dinoRect = {
        x: gameState.dino.x,
        y: newDinoY,
        width: gameState.dino.width,
        height: gameState.dino.height,
      };

      for (const obstacle of newObstacles) {
        if (checkCollision(dinoRect, obstacle)) {
          isGameOver = true;
          break;
        }
      }

      // Update score
      const newScore = Math.floor((Date.now() - gameStartTimeRef.current) / 100);
      const newHighScore = Math.max(gameState.highScore, newScore);

      // Increase game speed over time
      const newGameSpeed = INITIAL_GAME_SPEED + Math.floor(newScore / 500);

      setGameState((prev) => ({
        ...prev,
        dino: {
          ...prev.dino,
          y: newDinoY,
          velocity: newVelocity,
          isJumping: isJumping,
        },
        obstacles: newObstacles,
        isGameOver,
        score: newScore,
        highScore: newHighScore,
        gameSpeed: newGameSpeed,
        isRunning: !isGameOver,
      }));

      if (!isGameOver && gameState.isRunning) {
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    },
    [gameState, checkCollision, spawnObstacle, getGameAreaDimensions]
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          jump();
          break;
        case 'ArrowDown':
          e.preventDefault();
          duck(true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        duck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, duck]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState.isRunning && !gameState.isGameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop, gameState.isRunning, gameState.isGameOver]);

  // Initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Dino Run</h1>
      
      <div className="mb-4 flex justify-between w-full max-w-2xl">
        <div className="text-xl font-semibold">Score: {gameState.score}</div>
        <div className="text-xl font-semibold">High Score: {gameState.highScore}</div>
        <div className="text-xl font-semibold">Speed: {gameState.gameSpeed}</div>
      </div>
      
      <div
        ref={gameAreaRef}
        className="relative w-full max-w-2xl h-64 bg-white border-2 border-gray-300 overflow-hidden"
      >
        {/* Ground */}
        <div
          className="absolute bottom-0 w-full bg-gray-800"
          style={{ height: GROUND_HEIGHT }}
        ></div>
        
        {/* Dino */}
        // Update the Dino rendering part in your JSX:
<div
  className={`absolute ${gameState.dino.isDucking ? 'rounded-lg' : 'rounded-t-lg'}`}
  style={{
    left: gameState.dino.x,
    top: gameState.dino.y,
    width: DINO_WIDTH,
    height: gameState.dino.height,
    backgroundColor: '#535353',
    border: '2px solid #333',
    boxShadow: 'inset -3px 0 0 #777',
  }}
>
  {/* Eye - more visible */}
  <div 
    className="absolute bg-white rounded-full"
    style={{
      right: 10,
      top: 10,
      width: 12,
      height: 12,
      border: '2px solid #333',
    }}
  ></div>
  
  {/* Pupil */}
  <div 
    className="absolute bg-black rounded-full"
    style={{
      right: 12,
      top: 12,
      width: 6,
      height: 6,
    }}
  ></div>
  
  {/* Smile - only when not ducking */}
  {!gameState.dino.isDucking && (
    <div 
      className="absolute bg-transparent"
      style={{
        right: 15,
        top: 25,
        width: 15,
        height: 8,
        borderBottom: '3px solid #333',
        borderRadius: '0 0 8px 8px',
      }}
    ></div>
  )}
</div>
        
        {/* Obstacles */}
        {gameState.obstacles.map((obstacle, index) => (
          <div
            key={index}
            className="absolute bg-red-600 rounded-lg"
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
            }}
          ></div>
        ))}
        
        {/* Game Over overlay */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
            <h2 className="text-4xl font-bold mb-4">Game Over</h2>
            <p className="text-2xl mb-6">Score: {gameState.score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-lg font-semibold"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Start screen */}
        {!gameState.isRunning && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
            <h2 className="text-4xl font-bold mb-6">Dino Run</h2>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-semibold mb-4"
            >
              Start Game
            </button>
            <div className="text-center">
              <p className="mb-2">Controls:</p>
              <p>↑ or Space - Jump</p>
              <p>↓ - Duck</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex gap-4">
        {gameState.isRunning ? (
          <button
            onClick={stopGame}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={startGame}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
          >
            {gameState.isGameOver ? 'Restart' : 'Start'}
          </button>
        )}
        
        <button
          onClick={jump}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
        >
          Jump (↑/Space)
        </button>
        
        <button
          onMouseDown={() => duck(true)}
          onMouseUp={() => duck(false)}
          onTouchStart={() => duck(true)}
          onTouchEnd={() => duck(false)}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold"
        >
          Duck (↓)
        </button>
      </div>
      
      <div className="mt-6 text-gray-600 text-center">
        <p>Press ↑ or Space to jump, ↓ to duck</p>
        <p>Avoid the obstacles and survive as long as possible!</p>
      </div>
    </div>
  );
};

export default DinoRun;