import React, { useState, useMemo } from 'react';
import { BadgeType } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { TOTAL_ADVENTURERS, SURVIVAL_BRIDGE_CONFIG } from '../../constants';

interface SurvivalBridgeProps {
  goBack: () => void;
  updatePoints: (amount: number) => void;
  earnBadge: (badge: BadgeType) => void;
}

type GameState = 'ready' | 'crossing' | 'result';
type AdventurerStatus = 'waiting' | 'safe' | 'lost';

const SurvivalBridge: React.FC<SurvivalBridgeProps> = ({ goBack, updatePoints, earnBadge }) => {
    const [gameState, setGameState] = useState<GameState>('ready');
    const [adventurers, setAdventurers] = useState<AdventurerStatus[]>(Array(TOTAL_ADVENTURERS).fill('waiting'));
    const [selectedCount, setSelectedCount] = useState(1);
    const [result, setResult] = useState<{ success: boolean; points: number; count: number } | null>(null);
    const [showLearnMode, setShowLearnMode] = useState(false);

    const config = useMemo(() => SURVIVAL_BRIDGE_CONFIG.find(c => c.count === selectedCount)!, [selectedCount]);

    const handleSendAcross = () => {
        setGameState('crossing');
        const isSuccess = Math.random() < config.probability;

        setTimeout(() => {
            const pointsChange = isSuccess ? config.reward : config.penalty;
            updatePoints(pointsChange);

            if (isSuccess) {
                if (selectedCount === TOTAL_ADVENTURERS) {
                    earnBadge(BadgeType.BridgeMaster);
                }
                const newAdventurers = [...adventurers];
                let toMakeSafe = selectedCount;
                for(let i=0; i<newAdventurers.length; i++) {
                    if(newAdventurers[i] === 'waiting' && toMakeSafe > 0) {
                        newAdventurers[i] = 'safe';
                        toMakeSafe--;
                    }
                }
                setAdventurers(newAdventurers);
            } else {
                 const newAdventurers = [...adventurers];
                let toMakeLost = selectedCount;
                for(let i=0; i<newAdventurers.length; i++) {
                    if(newAdventurers[i] === 'waiting' && toMakeLost > 0) {
                        newAdventurers[i] = 'lost';
                        toMakeLost--;
                    }
                }
                setAdventurers(newAdventurers);
            }

            setResult({ success: isSuccess, points: pointsChange, count: selectedCount });
            setGameState('result');
        }, 2000); // 2-second animation for crossing
    };
    
    const handlePlayAgain = () => {
        const waitingCount = adventurers.filter(a => a === 'waiting').length;
        if (waitingCount === 0) {
             setAdventurers(Array(TOTAL_ADVENTURERS).fill('waiting'));
             setSelectedCount(1);
        } else {
            setSelectedCount(Math.min(1, waitingCount));
        }
        setResult(null);
        setGameState('ready');
    };

    const getAdventurerIcon = (status: AdventurerStatus) => {
        if (status === 'safe') return '✅';
        if (status === 'lost') return '❌';
        return '🚶';
    }

    const availableAdventurers = adventurers.filter(a => a === 'waiting').length;

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Button onClick={goBack} variant="secondary">← Back to Games</Button>
                <h1 className="text-4xl font-bold text-center text-green-500">Survival Bridge</h1>
                <Button onClick={() => setShowLearnMode(true)} variant="ghost">🎓 Learn Mode</Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700">Adventurer's Camp</h2>
                    <div className="flex justify-center flex-wrap gap-2 mt-4 text-3xl">
                        {adventurers.map((status, index) => <span key={index}>{getAdventurerIcon(status)}</span>)}
                    </div>
                    <p className="mt-2 text-gray-600">{availableAdventurers} / {TOTAL_ADVENTURERS} adventurers waiting to cross.</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-center mb-4">Plan Your Crossing</h3>
                    <div className="w-full max-w-lg mx-auto">
                        <label htmlFor="adventurer-slider" className="font-semibold">Adventurers to send: <span className="text-indigo-600 font-bold text-xl">{selectedCount}</span></label>
                        <input
                            id="adventurer-slider"
                            type="range"
                            min="1"
                            max={availableAdventurers > 0 ? availableAdventurers : 1}
                            value={selectedCount}
                            onChange={(e) => setSelectedCount(Number(e.target.value))}
                            disabled={gameState !== 'ready' || availableAdventurers === 0}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-6">
                        <div className="bg-blue-100 p-4 rounded-lg">
                            <p className="font-semibold text-blue-800">Success Chance</p>
                            <p className="text-2xl font-bold text-blue-600">{(config.probability * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg">
                            <p className="font-semibold text-green-800">Potential Reward</p>
                            <p className="text-2xl font-bold text-green-600">+{config.reward} PP</p>
                        </div>
                        <div className="bg-red-100 p-4 rounded-lg">
                            <p className="font-semibold text-red-800">Potential Penalty</p>
                            <p className="text-2xl font-bold text-red-600">{config.penalty} PP</p>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <Button 
                            onClick={handleSendAcross} 
                            disabled={gameState !== 'ready' || availableAdventurers === 0}
                            className="w-full max-w-xs"
                        >
                            {gameState === 'crossing' ? 'Crossing...' : 'Send Across Bridge'}
                        </Button>
                    </div>
                </div>
            </div>

             <Modal isOpen={gameState === 'result'} onClose={handlePlayAgain} title="The Crossing is Over!">
                {result && (
                    <div className="text-center">
                        {result.success ? (
                             <>
                                <span className="text-7xl block mb-4 animate-pulse-once">🎉</span>
                                <h3 className="text-3xl font-bold text-green-600">Success!</h3>
                                <p className="text-lg mt-2">All <strong>{result.count}</strong> adventurers made it across safely.</p>
                                <p className="text-gray-600 mt-1">You earned {result.points} Probability Points!</p>
                            </>
                        ) : (
                             <>
                                <span className="text-7xl block mb-4 animate-shake">💥</span>
                                <h3 className="text-3xl font-bold text-red-600">Disaster!</h3>
                                <p className="text-lg mt-2">The bridge collapsed! All <strong>{result.count}</strong> adventurers were lost.</p>
                                <p className="text-gray-600 mt-1">You lost {Math.abs(result.points)} Probability Points.</p>
                            </>
                        )}
                        <Button onClick={handlePlayAgain} className="mt-6">
                            {availableAdventurers > 0 ? 'Next Crossing' : 'Start New Expedition'}
                        </Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={showLearnMode} onClose={() => setShowLearnMode(false)} title="🎓 Learn Mode: Risk vs. Reward">
                 <div className="space-y-4">
                    <p>This game is all about balancing <strong>risk</strong> and <strong>reward</strong>. Every choice you make has a potential upside and a potential downside, governed by probability.</p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <ul className="list-disc list-inside space-y-2">
                           <li><strong>Low Risk, Low Reward:</strong> Sending 1 adventurer is very safe (99% success), but the reward is small (+20 PP). You're unlikely to lose, but you won't gain much either.</li>
                           <li><strong>High Risk, High Reward:</strong> Sending all 10 adventurers has a very low chance of success (10%), but the potential reward is huge (+500 PP). The penalty for failure is also massive (-250 PP).</li>
                           <li><strong>The Smart Play?</strong> Is there a "best" choice? We can use <strong>Expected Value (EV)</strong> again, just like in the Lucky Box Shop!</li>
                        </ul>
                    </div>
                    <p>The formula for this game is: <code className="bg-gray-200 p-1 rounded">EV = (Success Chance × Reward) + (Failure Chance × Penalty)</code></p>
                    <p>Let's calculate the EV for sending 5 adventurers:</p>
                    <p className="bg-gray-100 p-3 rounded-lg text-sm">EV = (70% × 115 PP) + (30% × -50 PP) = 80.5 + (-15) = <span className="font-bold">65.5 PP</span></p>
                    <p>This means, on average, you can expect to gain about 65.5 points each time you send 5 adventurers. Try calculating the EV for other amounts! The one with the highest EV is mathematically the best choice in the long run.</p>
                     <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
                        <h4 className="font-bold text-blue-800">Try This at Home!</h4>
                        <p className="text-blue-700">Play a game with a friend using a coin. Player A gets 1 point for heads. Player B gets 3 points for tails, but only if they correctly call "tails" before the flip. How do the probabilities and potential rewards influence who has the advantage?</p>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default SurvivalBridge;