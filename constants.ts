
import { Game, GameCardInfo, LuckyBox, BadgeType, GameCase, GoalTarget } from './types';

export const GAME_CARDS: GameCardInfo[] = [
  {
    id: Game.LuckyBox,
    title: 'Lucky Box Shop',
    description: 'Learn about Expected Value by opening mystery boxes. Is it worth the risk?',
    icon: '🎁',
    color: 'from-yellow-400 to-orange-500',
    concept: 'Expected Value',
  },
  {
    id: Game.FindTheThief,
    title: 'Find the Thief',
    description: 'Use clues to update your suspicions and catch the culprit!',
    icon: '🕵️',
    color: 'from-blue-400 to-indigo-500',
    concept: 'Conditional Probability',
  },
  {
    id: Game.SurvivalBridge,
    title: 'Survival Bridge',
    description: 'How many adventurers will you send across the rickety bridge? Weigh the risks.',
    icon: '🌉',
    color: 'from-green-400 to-teal-500',
    concept: 'Risk & Probability',
  },
  {
    id: Game.GoalOrMiss,
    title: 'Goal or Miss!',
    description: 'Take the penalty shot! Learn about success probability in sports.',
    icon: '⚽',
    color: 'from-red-400 to-pink-500',
    concept: 'Success Probability',
  },
  {
    id: Game.AiCoach,
    title: 'AI Probability Coach',
    description: 'Ask "Pro-Bot" any question about probability and get instant, helpful answers!',
    icon: '🤖',
    color: 'from-purple-400 to-violet-500',
    concept: 'AI Tutoring',
  },
];

export const BADGE_DEFINITIONS: Record<BadgeType, { icon: string, description: string }> = {
    [BadgeType.FirstWin]: { icon: '🎉', description: 'Win your first item from a Lucky Box!' },
    [BadgeType.HighRoller]: { icon: '💰', description: 'Have over 2000 points' },
    [BadgeType.SmartInvestor]: { icon: '🧠', description: 'Choose the box with the highest expected value' },
    [BadgeType.MasterDetective]: { icon: '🔎', description: 'Correctly identify the thief!' },
    [BadgeType.BridgeMaster]: { icon: '🏆', description: 'Successfully cross the bridge with max rewards' },
    [BadgeType.GoldenBoot]: { icon: '👟', description: 'Score a top-corner goal' },
};

export const LUCKY_BOXES: LuckyBox[] = [
    {
        id: 1,
        name: 'Bronze Box',
        price: 50,
        color: 'bg-yellow-600',
        items: [
            { name: 'Toy Car', value: 20, probability: 0.5, rarity: 'common' },
            { name: 'Stickers', value: 60, probability: 0.4, rarity: 'uncommon' },
            { name: 'Action Figure', value: 150, probability: 0.1, rarity: 'rare' },
        ]
    },
    {
        id: 2,
        name: 'Silver Box',
        price: 150,
        color: 'bg-gray-400',
        items: [
            { name: 'Stickers', value: 60, probability: 0.6, rarity: 'common' },
            { name: 'Action Figure', value: 150, probability: 0.3, rarity: 'uncommon' },
            { name: 'RC Drone', value: 500, probability: 0.1, rarity: 'rare' },
        ]
    },
    {
        id: 3,
        name: 'Gold Box',
        price: 400,
        color: 'bg-yellow-400',
        items: [
            { name: 'Action Figure', value: 150, probability: 0.75, rarity: 'common' },
            { name: 'RC Drone', value: 500, probability: 0.2, rarity: 'uncommon' },
            { name: 'Video Game Console', value: 2000, probability: 0.05, rarity: 'legendary' },
        ]
    }
];

export const GAME_CASES: GameCase[] = [
    {
        id: 'case-01',
        title: 'The Case of the Missing Cake',
        story: 'Disaster! Someone has stolen the prized Victoria Sponge from the mansion kitchen just before the annual bake-off. We have a list of suspects, but we need your help to find the culprit!',
        guiltySuspectId: 'butler',
        suspects: [
            { id: 'chef', name: 'Chef Usman', avatar: '👨‍🍳', attributes: { hasKitchenAccess: true, hasCrumbs: false, motive: 'rivalry' }},
            { id: 'butler', name: 'Ramzan the Butler', avatar: '🤵', attributes: { hasKitchenAccess: true, hasCrumbs: true, motive: 'hunger' }},
            { id: 'gardener', name: 'Shama', avatar: '👩‍🌾', attributes: { hasKitchenAccess: false, hasCrumbs: false, motive: 'revenge' }},
            { id: 'maid', name: 'Wishal the maid', avatar: '🧹', attributes: { hasKitchenAccess: true, hasCrumbs: true, motive: 'hunger' }},
            { id: 'countess', name: 'Ramisha', avatar: '👑', attributes: { hasKitchenAccess: false, hasCrumbs: false, motive: 'sabotage' }},
        ],
        clues: [
            { id: 1, text: 'A witness confirms the thief had access to the kitchen.', attribute: 'hasKitchenAccess', expectedValue: true },
            { id: 2, text: 'Forensics found cake crumbs on the culprit\'s uniform.', attribute: 'hasCrumbs', expectedValue: true },
            { id: 3, text: 'The thief was heard complaining about being hungry all morning.', attribute: 'motive', expectedValue: 'hunger' },
        ]
    }
];

export const TOTAL_ADVENTURERS = 10;
export const SURVIVAL_BRIDGE_CONFIG = [
  { count: 1, probability: 0.99, reward: 20, penalty: 0 },
  { count: 2, probability: 0.95, reward: 40, penalty: -10 },
  { count: 3, probability: 0.90, reward: 60, penalty: -20 },
  { count: 4, probability: 0.80, reward: 85, penalty: -35 },
  { count: 5, probability: 0.70, reward: 115, penalty: -50 },
  { count: 6, probability: 0.60, reward: 150, penalty: -70 },
  { count: 7, probability: 0.50, reward: 190, penalty: -90 },
  { count: 8, probability: 0.35, reward: 250, penalty: -125 },
  { count: 9, probability: 0.20, reward: 350, penalty: -175 },
  { count: 10, probability: 0.10, reward: 500, penalty: -250 },
];

export const GOAL_TARGETS: GoalTarget[] = [
  { id: 'top-left', name: 'Top Left', probability: 0.50, reward: 150, penalty: -15, gridArea: 'top-left' },
  { id: 'top-center', name: 'Top Center', probability: 0.80, reward: 50, penalty: -15, gridArea: 'top-center' },
  { id: 'top-right', name: 'Top Right', probability: 0.50, reward: 150, penalty: -15, gridArea: 'top-right' },
  { id: 'bottom-left', name: 'Bottom Left', probability: 0.75, reward: 75, penalty: -10, gridArea: 'bottom-left' },
  { id: 'bottom-center', name: 'Bottom Center', probability: 0.95, reward: 25, penalty: -10, gridArea: 'bottom-center' },
  { id: 'bottom-right', name: 'Bottom Right', probability: 0.75, reward: 75, penalty: -10, gridArea: 'bottom-right' },
];