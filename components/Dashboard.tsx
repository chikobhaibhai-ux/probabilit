import React from 'react';
import { Game } from '../types';
import { GAME_CARDS } from '../constants';
import GameCard from './GameCard';

interface DashboardProps {
  navigateTo: (page: Game) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigateTo }) => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-gray-800">Welcome To Bs Math 7th 2M)</h1>
      <p className="text-center text-gray-600 mb-8 sm:mb-12">Select a game to start learning about probability.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAME_CARDS.map((game, index) => (
          <GameCard 
            key={game.id} 
            game={game} 
            onClick={() => navigateTo(game.id)}
            className="animate-fade-in-down"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;