import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import Button from '../ui/Button';

interface Message {
    role: 'user' | 'model';
    content: string;
}

type KeyStatus = 'checking' | 'needed' | 'ready' | 'error';

interface AiCoachProps {
    goBack: () => void;
}

const AiCoach: React.FC<AiCoachProps> = ({ goBack }) => {
    const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
    const [isInitializing, setIsInitializing] = useState(false);
    const [keyError, setKeyError] = useState<string | null>(null);

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);

    const initializeChat = useCallback(async () => {
        setIsInitializing(true);
        setKeyError(null);

        try {
            // A new instance is created to ensure the latest key is used.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are a friendly and encouraging probability coach named 'Pro-Bot'. Your goal is to explain probability concepts to middle school students in a simple, fun, and engaging way. Use analogies, simple examples, and avoid overly technical jargon. When asked for a problem, create a short, clear problem with a multiple-choice answer, and then explain the solution step-by-step after the user has had a chance to think. Keep your responses concise and easy to read. Use markdown for lists and bolding.",
                },
            });

            setChat(newChat);
            setMessages([{ role: 'model', content: "Hi! I'm Pro-Bot. Ask me anything about probability!" }]);
        } catch (error: any) {
            console.error("Failed to initialize AI Chat:", error);
            setChat(null);
            // Check if aistudio exists to provide context-aware error messages
            if (window.aistudio) {
                setKeyStatus('needed'); // Re-prompt for key
                if (error.message.includes('API key not valid') || error.message.includes('permission') || error.message.includes('not found')) {
                    setKeyError('The selected API key is not valid or lacks permissions. Please choose a different key.');
                } else {
                    setKeyError('An unexpected error occurred during initialization. Please try selecting your key again.');
                }
            } else {
                // aistudio not present, show error inline within the chat UI
                setMessages([{
                    role: 'model',
                    content: "Sorry, the AI Coach couldn't be started. This might be because an API key isn't configured for this environment."
                }]);
            }
        } finally {
            setIsInitializing(false);
        }
    }, []);
    
    useEffect(() => {
        const checkKeyManagementService = async () => {
            // Give the aistudio SDK a moment to load to handle race conditions
            await new Promise(resolve => setTimeout(resolve, 500));

            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                // aistudio SDK is present, use its flow
                try {
                    if (await window.aistudio.hasSelectedApiKey()) {
                        setKeyStatus('ready');
                    } else {
                        setKeyStatus('needed');
                    }
                } catch (e) {
                    console.error("Error checking aistudio API key:", e);
                    setKeyStatus('error');
                    setKeyError('Could not connect to the API key service. Please reload.');
                }
            } else {
                // aistudio SDK is not present, fall back to environment variable.
                // We assume the key is present and just try to initialize.
                setKeyStatus('ready'); 
            }
        };

        checkKeyManagementService();
    }, []);


    useEffect(() => {
        if (keyStatus === 'ready' && !chat && !isInitializing) {
            initializeChat();
        }
    }, [keyStatus, chat, isInitializing, initializeChat]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume success and let the useEffect hook handle initialization
            setKeyStatus('ready');
        } catch (e) {
            console.error("Could not open API key dialog:", e);
            setKeyError('The API key selection dialog could not be opened.');
            setKeyStatus('needed');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chat || isStreaming) return;

        const userMessage: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]);
        const messageToSend = inputValue;
        setInputValue('');
        setIsStreaming(true);

        try {
            const stream = await chat.sendMessageStream({ message: messageToSend });
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === 'model') {
                        newMessages[newMessages.length - 1] = { ...lastMessage, content: lastMessage.content + chunkText };
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMessage = 'Oops! Something went wrong. Please try again.';
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'model' && lastMessage.content === '') {
                     newMessages[newMessages.length - 1] = { ...lastMessage, content: errorMessage };
                     return newMessages;
                }
                return [...newMessages, { role: 'model', content: errorMessage }];
            });
        } finally {
            setIsStreaming(false);
        }
    };
    
    const renderActionRequired = () => (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md mb-6 w-full max-w-md" role="alert">
                <p className="font-bold">Action Required</p>
                <p>To use the AI Coach, you need to select a Gemini API key.</p>
            </div>
            {keyError && (
                <p className="text-red-500 mb-4 animate-shake">{keyError}</p>
            )}
            <Button onClick={handleSelectKey}>
                Select API Key
            </Button>
            <p className="text-xs text-gray-500 mt-4 max-w-xs">
               This will open a dialog to choose your API key. For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">billing documentation</a>.
            </p>
        </div>
    );
    
    const renderChatInterface = () => (
         <>
            <div className="flex-1 p-6 overflow-y-auto">
                {isInitializing ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 animate-pulse">Connecting to the AI Coach...</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <span className="text-2xl flex-shrink-0">🤖</span>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <div className="prose" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }}></div>
                                {isStreaming && msg.role === 'model' && index === messages.length - 1 && (
                                    <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></span>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={chat && !isInitializing ? "Ask a probability question..." : "AI is not available"}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!chat || isStreaming || isInitializing}
                        aria-label="Chat input"
                    />
                    <Button type="submit" disabled={!chat || isStreaming || !inputValue.trim() || isInitializing}>
                        Send
                    </Button>
                </form>
            </div>
        </>
    );

    const renderContent = () => {
        switch (keyStatus) {
            case 'checking':
                return (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 animate-pulse">Checking for API Key...</p>
                    </div>
                );
            case 'needed':
                return renderActionRequired();
            case 'ready':
                return renderChatInterface();
            case 'error':
            default:
                return (
                    <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-red-500">{keyError || 'An unknown error occurred.'}</p>
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Button onClick={goBack} variant="secondary">← Back to Games</Button>
                <h1 className="text-4xl font-bold text-center text-purple-500">AI Probability Coach</h1>
                <div className="w-36"></div> {/* Placeholder for alignment */}
            </div>

            <div className="bg-white rounded-lg shadow-xl max-w-3xl mx-auto flex flex-col" style={{height: '60vh'}}>
                {renderContent()}
            </div>
        </div>
    );
};

export default AiCoach;