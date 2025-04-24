'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    text: "Hello! I'm your AI assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState<string>(() => 
    Math.random().toString(36).substring(2, 11)
  );
  const [displayedLengths, setDisplayedLengths] = useState<{ [key: number]: number }>({ 0: 43 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    const lastMessage = messages[messages.length - 1];
    const lastIndex = messages.length - 1;
    
    if (lastMessage.sender === 'bot' && !displayedLengths[lastIndex]) {
      let currentLength = 0;
      const interval = setInterval(() => {
        currentLength++;
        setDisplayedLengths(prev => ({
          ...prev,
          [lastIndex]: Math.min(currentLength, lastMessage.text.length)
        }));
        if (currentLength >= lastMessage.text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      text: input, 
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        text: data.response, 
        sender: 'bot',
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the AI.", 
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center text-purple-600 hover:text-purple-700">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 max-w-2xl flex flex-col">
        <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              const displayLength = displayedLengths[index] || 0;
              const displayText = isBot ? msg.text.slice(0, displayLength) : msg.text;
              const timeString = msg.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    isBot 
                      ? 'bg-gray-50 border border-gray-200 rounded-bl-none ml-1'
                      : 'bg-purple-600 text-white rounded-br-none mr-1'
                  }`}>
                    <p className="text-sm">{displayText}</p>
                    {isBot && displayLength < msg.text.length && (
                      <div className="w-2 h-4 bg-gray-400 inline-block ml-1 animate-blink" />
                    )}
                    <div className={`text-xs mt-1 ${isBot ? 'text-gray-500' : 'text-purple-100'} text-right`}>
                      {timeString}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 p-3 rounded-2xl rounded-bl-none border border-gray-200 ml-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
      `}</style>
    </div>
  );
}