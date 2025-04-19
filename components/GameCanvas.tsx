'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, Sprite } from '../types/game';

const GameCanvas = forwardRef<HTMLCanvasElement>((_, ref) => {
  const stateRef = useRef<GameState>({
    player: { x: 150, y: 150, width: 16, height: 16 },
    gridSize: 7,
    boundaries: { minX: 0, maxX: 400, minY: 0, maxY: 300 },
  });

  const spritesRef = useRef<Sprite[]>([
    { id: 'character', x: 150, y: 150, width: 28, height: 28, src: '/sprites/character.png' },
    { id: 'bank', x: 103, y: 170, width: 60, height: 60, src: '/sprites/bank.png' },
    { id: 'game-center', x: 307, y: 160, width: 35, height: 50, src: '/sprites/game.png' },
    { id: 'robot', x: 140, y: 90, width: 32, height: 32, src: '/sprites/robot.png' },
    { id: 'background', x: 0, y: 0, width: 400, height: 300, src: '/sprites/bg.png' },
  ]);

  const router = useRouter();

  useEffect(() => {
    const canvas = (ref as React.MutableRefObject<HTMLCanvasElement>).current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Base resolution
    const BASE_WIDTH = 400;
    const BASE_HEIGHT = 300;

    // Update canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const scale = Math.min(
        window.innerWidth / BASE_WIDTH,
        window.innerHeight / BASE_HEIGHT
      );
      canvas.width = BASE_WIDTH * dpr * scale;
      canvas.height = BASE_HEIGHT * dpr * scale;
      ctx.scale(dpr * scale, dpr * scale);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Load sprites with error handling
    const images: { [key: string]: HTMLImageElement } = {};
    const loadPromises: Promise<void>[] = [];

    spritesRef.current.forEach((sprite) => {
      const img = new Image();
      img.src = sprite.src;
      images[sprite.id] = img;

      const promise = new Promise<void>((resolve) => {
        img.onload = () => {
          if (img.naturalWidth > 0) {
            resolve();
          } else {
            console.error(`Image ${sprite.src} loaded but is invalid`);
            resolve();
          }
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${sprite.src}`);
          resolve();
        };
      });
      loadPromises.push(promise);
    });

    // Wait for all images to load or fail
    Promise.all(loadPromises).then(() => {
      // Check collision with sprites
      const checkCollisions = () => {
        const character = spritesRef.current.find((s) => s.id === 'character');
        if (!character) return;

        spritesRef.current.forEach((sprite) => {
          if (sprite.id === 'character' || sprite.id === 'background') return;

          // Calculate distance between character and sprite
          const dx = character.x + character.width / 2 - (sprite.x + sprite.width / 2);
          const dy = character.y + character.height / 2 - (sprite.y + sprite.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Navigate if within interaction range (e.g., 30 pixels)
          if (distance < 30) {
            switch (sprite.id) {
              case 'robot':
                router.push('/ai');
                break;
              case 'bank':
                router.push('/bank');
                break;
              case 'game-center':
                router.push('/game');
                break;
            }
          }
        });
      };

      // Handle movement
      const handleKeyDown = (e: KeyboardEvent) => {
        const state = stateRef.current;
        let newX = state.player.x;
        let newY = state.player.y;

        switch (e.key) {
          case 'ArrowUp':
            newY -= state.gridSize;
            break;
          case 'ArrowDown':
            newY += state.gridSize;
            break;
          case 'ArrowLeft':
            newX -= state.gridSize;
            break;
          case 'ArrowRight':
            newX += state.gridSize;
            break;
        }

        // Boundary check
        if (
          newX >= state.boundaries.minX &&
          newX + state.player.width <= state.boundaries.maxX &&
          newY >= state.boundaries.minY &&
          newY + state.player.height <= state.boundaries.maxY
        ) {
          state.player.x = newX;
          state.player.y = newY;
          spritesRef.current.find((s) => s.id === 'character')!.x = newX;
          spritesRef.current.find((s) => s.id === 'character')!.y = newY;
          checkCollisions(); // Check collisions after movement
        }
      };

      // Render loop
      const render = () => {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

        // Draw background
        const bgSprite = spritesRef.current.find((s) => s.id === 'background');
        if (bgSprite) {
          const bgImg = images.background;
          if (bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.drawImage(bgImg, bgSprite.x, bgSprite.y, bgSprite.width, bgSprite.height);
          } else {
            // Fallback: Solid forest floor color
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
          }
        }

        // Draw sprites (except character and background)
        spritesRef.current
          .filter((sprite) => sprite.id !== 'character' && sprite.id !== 'background')
          .forEach((sprite) => {
            const img = images[sprite.id];
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, sprite.x, sprite.y, sprite.width, sprite.height);
            } else {
              // Fallback: Draw a colored rectangle
              ctx.fillStyle = getFallbackColor(sprite.id);
              ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
            }
          });

        // Draw character last (on top)
        const characterSprite = spritesRef.current.find((s) => s.id === 'character');
        if (characterSprite) {
          const img = images.character;
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(
              images.character,
              characterSprite.x,
              characterSprite.y,
              characterSprite.width,
              characterSprite.height
            );
          } else {
            // Fallback: Red rectangle for character
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(
              characterSprite.x,
              characterSprite.y,
              characterSprite.width,
              characterSprite.height
            );
          }
        }

        requestAnimationFrame(render);
      };

      window.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(render);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', updateCanvasSize);
      };
    });
  }, [ref, router]);

  // Fallback colors for sprites
  const getFallbackColor = (id: string): string => {
    switch (id) {
      case 'bank':
        return '#8b4513';
      case 'game-center':
        return '#ff00ff';
      case 'robot':
        return '#808080';
      default:
        return '#ffffff';
    }
  };

  return <canvas ref={ref} className="pixel-art" />;
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;