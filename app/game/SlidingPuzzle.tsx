import { useState, useEffect, useCallback } from 'react';

type TilePosition = {
  row: number;
  col: number;
};

type Tile = {
  value: number;
  position: TilePosition;
  isEmpty: boolean;
};

const SlidingPuzzle = () => {
  const [gridSize, setGridSize] = useState<number>(3);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  // Initialize the puzzle
  useEffect(() => {
    initializePuzzle();
  }, [gridSize]);

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tiles, isSolved]);

  const initializePuzzle = () => {
    const totalTiles = gridSize * gridSize;
    const initialTiles: Tile[] = [];

    // Create ordered tiles
    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      initialTiles.push({
        value: i + 1,
        position: { row, col },
        isEmpty: i === totalTiles - 1,
      });
    }

    // Shuffle tiles
    const shuffledTiles = shuffleTiles([...initialTiles]);
    setTiles(shuffledTiles);
    setMoves(0);
    setIsSolved(false);
  };

  const shuffleTiles = (tilesToShuffle: Tile[]): Tile[] => {
    const shuffledTiles = [...tilesToShuffle];
    const emptyTile = shuffledTiles.find(tile => tile.isEmpty)!;
    let emptyPosition = { ...emptyTile.position };

    // Perform random moves to shuffle
    const shuffleMoves = 100;
    for (let i = 0; i < shuffleMoves; i++) {
      const adjacentTiles = getAdjacentTiles(shuffledTiles, emptyPosition);
      if (adjacentTiles.length > 0) {
        const randomTile = adjacentTiles[Math.floor(Math.random() * adjacentTiles.length)];
        const newTiles = moveTile(randomTile, shuffledTiles);
        shuffledTiles.splice(0, shuffledTiles.length, ...newTiles);
        emptyPosition = randomTile.position;
      }
    }

    return shuffledTiles;
  };

  const getAdjacentTiles = (currentTiles: Tile[], position: TilePosition): Tile[] => {
    const { row, col } = position;
    const directions = [
      { row: row - 1, col }, // up
      { row: row + 1, col }, // down
      { row, col: col - 1 }, // left
      { row, col: col + 1 }, // right
    ];

    return directions
      .filter(dir => 
        dir.row >= 0 && 
        dir.row < gridSize && 
        dir.col >= 0 && 
        dir.col < gridSize
      )
      .map(dir => 
        currentTiles.find(tile => 
          tile.position.row === dir.row && 
          tile.position.col === dir.col
        )!
      );
  };

  const moveTile = (tile: Tile, currentTiles: Tile[]): Tile[] => {
    const emptyTile = currentTiles.find(t => t.isEmpty)!;
    const newTiles = [...currentTiles];

    // Swap positions
    newTiles[tile.value - 1] = {
      ...tile,
      position: { ...emptyTile.position },
      isEmpty: false,
    };

    newTiles[emptyTile.value - 1] = {
      ...emptyTile,
      position: { ...tile.position },
      isEmpty: true,
    };

    return newTiles;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isSolved) return;

    const emptyTile = tiles.find(tile => tile.isEmpty)!;
    const adjacentTiles = getAdjacentTiles(tiles, emptyTile.position);

    let directionTile: Tile | null = null;

    switch (e.key) {
      case 'ArrowUp':
        directionTile = adjacentTiles.find(t => t.position.row === emptyTile.position.row + 1 && t.position.col === emptyTile.position.col);
        break;
      case 'ArrowDown':
        directionTile = adjacentTiles.find(t => t.position.row === emptyTile.position.row - 1 && t.position.col === emptyTile.position.col);
        break;
      case 'ArrowLeft':
        directionTile = adjacentTiles.find(t => t.position.row === emptyTile.position.row && t.position.col === emptyTile.position.col + 1);
        break;
      case 'ArrowRight':
        directionTile = adjacentTiles.find(t => t.position.row === emptyTile.position.row && t.position.col === emptyTile.position.col - 1);
        break;
      default:
        return;
    }

    if (directionTile) {
      const newTiles = moveTile(directionTile, tiles);
      setTiles(newTiles);
      setMoves(moves + 1);
      checkSolved(newTiles);
    }
  }, [tiles, moves, isSolved]);

  const handleTileClick = (clickedTile: Tile) => {
    if (isSolved) return;

    const emptyTile = tiles.find(tile => tile.isEmpty)!;
    const adjacentTiles = getAdjacentTiles(tiles, emptyTile.position);

    const isAdjacent = adjacentTiles.some(
      tile => tile.value === clickedTile.value
    );

    if (isAdjacent) {
      const newTiles = moveTile(clickedTile, tiles);
      setTiles(newTiles);
      setMoves(moves + 1);
      checkSolved(newTiles);
    }
  };

  const checkSolved = (currentTiles: Tile[]) => {
    const solved = currentTiles.every(tile => {
      const expectedRow = Math.floor((tile.value - 1) / gridSize);
      const expectedCol = (tile.value - 1) % gridSize;
      return (
        tile.position.row === expectedRow &&
        tile.position.col === expectedCol
      );
    });

    if (solved) {
      setIsSolved(true);
    }
  };

  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
  };

  const getTileStyle = (tile: Tile) => {
    const baseStyle = 'flex items-center justify-center rounded-md transition-all duration-200';
    const sizeStyle = `h-16 w-16 md:h-20 md:w-20`;
    const colorStyle = tile.isEmpty 
      ? 'bg-gray-200' 
      : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-md';
    const positionStyle = `absolute`;

    return `${baseStyle} ${sizeStyle} ${colorStyle} ${positionStyle}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Sliding Puzzle</h1>
      
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => handleGridSizeChange(3)}
          className={`px-4 py-2 rounded-md ${gridSize === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          3x3
        </button>
        <button
          onClick={() => handleGridSizeChange(4)}
          className={`px-4 py-2 rounded-md ${gridSize === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          4x4
        </button>
      </div>

      <div 
        className="relative mb-6 bg-gray-300 rounded-md p-2"
        style={{
          width: `${gridSize * 5}rem`,
          height: `${gridSize * 5}rem`,
        }}
      >
        {tiles.map(tile => (
          <div
            key={tile.value}
            className={getTileStyle(tile)}
            style={{
              top: `${tile.position.row * 5}rem`,
              left: `${tile.position.col * 5}rem`,
              transform: 'translate(0.5rem, 0.5rem)',
              visibility: tile.isEmpty ? 'hidden' : 'visible',
            }}
            onClick={() => handleTileClick(tile)}
          >
            {!tile.isEmpty && tile.value}
          </div>
        ))}
      </div>

      <div className="mb-6 text-lg">
        Moves: <span className="font-bold">{moves}</span>
      </div>

      {isSolved && (
        <div className="mb-6 p-4 bg-green-500 text-white rounded-md text-xl font-bold animate-bounce">
          Puzzle Completed with {moves} Moves!
        </div>
      )}

      <button
        onClick={initializePuzzle}
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        {isSolved ? 'Play Again' : 'Shuffle'}
      </button>

      <div className="mt-4 text-gray-600 text-center">
        <p>Use arrow keys to move tiles</p>
        <p>or click adjacent tiles to move them</p>
      </div>
    </div>
  );
};

export default SlidingPuzzle;