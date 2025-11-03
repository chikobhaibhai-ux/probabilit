import React, { useState, useEffect, useRef } from 'react';
import { BadgeType } from '../types';
import { BADGE_DEFINITIONS } from '../constants';

interface HeaderProps {
  points: number;
  badges: BadgeType[];
}

const Header: React.FC<HeaderProps> = ({ points, badges }) => {
  const [isPointsAnimating, setIsPointsAnimating] = useState(false);
  const prevPointsRef = useRef(points);

  useEffect(() => {
    if (points !== prevPointsRef.current) {
      setIsPointsAnimating(true);
      const timer = setTimeout(() => setIsPointsAnimating(false), 600); // Animation duration
      prevPointsRef.current = points;
      return () => clearTimeout(timer);
    }
  }, [points]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="text-2xl font-bold text-indigo-600">
            🎲 Chance Champions
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {badges.map(badge => (
                <div key={badge} className="group relative">
                  <span className="text-2xl cursor-pointer">{BADGE_DEFINITIONS[badge].icon}</span>
                  <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2">
                    <p className="font-bold">{badge}</p>
                    <p>{BADGE_DEFINITIONS[badge].description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={`bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-full transition-all ${isPointsAnimating ? 'animate-pulse-once' : ''}`}>
              {points.toLocaleString()} PP
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;