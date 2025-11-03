
import React, { useState, useCallback } from 'react';
import { Game, BadgeType } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LuckyBoxShop from './components/games/LuckyBoxShop';
import FindTheThief from './components/games/FindTheThief';
import SurvivalBridge from './components/games/SurvivalBridge';
import GoalOrMiss from './components/games/GoalOrMiss';
import AiCoach from './components/games/AiCoach';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Game | 'dashboard'>('dashboard');
  const [points, setPoints] = useState<number>(1000);
  const [badges, setBadges] = useState<BadgeType[]>([]);

  const earnBadge = useCallback((newBadge: BadgeType) => {
    if (!badges.includes(newBadge)) {
      setBadges(prev => [...prev, newBadge]);
    }
  }, [badges]);

  const updatePoints = useCallback((amount: number) => {
    setPoints(prev => prev + amount);
  }, []);

  const navigateTo = (page: Game | 'dashboard') => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Game.LuckyBox:
        return <LuckyBoxShop goBack={() => navigateTo('dashboard')} currentPoints={points} updatePoints={updatePoints} earnBadge={earnBadge} />;
      case Game.FindTheThief:
        return <FindTheThief goBack={() => navigateTo('dashboard')} updatePoints={updatePoints} earnBadge={earnBadge} />;
      case Game.SurvivalBridge:
        return <SurvivalBridge goBack={() => navigateTo('dashboard')} updatePoints={updatePoints} earnBadge={earnBadge} />;
      case Game.GoalOrMiss:
        return <GoalOrMiss goBack={() => navigateTo('dashboard')} updatePoints={updatePoints} earnBadge={earnBadge} />;
      case Game.AiCoach:
        return <AiCoach goBack={() => navigateTo('dashboard')} />;
      case 'dashboard':
      default:
        return <Dashboard navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header points={points} badges={badges} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
