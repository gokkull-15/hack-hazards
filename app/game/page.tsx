export default function GamePage() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white pixel-font">
        <h1 className="text-4xl mb-4">Game Center</h1>
        <p>Play exciting mini-games and earn rewards!</p>
        <a href="/" className="mt-4 text-blue-400 hover:underline">
          Back to Forest
        </a>
      </div>
    );
  }