'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import img from './../../public/sprites/bg1.jpg';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    text: "Hello! I'm your AI assistant ",
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
    <div className="min-h-screen bg-gray-100 flex flex-col bgimage">
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

      {/* Chat container with fixed height */}
      <main className="flex-1 container mx-auto p-4 max-w-2xl flex flex-col">
        <div className="flex-1 rounded-lg shadow-sm  flex flex-col h-full overflow-hidden">
          {/* Messages area with constrained height and proper scroll */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 p-4 overflow-y-auto space-y-3 scrollbar-thin">
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                const displayLength = displayedLengths[index] || 0;
                const displayText = isBot ? msg.text.slice(0, displayLength) : msg.text;
                const timeString = msg.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

                return (
                  <div 
                    key={index} 
                    className={`flex ${isBot ? 'justify-start' : 'justify-end'} items-end gap-2`}
                  >
                    {isBot && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24"
  fill="currentColor"
  className="w-6 h-6 text-gray-500"
>
  <path d="M13 7.5a1 1 0 11-2 0 1 1 0 012 0zm-3 3a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm-3 3a1 1 0 11-2 0 1 1 0 012 0z"/>
  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12a8 8 0 0116 0H4z" clip-rule="evenodd"/>
</svg>
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] p-4 border rounded-2xl relative ${
                      isBot 
                        ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{displayText}</p>
                      {isBot && displayLength < msg.text.length && (
                        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                      )}
                      <div className={`text-xs mt-2 ${
                        isBot ? 'text-gray-500' : 'text-indigo-200'
                      } text-right`}>
                        {timeString}
                      </div>
                    </div>
                    
                    {!isBot && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-indigo-600"
                        >
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-gray-600"
                    >
                      <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
                      <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area fixed at bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
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
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .bgimage {
          background-image: url(${img.src});
          background-size: cover;
          background-position: center;
        }
      `}</style>
    </div>
  );
}