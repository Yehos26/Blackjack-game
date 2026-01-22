import { GameStatus } from '../types';

// Dealer commentary phrases for different situations
const BETTING_PHRASES = [
    "Place your bets wisely, player.",
    "Feeling lucky today?",
    "The cards await your decision.",
    "Ready to test your fortune?",
];

const PLAYING_PHRASES = [
    "Interesting choice...",
    "The tension builds.",
    "What will you do next?",
    "Think carefully now.",
    "The odds are watching.",
];

const PLAYER_WIN_PHRASES = [
    "Well played! Fortune smiles upon you.",
    "A worthy victory indeed.",
    "The cards favored you this time.",
    "Impressive play!",
];

const DEALER_WIN_PHRASES = [
    "Better luck next time, friend.",
    "The house prevails... for now.",
    "Sometimes the cards just don't cooperate.",
    "A close game, but not quite.",
];

const BLACKJACK_PHRASES = [
    "BLACKJACK! Magnificent!",
    "A perfect 21! Well done!",
    "The cards have blessed you!",
];

const BUST_PHRASES = [
    "Oh no, you've gone over!",
    "Busted! Perhaps a bit too bold?",
    "The house thanks you for your enthusiasm.",
];

const PUSH_PHRASES = [
    "A tie! The cards show mercy.",
    "Neither wins, neither loses.",
    "An honorable draw.",
];

function getRandomPhrase(phrases: string[]): string {
    return phrases[Math.floor(Math.random() * phrases.length)];
}

export async function getDealerCommentary(
    playerCards: string,
    dealerCards: string,
    status: GameStatus,
    result?: string
): Promise<string> {
    // Simulate a small delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));

    if (status === 'BETTING') {
        return getRandomPhrase(BETTING_PHRASES);
    }

    if (status === 'PLAYING') {
        return getRandomPhrase(PLAYING_PHRASES);
    }

    if (status === 'GAME_OVER' && result) {
        switch (result) {
            case 'PLAYER_WIN':
                return getRandomPhrase(PLAYER_WIN_PHRASES);
            case 'DEALER_WIN':
                return getRandomPhrase(DEALER_WIN_PHRASES);
            case 'BLACKJACK':
                return getRandomPhrase(BLACKJACK_PHRASES);
            case 'BUST':
                return getRandomPhrase(BUST_PHRASES);
            case 'PUSH':
                return getRandomPhrase(PUSH_PHRASES);
            default:
                return getRandomPhrase(PLAYING_PHRASES);
        }
    }

    return getRandomPhrase(PLAYING_PHRASES);
}
