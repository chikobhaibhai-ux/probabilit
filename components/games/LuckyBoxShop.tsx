import React, { useState, useMemo } from 'react';
import { LuckyBox, LuckyBoxItem, BadgeType } from '../../types';
import { LUCKY_BOXES } from '../../constants';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface LuckyBoxShopProps {
  goBack: () => void;
  currentPoints: number;
  updatePoints: (amount: number) => void;
  earnBadge: (badge: BadgeType) => void;
}

const getRarityColor = (rarity: LuckyBoxItem['rarity']) => {
    switch (rarity) {
        case 'common': return 'text-gray-500';
        case 'uncommon': return 'text-blue-500';
        case 'rare': return 'text-purple-500';
        case 'legendary': return 'text-yellow-500';
    }
}

const calculateEV = (box: LuckyBox) => box.items.reduce((acc, item) => acc + item.value * item.probability, 0);

const LuckyBoxShop: React.FC<LuckyBoxShopProps> = ({ goBack, currentPoints, updatePoints, earnBadge }) => {
  const [result, setResult] = useState<LuckyBoxItem | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [showLearnMode, setShowLearnMode] = useState(false);
  const [showActivityResult, setShowActivityResult] = useState(false);

  const highestEVBoxId = useMemo(() => {
    return LUCKY_BOXES.reduce((bestBox, currentBox) => {
        return calculateEV(currentBox) > calculateEV(bestBox) ? currentBox : bestBox;
    }, LUCKY_BOXES[0]).id;
  }, []);

  const openBox = (box: LuckyBox) => {
    if (currentPoints < box.price) return;
    
    if (box.id === highestEVBoxId) {
        earnBadge(BadgeType.SmartInvestor);
    }

    setIsOpening(true);
    updatePoints(-box.price);

    const rand = Math.random();
    let cumulativeProb = 0;
    const wonItem = box.items.find(item => {
      cumulativeProb += item.probability;
      return rand < cumulativeProb;
    })!;

    setTimeout(() => {
      updatePoints(wonItem.value);
      setResult(wonItem);
      setIsOpening(false);
      setShowActivityResult(true);
      earnBadge(BadgeType.FirstWin);
      if(currentPoints + wonItem.value - box.price > 2000) {
        earnBadge(BadgeType.HighRoller);
      }
    }, 1500);
  };

  return (
    <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Button onClick={goBack} variant="secondary">← Back to Games</Button>
            <h1 className="text-4xl font-bold text-center text-yellow-500">Lucky Box Shop</h1>
            <Button onClick={() => setShowLearnMode(true)} variant="ghost">🎓 Learn Mode</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {LUCKY_BOXES.map(box => (
                <div key={box.id} className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center border-t-4 border-yellow-400">
                    <div className={`text-7xl mb-4 transition-transform duration-1000 ${isOpening ? 'animate-spin' : ''}`}>🎁</div>
                    <h2 className={`text-2xl font-bold mb-2 ${box.color.replace('bg-', 'text-')}`}>{box.name}</h2>
                    <p className="font-semibold text-lg text-gray-700 mb-4">{box.price} PP</p>
                    <div className="w-full mb-4">
                        <h4 className="font-bold text-sm mb-1 text-gray-600">Possible Items:</h4>
                        <ul>
                            {box.items.map(item => (
                                <li key={item.name} className={`flex justify-between text-sm ${getRarityColor(item.rarity)}`}>
                                    <span>{item.name}</span>
                                    <span>{(item.probability * 100).toFixed(0)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Button onClick={() => openBox(box)} disabled={currentPoints < box.price || isOpening} className="mt-auto w-full">
                        {isOpening ? 'Opening...' : 'Buy & Open'}
                    </Button>
                </div>
            ))}
        </div>

        <Modal isOpen={showActivityResult} onClose={() => setShowActivityResult(false)} title="You got...">
            {result && (
                <div className="text-center">
                    <h3 className={`text-3xl font-bold ${getRarityColor(result.rarity)} animate-pulse-once`}>{result.name}</h3>
                    <p className="text-gray-600">Value: {result.value} PP</p>
                    <p className={`mt-2 text-sm font-semibold ${getRarityColor(result.rarity)}`}>({result.rarity.toUpperCase()})</p>
                </div>
            )}
        </Modal>

        <Modal isOpen={showLearnMode} onClose={() => setShowLearnMode(false)} title="🎓 Learn Mode: Expected Value">
            <div className="space-y-4">
                <p><strong>Expected Value (EV)</strong> is a key concept in probability that helps in decision-making. It tells you the average outcome you can expect from a random event if you repeat it many times.</p>
                <p>The formula is: <code className="bg-gray-200 p-1 rounded">EV = (Probability₁ × Value₁) + (Probability₂ × Value₂) + ...</code></p>
                
                <div className="space-y-3 pt-4">
                    <h4 className="font-bold">Let's calculate the EV for each box:</h4>
                    {LUCKY_BOXES.map(box => {
                        const ev = calculateEV(box);
                        return (
                        <div key={box.id} className="bg-gray-100 p-3 rounded-lg">
                            <p className="font-semibold">{box.name} (Cost: {box.price} PP)</p>
                            <p className="text-sm">
                                {box.items.map(i => `(${(i.probability*100)}% × ${i.value} PP)`).join(' + ')}
                                = <span className="font-bold">{ev.toFixed(2)} PP</span>
                            </p>
                            <p className={`text-sm font-bold ${ev > box.price ? 'text-green-600' : 'text-red-600'}`}>
                                On average, you {ev > box.price ? 'gain' : 'lose'} {(Math.abs(ev - box.price)).toFixed(2)} PP each time you open this box.
                            </p>
                        </div>
                        )
                    })}
                </div>
                <p>Choosing the box with the highest Expected Value gives you the best chance of profiting in the long run!</p>
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
                    <h4 className="font-bold text-blue-800">Try This at Home!</h4>
                    <p className="text-blue-700">Create your own lucky dip! Get 10 small pieces of paper. Write "10 points" on one, "5 points" on three, and "1 point" on six. Put them in a bag. What's the expected value of drawing one piece? Does your experimental result (after 10 draws) match the theory?</p>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default LuckyBoxShop;