export interface GameState {
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    gridSize: number;
    boundaries: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  }
  
  export interface Sprite {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
  }