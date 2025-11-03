
export enum Game {
  LuckyBox = 'Lucky Box Shop',
  FindTheThief = 'Find the Thief',
  SurvivalBridge = 'Survival Bridge',
  GoalOrMiss = 'Goal or Miss',
  AiCoach = 'AI Probability Coach',
}

export enum BadgeType {
    FirstWin = 'First Win!',
    HighRoller = 'High Roller',
    SmartInvestor = 'Smart Investor',
    MasterDetective = 'Master Detective',
    BridgeMaster = 'Bridge Master',
    GoldenBoot = 'Golden Boot'
}

export interface GameCardInfo {
  id: Game;
  title: string;
  description: string;
  icon: string; // Emoji or SVG path
  color: string;
  concept: string;
}

export interface LuckyBoxItem {
    name: string;
    value: number;
    probability: number; // 0 to 1
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface LuckyBox {
    id: number;
    name: string;
    price: number;
    items: LuckyBoxItem[];
    color: string;
}

// Types for Find The Thief
export interface Suspect {
    id: string;
    name: string;
    avatar: string;
    attributes: Record<string, boolean | string>;
}

export interface Clue {
    id: number;
    text: string;
    attribute: string; 
    expectedValue: boolean | string;
}

export interface GameCase {
    id: string;
    title: string;
    story: string;
    suspects: Suspect[];
    clues: Clue[];
    guiltySuspectId: string;
}

// Types for Goal or Miss
export interface GoalTarget {
  id: string;
  name: string;
  probability: number;
  reward: number;
  penalty: number;
  gridArea: string; // for CSS grid-area
}