import React from 'react';
import { GameCardInfo } from '../types';

interface GameCardProps {
  game: GameCardInfo;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick, className = '', style }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between bg-gradient-to-br ${game.color} ${className}`}
      style={style}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{game.title}</h2>
          <span className="text-4xl">{game.icon}</span>
        </div>
        <p className="text-white opacity-90 mb-4">{game.description}</p>
      </div>
      <div className="mt-auto">
         <span className="text-xs font-semibold bg-white/30 text-white px-2 py-1 rounded-full">{game.concept}</span>
      </div>
    </div>
  );
};

export default GameCard;