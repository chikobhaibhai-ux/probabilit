import React, { useState } from 'react';
import { BadgeType, GoalTarget } from '../../types';
import { GOAL_TARGETS } from '../../constants';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface GoalOrMissProps {
  goBack: () => void;
  updatePoints: (amount: number) => void;
  earnBadge: (badge: BadgeType) => void;
}

type GameState = 'ready' | 'aiming' | 'shooting' | 'result';

const GoalOrMiss: React.FC<GoalOrMissProps> = ({ goBack, updatePoints, earnBadge }) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [selectedTarget, setSelectedTarget] = useState<GoalTarget | null>(null);
  const [result, setResult] = useState<{ outcome: 'goal' | 'miss'; points: number } | null>(null);
  const [showLearnMode, setShowLearnMode] = useState(false);

  const handleSelectTarget = (target: GoalTarget) => {
    if (gameState === 'ready' || gameState === 'aiming') {
      setSelectedTarget(target);
      setGameState('aiming');
    }
  };

  const handleTakeShot = () => {
    if (!selectedTarget) return;

    setGameState('shooting');
    const isGoal = Math.random() < selectedTarget.probability;

    setTimeout(() => {
      const pointsChange = isGoal ? selectedTarget.reward : selectedTarget.penalty;
      updatePoints(pointsChange);

      if (isGoal && (selectedTarget.id === 'top-left' || selectedTarget.id === 'top-right')) {
        earnBadge(BadgeType.GoldenBoot);
      }
      
      setResult({ outcome: isGoal ? 'goal' : 'miss', points: pointsChange });
      setGameState('result');
    }, 1000); // 1s animation
  };

  const resetGame = () => {
    setGameState('ready');
    setSelectedTarget(null);
    setResult(null);
  };
  
  const calculateEV = (target: GoalTarget) => {
    return (target.probability * target.reward) + ((1 - target.probability) * target.penalty);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <Button onClick={goBack} variant="secondary">← Back to Games</Button>
        <h1 className="text-4xl font-bold text-center text-red-500">Goal or Miss!</h1>
        <Button onClick={() => setShowLearnMode(true)} variant="ghost">🎓 Learn Mode</Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <div className="relative aspect-[3/2] bg-green-200 border-8 border-white rounded-lg overflow-hidden flex justify-center items-end" style={{ background: 'linear-gradient(to bottom, #86efac, #22c55e)'}}>
          {/* Goal Structure */}
          <div className="absolute top-0 left-0 w-full h-full p-2">
            <div className="relative w-full h-full border-4 border-white border-t-0">
                {/* Net pattern */}
                 <div className="absolute w-full h-full" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.2) 2px, transparent 2px)',
                    backgroundSize: '30px 30px',
                 }}></div>
            </div>
          </div>
          
          {/* Targets */}
          <div className="absolute top-0 left-0 w-full h-full grid p-2"
            style={{ gridTemplateAreas: '"top-left top-center top-right" "bottom-left bottom-center bottom-right"', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1.5fr 1fr' }}
          >
            {GOAL_TARGETS.map((target) => (
              <div
                key={target.id}
                style={{ gridArea: target.gridArea }}
                onClick={() => handleSelectTarget(target)}
                className={`group border-2 border-dashed border-transparent hover:border-yellow-300 rounded-md transition-all duration-200 flex justify-center items-center cursor-pointer ${selectedTarget?.id === target.id ? 'bg-yellow-300/50' : ''}`}
              >
                 <div className="text-center bg-black/50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                    <p className="font-bold">{target.name}</p>
                    <p>{(target.probability * 100).toFixed(0)}% Chance</p>
                    <p>{target.reward} PP</p>
                 </div>
              </div>
            ))}
          </div>
          
          {/* Ball */}
          <div className={`absolute transition-all duration-1000 ease-out transform -translate-x-1/2 -translate-y-1/2 ${gameState === 'shooting' ? 'scale-75' : 'scale-100'}`}
             style={{
                left: gameState === 'shooting' && selectedTarget ? `calc(${{'top-left': '15%', 'top-center': '50%', 'top-right': '85%', 'bottom-left': '20%', 'bottom-center': '50%', 'bottom-right': '80%'}[selectedTarget.id]})` : '50%',
                top: gameState === 'shooting' && selectedTarget ? `calc(${{'top-left': '25%', 'top-center': '25%', 'top-right': '25%', 'bottom-left': '75%', 'bottom-center': '75%', 'bottom-right': '75%'}[selectedTarget.id]})` : '95%',
              }}
          >
            <span className={`text-4xl block transition-transform duration-1000 ${gameState === 'shooting' ? 'rotate-360' : ''}`}>⚽</span>
          </div>
        </div>
        
        <div className="text-center mt-6">
            <h2 className="text-xl font-semibold mb-2">{
                gameState === 'ready' ? 'Choose where to aim' :
                gameState === 'aiming' ? `Aiming for: ${selectedTarget?.name}` :
                gameState === 'shooting' ? 'Taking the shot...' :
                'Result'
            }</h2>
            <Button 
                onClick={handleTakeShot}
                disabled={gameState !== 'aiming'}
            >
                Take the Shot!
            </Button>
        </div>
      </div>
      
      <Modal isOpen={gameState === 'result'} onClose={resetGame} title={result?.outcome === 'goal' ? 'GOOOOAL!' : 'Ooh, a Miss!'}>
        {result && (
            <div className="text-center">
                {result.outcome === 'goal' ? (
                     <>
                        <span className="text-7xl block mb-4 animate-pulse-once">🥅🎉</span>
                        <h3 className="text-3xl font-bold text-green-600">You Scored!</h3>
                        <p className="text-gray-600 mt-1">You earned {result.points} Probability Points!</p>
                    </>
                ) : (
                     <>
                        <span className="text-7xl block mb-4 animate-shake">💨😥</span>
                        <h3 className="text-3xl font-bold text-red-600">So Close!</h3>
                        <p className="text-gray-600 mt-1">You lost {Math.abs(result.points)} Probability Points.</p>
                    </>
                )}
                <Button onClick={resetGame} className="mt-6">Play Again</Button>
            </div>
        )}
      </Modal>

      <Modal isOpen={showLearnMode} onClose={() => setShowLearnMode(false)} title="🎓 Learn Mode: Success Probability">
        <div className="space-y-4">
          <p><strong>Success Probability</strong> is simply the chance that a desired outcome will occur. In sports, this is everywhere!</p>
          <ul className="list-disc list-inside bg-gray-100 p-4 rounded-lg">
            <li>A basketball player's <strong>free-throw percentage</strong>.</li>
            <li>A baseball player's <strong>batting average</strong>.</li>
            <li>A quarterback's <strong>completion percentage</strong>.</li>
          </ul>
          <p>In this game, aiming for the corners is like a player taking a difficult, high-reward shot. It's less likely to succeed, but it's worth more if it does. Aiming for the center is a "safe" shot—high probability, but a low reward.</p>
          <p>We can even calculate the <strong>Expected Value (EV)</strong> for each shot, just like in the other games:</p>
          <p className="font-semibold">EV = (Success Chance × Reward) + (Failure Chance × Penalty)</p>
          <div className="space-y-2">
            {GOAL_TARGETS.map(t => (
                <div key={t.id} className="text-sm bg-gray-50 p-2 rounded">
                    <strong>{t.name}:</strong> ({t.probability.toFixed(2)} × {t.reward}) + ({(1 - t.probability).toFixed(2)} × {t.penalty}) = <span className="font-bold">{calculateEV(t).toFixed(2)} PP</span>
                </div>
            ))}
          </div>
          <p>The shot with the highest EV is, over many attempts, the most profitable choice. Does this match your intuition?</p>
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
            <h4 className="font-bold text-blue-800">Try This at Home!</h4>
            <p className="text-blue-700">Set up a target (like a bucket or a hoop). Take 10 shots from an "easy" distance and 10 shots from a "hard" distance. Record your success rate for each. This is your personal experimental probability for those two tasks!</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalOrMiss;