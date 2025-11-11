
import React, { useState, useCallback } from 'react';
import { BadgeType, GameCase, Suspect, Clue, ClueTemplate } from '../../types';
import { GAME_CASES } from '../../constants';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { playSound } from '../../utils/sounds';

interface FindTheThiefProps {
  goBack: () => void;
  updatePoints: (amount: number) => void;
  earnBadge: (badge: BadgeType) => void;
}

interface SuspectWithProb extends Suspect {
    probability: number;
}

const FindTheThief: React.FC<FindTheThiefProps> = ({ goBack, updatePoints, earnBadge }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'revealed'>('intro');
    const [currentCase, setCurrentCase] = useState<GameCase>(GAME_CASES[0]);
    const [gameClues, setGameClues] = useState<Clue[]>([]);
    const [suspects, setSuspects] = useState<SuspectWithProb[]>([]);
    const [revealedClues, setRevealedClues] = useState<Clue[]>([]);
    const [showLearnMode, setShowLearnMode] = useState(false);
    const [result, setResult] = useState<{correct: boolean, guilty: Suspect} | null>(null);

    const startGame = useCallback(() => {
        playSound('click');
        // Deep copy the case to avoid mutating the constant
        const newCaseTemplate: GameCase = JSON.parse(JSON.stringify(GAME_CASES[0]));

        // Randomly select a new guilty suspect
        const guiltyIndex = Math.floor(Math.random() * newCaseTemplate.suspects.length);
        const guiltySuspect = newCaseTemplate.suspects[guiltyIndex];
        newCaseTemplate.guiltySuspectId = guiltySuspect.id;

        // Dynamically generate the clues for this game round
        const preparedClues: Clue[] = newCaseTemplate.clues.map((clueTemplate: ClueTemplate) => {
            const expectedValue = guiltySuspect.attributes[clueTemplate.attribute];
            const clueText = clueTemplate.texts[String(expectedValue)];
            return {
                id: clueTemplate.id,
                text: clueText,
                attribute: clueTemplate.attribute,
                expectedValue: expectedValue,
            };
        });
        
        setCurrentCase(newCaseTemplate);
        setGameClues(preparedClues);

        const initialProb = 1 / newCaseTemplate.suspects.length;
        setSuspects(newCaseTemplate.suspects.map(s => ({ ...s, probability: initialProb })));
        setRevealedClues([]);
        setResult(null);
        setGameState('playing');
    }, []);

    const revealNextClue = useCallback(() => {
        if (revealedClues.length >= gameClues.length) return;

        playSound('click');
        const nextClue = gameClues[revealedClues.length];
        setRevealedClues(prev => [...prev, nextClue]);

        setSuspects(prevSuspects => {
            // Identify suspects who were possible before this clue and also match this clue.
            const stillViableSuspects = prevSuspects.filter(s => {
                return s.probability > 0 && s.attributes[nextClue.attribute] === nextClue.expectedValue;
            });

            // If no suspects match (which shouldn't happen), don't change anything.
            if (stillViableSuspects.length === 0) return prevSuspects;

            // The new probability is evenly distributed among the remaining suspects.
            const newProb = 1 / stillViableSuspects.length;
            const viableIds = new Set(stillViableSuspects.map(s => s.id));

            // Update state: viable suspects get the new probability, everyone else gets 0.
            return prevSuspects.map(s => {
                if (viableIds.has(s.id)) {
                    return { ...s, probability: newProb };
                }
                // If the suspect is not in the viable set, they are eliminated.
                return { ...s, probability: 0 };
            });
        });
    }, [revealedClues, gameClues]);

    const makeAccusation = (accusedSuspect: SuspectWithProb) => {
        const guiltySuspect = suspects.find(s => s.id === currentCase.guiltySuspectId)!;
        const isCorrect = accusedSuspect.id === currentCase.guiltySuspectId;

        if (isCorrect) {
            playSound('success');
            updatePoints(250);
            earnBadge(BadgeType.MasterDetective);
        } else {
            playSound('failure');
            updatePoints(-50);
        }
        
        setResult({ correct: isCorrect, guilty: guiltySuspect });
        setGameState('revealed');
    };

    const isAccusationTime = revealedClues.length === gameClues.length;

    const renderIntro = () => (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <span className="text-6xl mb-4 block">📜</span>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{GAME_CASES[0].title}</h2>
            <p className="text-gray-600 mb-6">{GAME_CASES[0].story}</p>
            <Button onClick={startGame}>Start Investigation</Button>
        </div>
    );
    
    const renderGame = () => {
      const remainingSuspects = suspects.filter(s => s.probability > 0);
      const isDownToTwo = remainingSuspects.length === 2;

      return (
        <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold text-xl mb-4 border-b pb-2">Clues</h3>
                  <ul className="space-y-3">
                      {revealedClues.map(clue => (
                          <li key={clue.id} className="text-gray-700 animate-fade-in-down">🕵️‍♂️ {clue.text}</li>
                      ))}
                      {revealedClues.length < gameClues.length && (
                        <li className="text-gray-400">Next clue is waiting...</li>
                      )}
                  </ul>
                  <div className="mt-6">
                       <Button onClick={revealNextClue} disabled={isAccusationTime}>
                          Reveal Next Clue
                       </Button>
                  </div>
              </div>
              <div className="lg:w-2/3">
                  <h3 className="font-bold text-xl mb-4">{isAccusationTime ? 'Make Your Accusation!' : 'The Suspects'}</h3>
                  
                  {isDownToTwo && !isAccusationTime && (
                    <div className="text-center mb-4 p-3 bg-blue-100 rounded-lg animate-fade-in border border-blue-200" role="alert">
                        <p className="font-semibold text-blue-800">You've narrowed it down to two suspects! The final clue will be decisive.</p>
                    </div>
                  )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {suspects.map(s => (
                          <div 
                              key={s.id} 
                              onClick={isAccusationTime ? () => makeAccusation(s) : undefined}
                              className={`bg-white p-4 rounded-lg shadow-md transition-all duration-300 ${isAccusationTime ? 'cursor-pointer hover:shadow-xl hover:ring-2 hover:ring-red-500' : ''}`}
                          >
                              <div className="flex items-center space-x-4">
                                  <span className="text-4xl">{s.avatar}</span>
                                  <div>
                                      <h4 className="font-bold">{s.name}</h4>
                                      <p className="text-sm text-gray-500">Likelihood of Guilt</p>
                                  </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
                                  <div 
                                      className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                                      style={{ width: `${s.probability * 100}%` }}
                                  ></div>
                              </div>
                              <p className="text-right text-sm font-bold mt-1">{(s.probability * 100).toFixed(1)}%</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
    }

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Button onClick={goBack} variant="secondary">← Back to Games</Button>
                <h1 className="text-4xl font-bold text-center text-blue-500">Find the Thief</h1>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setShowLearnMode(true)} variant="ghost">🎓 Learn Mode</Button>
                    {gameState !== 'intro' && (
                        <Button onClick={startGame} variant="ghost" title="Start a New Game">↩ New Game</Button>
                    )}
                </div>
            </div>

            {gameState === 'intro' && renderIntro()}
            {(gameState === 'playing' || gameState === 'revealed') && renderGame()}

            <Modal isOpen={gameState === 'revealed'} onClose={startGame} title="The Verdict is In!">
                {result && (
                    <div className="text-center">
                        {result.correct ? (
                            <>
                                <span className="text-7xl block mb-4">🎉</span>
                                <h3 className="text-3xl font-bold text-green-600">Correct!</h3>
                                <p className="text-lg mt-2">You identified <strong>{result.guilty.name}</strong> as the thief. Excellent detective work!</p>
                                <p className="text-gray-600 mt-1">You earned 250 Probability Points!</p>
                            </>
                        ) : (
                             <>
                                <span className="text-7xl block mb-4">😥</span>
                                <h3 className="text-3xl font-bold text-red-600">Incorrect!</h3>
                                <p className="text-lg mt-2">The real thief was <strong>{result.guilty.name}</strong>.</p>
                                <p className="text-gray-600 mt-1">You lost 50 Probability Points. Better luck next time!</p>
                            </>
                        )}
                        <Button onClick={startGame} className="mt-6">Play Again</Button>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={showLearnMode} onClose={() => setShowLearnMode(false)} title="🎓 Learn Mode: Conditional Probability">
                 <div className="space-y-4">
                    <p><strong>Conditional Probability</strong> is the probability of an event happening, given that another event has already occurred.</p>
                    <p>In this game, each new clue provides an event that has occurred. We use this information to update the probabilities of who the thief is.</p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="font-semibold">Here's how it works:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            <li><strong>Start:</strong> Before any clues, every suspect is equally likely. If there are 5 suspects, each has a 1 in 5 (or 20%) chance. This is the <strong>prior probability</strong>.</li>
                            <li><strong>Clue 1:</strong> A clue eliminates some suspects. For example, "The thief had kitchen access". The total probability (100%) is now redistributed only among the suspects who had access.</li>
                            <li><strong>Update:</strong> The likelihood of the remaining suspects increases, because the "possibility space" has shrunk. The new probability is the <strong>posterior probability</strong>.</li>
                            <li><strong>Repeat:</strong> Each new clue narrows the field further, allowing you to pinpoint the most likely culprit based on the evidence provided.</li>
                        </ul>
                    </div>
                    <p>This is the same kind of reasoning detectives, doctors, and scientists use every day to make decisions based on new evidence!</p>
                     <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
                        <h4 className="font-bold text-blue-800">Try This at Home!</h4>
                        <p className="text-blue-700">Take a standard deck of 52 cards. What's the probability of drawing a King? (4/52). Now, what's the probability of drawing a King GIVEN that you know the card is a face card (Jack, Queen, King)? The probability changes!</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FindTheThief;
