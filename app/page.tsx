'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import GameCanvas from '../components/GameCanvas';

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  return (
    <div className="w-screen h-screen bg-gray-800 overflow-hidden">
      <GameCanvas ref={canvasRef} router={router} />
    </div>
  );
}