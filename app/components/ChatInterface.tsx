'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export default function ChatInterface() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate a title from the first message
  const generateChatTitle = (firstMessage: string): string => {
    const words = firstMessage.split(' ');
    if (words.length <= 6) {
      return firstMessage;
    }
    return words.slice(0, 6).join(' ') + '...';
  };

  // Save current chat session
  const saveCurrentChat = () => {
    if (currentChatId && messages.length > 0) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages, lastUpdated: new Date() }
            : chat
        )
      );
    }
  };

  // Load a chat session
  const loadChat = (chatId: string) => {
    saveCurrentChat(); // Save current chat before switching

    const chat = chatSessions.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
    }
  };

  // Create new chat
  const newChat = () => {
    saveCurrentChat(); // Save current chat before creating new one

    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);

    // Create new chat session (will be saved when first message is sent)
    const newSession: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date()
    };

    setChatSessions(prev => [newSession, ...prev]);
  };

  // Delete chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));

    if (currentChatId === chatId) {
      // If we're deleting the current chat, switch to the next available chat or create new one
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        const nextChat = remainingChats[0];
        setCurrentChatId(nextChat.id);
        setMessages(nextChat.messages);
      } else {
        // No chats left, create a new one
        newChat();
      }
    }
  };

  // Start editing chat title
  const startEditingTitle = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // Save edited title
  const saveEditedTitle = () => {
    if (editingChatId && editingTitle.trim()) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === editingChatId
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // If this is the first message in a new chat, update the title
    if (messages.length === 0 && currentChatId) {
      const newTitle = generateChatTitle(userMessage.content);
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, title: newTitle, messages: newMessages, lastUpdated: new Date() }
            : chat
        )
      );
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.ok) {
        // Coba ambil pesan error dari body jika ada
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      // 🚨 PERUBAHAN UTAMA DI SINI
      // Kita asumsikan API route kita sekarang mengembalikan { message: "AI response text" }
      const assistantContent = data.message || 'Sorry, there was an error processing the response.';
      // 🚨 PERUBAHAN UTAMA SELESAI DI SINI

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update the chat session with the complete conversation
      if (currentChatId) {
        setChatSessions(prev =>
          prev.map(chat =>
            chat.id === currentChatId
              ? { ...chat, messages: finalMessages, lastUpdated: new Date() }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, something went wrong. ${(error as Error).message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Initialize with a new chat if no chats exist
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
      setMessages([]);

      const newSession: ChatSession = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        lastUpdated: new Date()
      };

      setChatSessions([newSession]);
    }
  }, [chatSessions.length]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Recent Chats
            </div>
            <div className="space-y-1">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`group flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />

                  {editingChatId === chat.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditedTitle();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        autoFocus
                        onBlur={saveEditedTitle}
                      />
                      <button
                        onClick={saveEditedTitle}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{chat.title}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          onClick={(e) => startEditingTitle(chat.id, chat.title, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => deleteChat(chat.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Groq OpenAI/GPT OSS Chat 
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Powered by Groq ⚡
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                Online
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="flex items-center justify-center">
                  <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Groq OpenAI/GPT OSS Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a conversation with our AI assistant. Ask questions, get help with tasks, or just chat!
                </p>
              </div>
            </div>
          ) : (
            <div className=" mx-auto px-4 py-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Chat bubble */}
                    <div
                      className={`max-w-xs md:max-w-md rounded-2xl ${message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm self-end px-4 py-2'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm self-start px-4 py-2'
                        }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed break-words">
                        {message.content}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-1 opacity-70 ${message.role === 'user'
                        ? 'text-blue-100 text-right'
                        : 'text-gray-500 dark:text-gray-400 text-left'
                        }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="max-w-3xl px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[48px] max-h-32"
                  disabled={isLoading}
                />
              </div>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}