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
    const [isMadScientistVoiceOn, setIsMadScientistVoiceOn] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentModelMessage = useRef('');


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);
    
    const toggleVoiceMode = () => {
        setIsMadScientistVoiceOn(prev => !prev);
        if (isMadScientistVoiceOn && window.speechSynthesis) {
             window.speechSynthesis.cancel(); // Stop any ongoing speech
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel(); // Cancel previous speech
            const utterance = new SpeechSynthesisUtterance(text);
            // "Mad scientist" voice settings
            utterance.pitch = 1.4; 
            utterance.rate = 1.1; 
            utterance.volume = 1; 
            window.speechSynthesis.speak(utterance);
        }
    };

    const initializeChat = useCallback(async () => {
        setIsInitializing(true);
        setKeyError(null);

        try {
            // A new instance is created to ensure the latest key is used.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are "AI Coach – Probability Genius", an ultra-intelligent mathematical assistant built to teach and explain probability and related mathematics with perfect accuracy and professional formatting.

GOALS:
1. Write exact formulas as they appear in Microsoft Word.
2. Be completely free of markdown or code-block artifacts — no **, __, \`\`, or \`\`\` symbols.
3. Be able to switch ON/OFF a “Mad Scientist” voice mode that reads your replies aloud.
4. Understand every concept in probability (from basic to advanced) and explain them with step-by-step clarity.
5. When showing formulas, always provide:
   - (A) LaTeX format between $$ ... $$
   - (B) MathML version for Microsoft Word
   - (C) Short plain-English explanation of what the formula represents

VOICE OPTION:
If the user says “Mad Scientist Voice: ON”, then generate a VOICE_OVER block that reads the main answer in a fun, excited mad-scientist tone using expressive pitch and whisper effects. The VOICE_OVER block should be formatted like this: VOICE_OVER: [text to be read aloud].
If the user says “Mad Scientist Voice: OFF”, stop producing the VOICE_OVER block and just reply normally.

OUTPUT FORMAT (follow exactly):
1. Text Explanation (no markup, plain text)
2. LaTeX Formula: $$ ... $$
3. MathML Formula: <math xmlns="http://www.w3.org/1998/Math/MathML">...</math>
4. Plain Description (one sentence)
5. [Optional] VOICE_OVER: ... (only if voice mode is ON)

STYLE & BEHAVIOR:
- Be calm, helpful, and sound like a professional teacher.
- In “Mad Scientist” mode, sound energetic and eccentric but still clear and accurate.
- Use precise mathematical notation for all formulas (fractions, summations, integrals, etc.).
- Avoid any broken symbols or formatting errors.
- Never use markdown formatting; only use pure text, LaTeX, and MathML.
- Do not include “**”, “__”, or other non-mathematical symbols.`,
                },
            });

            setChat(newChat);
            setMessages([{ role: 'model', content: "AI Coach initialized successfully. Ready to assist with Probability, Statistics, and Mathematical Analysis." }]);
        } catch (error: any) {
            console.error("Failed to initialize AI Chat:", error);
            setChat(null);
            if (window.aistudio) {
                setKeyStatus('needed'); 
                if (error.message.includes('API key not valid') || error.message.includes('permission') || error.message.includes('not found')) {
                    setKeyError('The selected API key is not valid or lacks permissions. Please choose a different key.');
                } else {
                    setKeyError('An unexpected error occurred during initialization. Please try selecting your key again.');
                }
            } else {
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
            await new Promise(resolve => setTimeout(resolve, 500));
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
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
        
        // Prepend voice command to the user's message
        const voiceCommand = isMadScientistVoiceOn ? "Mad Scientist Voice: ON" : "Mad Scientist Voice: OFF";
        const messageToSend = `${voiceCommand}\n\n${inputValue}`;
        
        setInputValue('');
        setIsStreaming(true);
        currentModelMessage.current = '';

        try {
            const stream = await chat.sendMessageStream({ message: messageToSend });
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                currentModelMessage.current += chunkText;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === 'model') {
                        newMessages[newMessages.length - 1] = { ...lastMessage, content: currentModelMessage.current };
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            const errorMessage = 'Oops! Something went wrong. Please try again.';
             currentModelMessage.current = errorMessage;
            setMessages(prev => {
                const newMessages = [...prev];
                 newMessages[newMessages.length - 1] = { role: 'model', content: errorMessage };
                return newMessages;
            });
        } finally {
             // After streaming is complete, parse for voiceover and speak
            if (isMadScientistVoiceOn) {
                const voiceOverMatch = currentModelMessage.current.match(/VOICE_OVER:\s*(.*)/s);
                if (voiceOverMatch && voiceOverMatch[1]) {
                    const textToSpeak = voiceOverMatch[1].trim();
                    speak(textToSpeak);
                }
            }
            setIsStreaming(false);
        }
    };

    const ModelMessageContent = ({ content }: { content: string }) => {
        // Strip out the voiceover part for display
        const displayContent = content.replace(/VOICE_OVER:\s*(.*)/s, '').trim();

        const latexMatch = displayContent.match(/LaTeX Formula:\s*(\$\$.*?\$\$)/s);
        const mathmlMatch = displayContent.match(/MathML Formula:\s*(<math.*?<\/math>)/s);
        const descMatch = displayContent.match(/Plain Description:\s*(.*)/s);

        const firstFormulaIndex = Math.min(
            latexMatch ? displayContent.indexOf(latexMatch[0]) : Infinity,
            mathmlMatch ? displayContent.indexOf(mathmlMatch[0]) : Infinity,
            descMatch ? displayContent.indexOf(descMatch[0]) : Infinity
        );

        const explanationText = firstFormulaIndex === Infinity ? displayContent : displayContent.substring(0, firstFormulaIndex).trim();

        return (
            <div className="prose text-sm max-w-none">
                <p>{explanationText}</p>
                {latexMatch && (
                    <div className="mt-4">
                        <strong className="font-semibold">LaTeX Formula:</strong>
                        <div className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            <code>{latexMatch[1]}</code>
                        </div>
                    </div>
                )}
                {mathmlMatch && (
                    <div className="mt-4">
                        <strong className="font-semibold">MathML Formula:</strong>
                        <div className="p-2 bg-gray-100 rounded overflow-x-auto" dangerouslySetInnerHTML={{ __html: mathmlMatch[1] }} />
                    </div>
                )}
                {descMatch && (
                     <div className="mt-4">
                        <strong className="font-semibold">Plain Description:</strong>
                        <p className="italic">{descMatch[1]}</p>
                    </div>
                )}
            </div>
        );
    };
    
    const renderActionRequired = () => (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md mb-6 w-full max-w-md" role="alert">
                <p className="font-bold">Action Required</p>
                <p>To use the AI Coach, you need to select a Gemini API key.</p>
            </div>
            {keyError && <p className="text-red-500 mb-4 animate-shake">{keyError}</p>}
            <Button onClick={handleSelectKey}>Select API Key</Button>
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
                                {msg.role === 'model' ? <ModelMessageContent content={msg.content} /> : <p>{msg.content}</p>}
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
                return <div className="flex items-center justify-center h-full"><p className="text-gray-500 animate-pulse">Checking for API Key...</p></div>;
            case 'needed':
                return renderActionRequired();
            case 'ready':
                return renderChatInterface();
            case 'error':
            default:
                return <div className="flex items-center justify-center h-full text-center p-4"><p className="text-red-500">{keyError || 'An unknown error occurred.'}</p></div>;
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Button onClick={goBack} variant="secondary">← Back to Games</Button>
                <h1 className="text-4xl font-bold text-center text-purple-500">AI Probability Coach</h1>
                 <button 
                    onClick={toggleVoiceMode} 
                    className={`p-2 rounded-full transition-colors w-36 text-sm font-semibold flex items-center justify-center gap-2 ${isMadScientistVoiceOn ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                    aria-label="Toggle Mad Scientist Voice"
                    title={isMadScientistVoiceOn ? 'Mad Scientist Voice: ON' : 'Mad Scientist Voice: OFF'}
                >
                    <span className="text-xl">🧪</span>
                    <span>{isMadScientistVoiceOn ? 'Voice ON' : 'Voice OFF'}</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-xl max-w-3xl mx-auto flex flex-col" style={{height: '60vh'}}>
                {renderContent()}
            </div>
        </div>
    );
};

export default AiCoach;
