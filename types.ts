
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

export type GameStatus = 'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER';

export interface SideBets {
  perfectPairs: number;
  plusThree: number;
}

export interface GameState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bankroll: number;
  bet: number;
  sideBets: SideBets;
  status: GameStatus;
  message: string;
  dealerCommentary: string;
  sideBetResults: {
    pp?: string;
    p3?: string;
  };
}

export type GameResult = 'PLAYER_WIN' | 'DEALER_WIN' | 'PUSH' | 'BLACKJACK' | 'BUST';
