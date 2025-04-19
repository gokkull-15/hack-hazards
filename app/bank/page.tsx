export default function BankPage() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white pixel-font">
        <h1 className="text-4xl mb-4">Bank</h1>
        <p>Welcome to the Bank! Manage your in-game currency here.</p>
        <a href="/" className="mt-4 text-blue-400 hover:underline">
          Back to Forest
        </a>
      </div>
    );
  }