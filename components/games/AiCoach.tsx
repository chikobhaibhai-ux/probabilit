
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import Button from '../ui/Button';

interface AiCoachProps {
  goBack: () => void;
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

const AiCoach: React.FC<AiCoachProps> = ({ goBack }) => {
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const initializeChat = useCallback(async () => {
        setApiKeyStatus('checking');
        try {
            // Re-create the AI instance right before use to ensure it has the latest key.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are a friendly and encouraging probability coach named 'Pro-Bot'. Your goal is to explain probability concepts to middle school students in a simple, fun, and engaging way. Use analogies, simple examples, and avoid overly technical jargon. When asked for a problem, create a short, clear problem with a multiple-choice answer, and then explain the solution step-by-step after the user has had a chance to think. Keep your responses concise and easy to read. Use markdown for lists and bolding.",
                },
            });

            setChat(newChat);
            setMessages([{ role: 'model', content: "Hi! I'm Pro-Bot. Ask me anything about probability!" }]);
            setApiKeyStatus('ready');
        } catch (error) {
            console.error("Failed to initialize AI Chat:", error);
            setApiKeyStatus('missing');
            setMessages([]);
            setChat(null);
        }
    }, []);

    const checkForKeyAndInitialize = useCallback(async () => {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (hasKey) {
                await initializeChat();
            } else {
                setApiKeyStatus('missing');
            }
        } catch (error) {
             console.error("Error checking for API key:", error);
             setApiKeyStatus('missing');
        }
    }, [initializeChat]);


    useEffect(() => {
        checkForKeyAndInitialize();
    }, [checkForKeyAndInitialize]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Per documentation, to avoid race conditions, we assume the key is selected
            // and proceed directly to initialization without re-checking.
            await initializeChat();
        } catch (error) {
            console.error('API key selection dialog was cancelled or failed.', error);
            // If the dialog itself fails, we ensure the status is 'missing'.
            if (apiKeyStatus !== 'missing') {
                setApiKeyStatus('missing');
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chat || isLoading) return;

        const userMessageContent = inputValue;
        const userMessage: Message = { role: 'user', content: userMessageContent };
        
        setMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: userMessageContent });
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.content += chunkText;
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMessage = 'Oops! Something went wrong. Please try again.';
            if (error.message && error.message.includes('Requested entity was not found')) {
                 setApiKeyStatus('missing');
                 setMessages([]);
                 setChat(null);
            } else {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model' && lastMessage.content === '') {
                        lastMessage.content = errorMessage;
                        return newMessages;
                    }
                    return [...newMessages, {role: 'model', content: errorMessage}];
                });
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        switch (apiKeyStatus) {
            case 'checking':
                return <div className="p-6 text-center text-gray-500 flex-1 flex items-center justify-center">Initializing AI Coach...</div>;
            case 'missing':
                return (
                    <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                            <p className="font-bold">Action Required</p>
                            <p>To use the AI Coach, you need to select a Gemini API key.</p>
                        </div>
                        <Button onClick={handleSelectKey} className="mt-4">
                            Select API Key
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                            This will open a dialog to choose your API key. For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">billing documentation</a>.
                        </p>
                    </div>
                );
            case 'ready':
                return (
                    <>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                     {msg.role === 'model' && <span className="text-2xl flex-shrink-0">🤖</span>}
                                    <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <div className="prose">{msg.content}</div>
                                        {isLoading && msg.role === 'model' && index === messages.length -1 && <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></span>}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={chat ? "Ask a probability question..." : "AI is not available"}
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={!chat || isLoading}
                                    aria-label="Chat input"
                                />
                                <Button type="submit" disabled={!chat || isLoading || !inputValue.trim()}>
                                    Send
                                </Button>
                            </form>
                        </div>
                    </>
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
