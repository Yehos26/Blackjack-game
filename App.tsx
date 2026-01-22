
import React, { useState, useEffect } from 'react';
import { Card, GameState, GameStatus, GameResult, SideBets } from './types';
import { createDeck, calculateScore } from './utils/deck';
import { getDealerCommentary } from './services/geminiService';
import CardUI from './components/CardUI';

const INITIAL_BANKROLL = 1000;

interface ChipProps {
  value: number;
  color: string;
  onClick: (val: number) => void;
  disabled?: boolean;
}

const Chip: React.FC<ChipProps> = ({ value, color, onClick, disabled }) => (
  <button
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`
      relative w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-[10px] md:text-sm chip-shadow
      transition-all duration-300 transform hover:-translate-y-2 active:scale-95
      disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed
      ${color} border-[4px] md:border-[6px] border-dashed border-white/30 text-white flex-shrink-0 group overflow-hidden
    `}
  >
    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
    <div className="absolute inset-0.5 md:inset-1 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/5">
      {value}
    </div>
  </button>
);

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    deck: [],
    playerHand: [],
    dealerHand: [],
    bankroll: INITIAL_BANKROLL,
    bet: 0,
    sideBets: { perfectPairs: 0, plusThree: 0 },
    status: 'BETTING',
    message: 'Place your bets',
    dealerCommentary: 'Welcome. Do you dare to sit at the Midnight Ace table?',
    sideBetResults: {}
  });

  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [activeBetType, setActiveBetType] = useState<'MAIN' | 'PP' | 'P3'>('MAIN');
  const [hasDoubled, setHasDoubled] = useState(false);
  const [splitHand, setSplitHand] = useState<Card[]>([]);
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [splitBet, setSplitBet] = useState(0);

  useEffect(() => {
    setState(prev => ({ ...prev, deck: createDeck() }));
  }, []);

  const updateCommentary = async (playerHand: Card[], dealerHand: Card[], status: GameStatus, result?: string) => {
    setIsLoadingCommentary(true);
    const pStr = playerHand.map(c => `${c.rank}${c.suit}`).join(', ');
    const dStr = dealerHand.map(c => `${c.rank}${c.suit}`).join(', ');
    const commentary = await getDealerCommentary(pStr, dStr, status, result);
    setState(prev => ({ ...prev, dealerCommentary: commentary }));
    setIsLoadingCommentary(false);
  };

  const getCard = (deck: Card[]) => {
    const currentDeck = deck.length < 5 ? createDeck() : [...deck];
    const card = currentDeck.pop()!;
    return { card, newDeck: currentDeck };
  };

  const handleChipClick = (amount: number) => {
    if (state.status !== 'BETTING') return;
    if (state.bankroll < amount) return;

    setState(prev => {
      const newBankroll = prev.bankroll - amount;
      if (activeBetType === 'MAIN') return { ...prev, bet: prev.bet + amount, bankroll: newBankroll };
      if (activeBetType === 'PP') return { ...prev, sideBets: { ...prev.sideBets, perfectPairs: prev.sideBets.perfectPairs + amount }, bankroll: newBankroll };
      if (activeBetType === 'P3') return { ...prev, sideBets: { ...prev.sideBets, plusThree: prev.sideBets.plusThree + amount }, bankroll: newBankroll };
      return prev;
    });
  };

  const handleCircleClick = (type: 'MAIN' | 'PP' | 'P3') => {
    if (state.status !== 'BETTING') return;
    setActiveBetType(type);
  };

  const startDeal = () => {
    if (state.bet <= 0) {
      setState(prev => ({ ...prev, message: 'You must place a main bet first!' }));
      return;
    }
    setState(prev => ({ ...prev, status: 'PLAYING', message: 'Dealing...', sideBetResults: {} }));
    setTimeout(() => dealInitialCards(), 300);
  };

  const checkSideBets = (p1: Card, p2: Card, d1: Card): { ppWin: number, ppMsg: string, p3Win: number, p3Msg: string } => {
    let ppWin = 0;
    let ppMsg = "";
    let p3Win = 0;
    let p3Msg = "";

    if (p1.rank === p2.rank) {
      if (p1.suit === p2.suit) { ppWin = state.sideBets.perfectPairs * 26; ppMsg = "Perfect Pair (25:1)"; }
      else if ((['hearts', 'diamonds'].includes(p1.suit) && ['hearts', 'diamonds'].includes(p2.suit)) ||
        (['clubs', 'spades'].includes(p1.suit) && ['clubs', 'spades'].includes(p2.suit))) {
        ppWin = state.sideBets.perfectPairs * 13; ppMsg = "Colored Pair (12:1)";
      }
      else { ppWin = state.sideBets.perfectPairs * 7; ppMsg = "Mixed Pair (6:1)"; }
    }

    const cards = [p1, p2, d1];
    const ranks = cards.map(c => "A2345678910JQK".indexOf(c.rank)).sort((a, b) => a - b);
    const isFlush = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
    const isStraight = (ranks[2] - ranks[1] === 1 && ranks[1] - ranks[0] === 1) || (ranks[0] === 0 && ranks[1] === 11 && ranks[2] === 12);
    const isThreeOfAKind = p1.rank === p2.rank && p2.rank === d1.rank;

    if (isFlush && isThreeOfAKind) { p3Win = state.sideBets.plusThree * 101; p3Msg = "Suited Trips (100:1)"; }
    else if (isFlush && isStraight) { p3Win = state.sideBets.plusThree * 41; p3Msg = "Straight Flush (40:1)"; }
    else if (isThreeOfAKind) { p3Win = state.sideBets.plusThree * 31; p3Msg = "Three of a Kind (30:1)"; }
    else if (isStraight) { p3Win = state.sideBets.plusThree * 11; p3Msg = "Straight (10:1)"; }
    else if (isFlush) { p3Win = state.sideBets.plusThree * 6; p3Msg = "Flush (5:1)"; }

    return { ppWin, ppMsg, p3Win, p3Msg };
  };

  const dealInitialCards = () => {
    setState(prev => {
      let currentDeck = prev.deck.length < 10 ? createDeck() : [...prev.deck];
      const p1 = currentDeck.pop()!;
      const d1 = currentDeck.pop()!;
      const p2 = currentDeck.pop()!;
      const d2 = currentDeck.pop()!;

      const pHand = [p1, p2];
      const dHand = [d1, d2];

      const { ppWin, ppMsg, p3Win, p3Msg } = checkSideBets(p1, p2, d1);
      const totalSideWin = ppWin + p3Win;

      const pScore = calculateScore(pHand);
      if (pScore === 21) {
        setTimeout(() => endGameInternal(pHand, dHand, 'BLACKJACK', currentDeck), 500);
        return {
          ...prev,
          deck: currentDeck,
          playerHand: pHand,
          dealerHand: dHand,
          bankroll: prev.bankroll + totalSideWin,
          sideBetResults: { pp: ppMsg, p3: p3Msg },
          message: 'Blackjack!',
          status: 'DEALER_TURN' // Set to dealer turn immediately so no buttons show
        };
      } else {
        updateCommentary(pHand, [d1], 'PLAYING', totalSideWin > 0 ? `Side Bet Win: ${ppMsg} ${p3Msg}` : undefined);
        return {
          ...prev,
          deck: currentDeck,
          playerHand: pHand,
          dealerHand: dHand,
          bankroll: prev.bankroll + totalSideWin,
          sideBetResults: { pp: ppMsg, p3: p3Msg },
          message: (totalSideWin > 0 ? 'Side Bet Win!' : 'Your turn'),
          status: 'PLAYING'
        };
      }
    });
  };

  const handleHit = () => {
    setState(prev => {
      const { card, newDeck } = getCard(prev.deck);
      const newPlayerHand = [...prev.playerHand, card];
      const score = calculateScore(newPlayerHand);

      if (score === 21) {
        // Switch to dealer turn IMMEDIATELY to prevent further interaction
        setTimeout(() => setState(s => ({ ...s, status: 'DEALER_TURN', message: "21! Dealer's turn..." })), 300);
        return { ...prev, deck: newDeck, playerHand: newPlayerHand, status: 'DEALER_TURN' };
      } else if (score > 21) {
        setTimeout(() => endGameInternal(newPlayerHand, prev.dealerHand, 'BUST', newDeck), 300);
        return { ...prev, deck: newDeck, playerHand: newPlayerHand, status: 'DEALER_TURN' };
      } else {
        updateCommentary(newPlayerHand, [prev.dealerHand[0]], 'PLAYING');
        return { ...prev, deck: newDeck, playerHand: newPlayerHand };
      }
    });
  };

  const handleStand = () => setState(prev => ({ ...prev, status: 'DEALER_TURN', message: "Dealer's turn..." }));

  // Double Down: Double bet, get one card, then stand
  const canDouble = state.status === 'PLAYING' && state.playerHand.length === 2 && state.bankroll >= state.bet && !hasDoubled;

  const handleDouble = () => {
    if (!canDouble) return;
    setHasDoubled(true);
    setState(prev => {
      const { card, newDeck } = getCard(prev.deck);
      const newPlayerHand = [...prev.playerHand, card];
      const score = calculateScore(newPlayerHand);
      const newBankroll = prev.bankroll - prev.bet;
      const newBet = prev.bet * 2;

      if (score > 21) {
        setTimeout(() => endGameInternal(newPlayerHand, prev.dealerHand, 'BUST', newDeck), 300);
        return { ...prev, deck: newDeck, playerHand: newPlayerHand, bankroll: newBankroll, bet: newBet, status: 'DEALER_TURN', message: 'Doubled & Busted!' };
      } else {
        setTimeout(() => setState(s => ({ ...s, status: 'DEALER_TURN', message: "Doubled! Dealer's turn..." })), 500);
        return { ...prev, deck: newDeck, playerHand: newPlayerHand, bankroll: newBankroll, bet: newBet, message: 'Double Down!' };
      }
    });
  };

  // Split: Split pair into two hands
  const canSplit = state.status === 'PLAYING' && state.playerHand.length === 2 &&
    state.playerHand[0].rank === state.playerHand[1].rank &&
    state.bankroll >= state.bet && !isSplitActive && splitHand.length === 0;

  const handleSplit = () => {
    if (!canSplit) return;
    setIsSplitActive(true);
    setSplitBet(state.bet);
    setState(prev => {
      const { card: card1, newDeck: deck1 } = getCard(prev.deck);
      const { card: card2, newDeck: deck2 } = getCard(deck1);
      const hand1 = [prev.playerHand[0], card1];
      const hand2 = [prev.playerHand[1], card2];
      setSplitHand(hand2);
      return {
        ...prev,
        deck: deck2,
        playerHand: hand1,
        bankroll: prev.bankroll - prev.bet,
        message: 'Hand 1 - Your turn'
      };
    });
  };

  useEffect(() => {
    if (state.status === 'DEALER_TURN') {
      const dScore = calculateScore(state.dealerHand);
      // Only draw if player is not bust and not blackjack (unless dealer could also have blackjack)
      const pScore = calculateScore(state.playerHand);

      if (pScore <= 21 && dScore < 17) {
        const timer = setTimeout(() => {
          setState(prev => {
            const { card, newDeck } = getCard(prev.deck);
            return { ...prev, deck: newDeck, dealerHand: [...prev.dealerHand, card] };
          });
        }, 800);
        return () => clearTimeout(timer);
      } else {
        let result: GameResult;
        if (pScore > 21) result = 'BUST';
        else if (pScore === 21 && state.playerHand.length === 2) result = 'BLACKJACK';
        else if (dScore > 21) result = 'PLAYER_WIN';
        else if (dScore > pScore) result = 'DEALER_WIN';
        else if (dScore < pScore) result = 'PLAYER_WIN';
        else result = 'PUSH';

        const timer = setTimeout(() => {
          endGameInternal(state.playerHand, state.dealerHand, result, state.deck);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.status, state.dealerHand]);

  const endGameInternal = (pHand: Card[], dHand: Card[], result: GameResult, currentDeck: Card[]) => {
    let payout = result === 'PLAYER_WIN' ? state.bet * 2 : result === 'BLACKJACK' ? state.bet * 2.5 : result === 'PUSH' ? state.bet : 0;
    setState(prev => ({
      ...prev,
      status: 'GAME_OVER',
      bankroll: prev.bankroll + payout,
      message: result === 'PLAYER_WIN' ? 'You Win!' : result === 'DEALER_WIN' ? 'You Lose' : result === 'BLACKJACK' ? 'BLACKJACK!' : result === 'BUST' ? 'Busted!' : result,
      deck: currentDeck
    }));
    updateCommentary(pHand, dHand, 'GAME_OVER', result);
  };

  const resetGame = () => {
    setHasDoubled(false);
    setSplitHand([]);
    setIsSplitActive(false);
    setSplitBet(0);
    setState(prev => ({
      ...prev, status: 'BETTING', playerHand: [], dealerHand: [], bet: 0,
      sideBets: { perfectPairs: 0, plusThree: 0 }, sideBetResults: {}, message: 'Place your bets',
      bankroll: prev.bankroll <= 0 ? INITIAL_BANKROLL : prev.bankroll
    }));
  };

  const clearBets = () => {
    if (state.status !== 'BETTING') return;
    setState(prev => ({
      ...prev,
      bankroll: prev.bankroll + prev.bet + prev.sideBets.perfectPairs + prev.sideBets.plusThree,
      bet: 0,
      sideBets: { perfectPairs: 0, plusThree: 0 }
    }));
  };

  return (
    <div className="min-h-screen md:h-screen casino-felt flex flex-col p-2 md:p-6 relative overflow-x-hidden overflow-y-auto md:overflow-hidden">
      {/* Sidebar Rules */}
      <div className={`fixed inset-y-0 left-0 w-full sm:w-96 glass z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col ${showRules ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}`}>
        <div className="p-8 flex-grow overflow-y-auto">
          <button
            onClick={() => setShowRules(false)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full z-10"
          >
            <span className="text-2xl leading-none">×</span>
          </button>

          <h3 className="gold-text text-3xl font-display font-black mb-8 italic tracking-wider">PREMIUM RULES</h3>

          <div className="space-y-8">
            <section>
              <h4 className="text-yellow-500/80 text-xs font-black tracking-[0.2em] mb-4 uppercase">21+3 Side Bet</h4>
              <ul className="space-y-3">
                {[
                  { label: "Suited Trips", odds: "100:1" },
                  { label: "Straight Flush", odds: "40:1" },
                  { label: "Three of a Kind", odds: "30:1" },
                  { label: "Straight", odds: "10:1" },
                  { label: "Flush", odds: "5:1" }
                ].map(r => (
                  <li key={r.label} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-slate-200 font-medium">{r.label}</span>
                    <span className="text-yellow-500 font-mono font-bold">{r.odds}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-yellow-500/80 text-xs font-black tracking-[0.2em] mb-4 uppercase">Perfect Pairs</h4>
              <ul className="space-y-3">
                {[
                  { label: "Perfect Pair", odds: "25:1" },
                  { label: "Colored Pair", odds: "12:1" },
                  { label: "Mixed Pair", odds: "6:1" }
                ].map(r => (
                  <li key={r.label} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-slate-200 font-medium">{r.label}</span>
                    <span className="text-yellow-500 font-mono font-bold">{r.odds}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <div className="p-8 border-t border-white/10 bg-black/20">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold text-center italic">The Midnight Ace Elite Club</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-2 md:mb-4 z-10 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            className="w-9 h-9 md:w-12 md:h-12 rounded-xl glass hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center group"
          >
            <span className="text-yellow-500 text-sm md:text-xl group-hover:rotate-12 transition-transform">ⓘ</span>
          </button>
          <div className="glass px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl border-white/5">
            <h1 className="text-sm md:text-3xl font-display font-black tracking-tight gold-text italic uppercase">MIDNIGHT <span className="text-white opacity-90 not-italic">ACE</span></h1>
          </div>
        </div>

        <div className="glass px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl border-yellow-500/20 text-right shadow-2xl group transition-all hover:border-yellow-500/40 shrink-0">
          <p className="text-[7px] md:text-[9px] text-yellow-500 font-black uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity leading-none mb-0.5">BANKROLL</p>
          <p className="text-sm md:text-xl font-mono font-black text-white leading-none">${state.bankroll.toLocaleString()}</p>
        </div>
      </div>

      {/* Dealer Commentary */}
      <div className="max-w-2xl mx-auto w-full mb-1 md:mb-4 z-10 px-2 shrink-0">
        <div className="glass p-2 md:p-3 rounded-xl border-white/10 shadow-lg flex items-center gap-3 ring-1 ring-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none"></div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xl shadow-inner border border-white/5 glass relative">
            👩‍🦰
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div className="flex-grow">
            <p className="text-yellow-500/60 text-[8px] font-black tracking-[0.2em] uppercase leading-none mb-0.5">Dealer Victoria</p>
            {isLoadingCommentary ? (
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            ) : (
              <p className="text-slate-100 italic text-[10px] md:text-sm font-medium leading-tight">
                "{state.dealerCommentary}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-grow flex flex-col items-center justify-between gap-1 md:gap-4 relative py-1 md:py-4 min-h-0">
        {/* Dealer Hand */}
        <div className="flex flex-col items-center gap-1 group shrink">
          <div className="flex gap-1.5 md:gap-3 min-h-[65px] md:min-h-[110px] p-1 md:p-2 rounded-xl">
            {state.dealerHand.length === 0 && state.status === 'BETTING' && (
              <div className="w-10 h-[60px] md:w-16 md:h-[96px] border-2 border-white/5 rounded-md border-dashed flex items-center justify-center">
                <span className="text-white/10 text-lg font-black">?</span>
              </div>
            )}
            {state.dealerHand.map((card, idx) => (
              <CardUI key={card.id} card={card} index={idx} hidden={state.status === 'PLAYING' && idx === 1} />
            ))}
          </div>
          {(state.status === 'DEALER_TURN' || state.status === 'GAME_OVER') && (
            <div className="glass px-4 py-1 rounded-full text-[10px] font-black border border-white/10 text-white/60 uppercase tracking-widest shadow-xl">
              Dealer: <span className="text-yellow-500 ml-1">{calculateScore(state.dealerHand)}</span>
            </div>
          )}
        </div>

        {/* Betting Interaction Zone */}
        <div className="relative w-full max-w-lg flex items-center justify-around md:justify-center gap-2 md:gap-12 pointer-events-auto h-24 md:h-40 shrink-0">
          {/* PP Side Bet */}
          <button
            onClick={() => handleCircleClick('PP')}
            className={`w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center 
              ${activeBetType === 'PP' ? 'border-yellow-500 bg-yellow-500/10 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'border-white/10 hover:border-white/30'}`}
          >
            <span className="text-[6px] md:text-[10px] font-black text-yellow-500 leading-none">PP</span>
            <span className="text-[8px] md:text-sm font-mono font-bold">${state.sideBets.perfectPairs}</span>
            {state.sideBetResults.pp && <div className="absolute -top-4 bg-yellow-500 text-black text-[6px] font-black px-1 py-0.5 rounded shadow-lg animate-bounce whitespace-nowrap">WIN!</div>}
          </button>

          {/* Main Bet Circle */}
          <button
            onClick={() => handleCircleClick('MAIN')}
            className={`w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-double transition-all duration-300 flex flex-col items-center justify-center shadow-xl
              ${activeBetType === 'MAIN' ? 'border-yellow-500 bg-yellow-500/10 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'border-white/20 hover:border-white/40'}`}
          >
            <span className="text-[8px] md:text-xs font-black text-yellow-500 tracking-widest uppercase">Bet</span>
            <span className="text-sm md:text-2xl font-mono font-black">${state.bet}</span>
          </button>

          {/* 21+3 Side Bet */}
          <button
            onClick={() => handleCircleClick('P3')}
            className={`w-12 h-12 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center
              ${activeBetType === 'P3' ? 'border-purple-500 bg-purple-500/10 scale-110 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-white/10 hover:border-white/30'}`}
          >
            <span className="text-[6px] md:text-[10px] font-black text-purple-500 leading-none">21+3</span>
            <span className="text-[8px] md:text-sm font-mono font-bold">${state.sideBets.plusThree}</span>
            {state.sideBetResults.p3 && <div className="absolute -top-4 bg-purple-500 text-white text-[6px] font-black px-1 py-0.5 rounded shadow-lg animate-bounce whitespace-nowrap">WIN!</div>}
          </button>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-1 group shrink mb-4 md:mb-6">
          <div className="flex gap-1.5 md:gap-3 min-h-[65px] md:min-h-[110px] p-1 md:p-2 rounded-xl">
            {state.playerHand.length === 0 && state.status === 'BETTING' && (
              <div className="w-10 h-[60px] md:w-16 md:h-[96px] border-2 border-white/5 rounded-md border-dashed flex items-center justify-center">
                <span className="text-white/10 text-lg font-black">!</span>
              </div>
            )}
            {state.playerHand.map((card, idx) => (
              <CardUI key={card.id} card={card} index={idx} />
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel - Fixed Bottom */}
      <div className="shrink-0 pt-1 pb-2 md:pb-4 flex justify-center z-50">
        <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-xl md:rounded-[2rem] p-2 md:p-5 shadow-2xl flex flex-col items-center gap-1.5 md:gap-3 max-w-xl w-full ring-1 ring-white/5">
          {/* Show score prominently during play */}
          {state.playerHand.length > 0 && (state.status === 'PLAYING' || state.status === 'DEALER_TURN' || state.status === 'GAME_OVER') && (
            <div className="flex items-center justify-center gap-4 w-full mb-1">
              <div className="glass px-5 py-1.5 rounded-full text-xs font-black border border-yellow-500/30 text-yellow-500 uppercase tracking-widest shadow-xl">
                Your Hand: <span className="text-white ml-1 text-sm">{calculateScore(state.playerHand)}</span>
              </div>
            </div>
          )}
          <div className={`text-[10px] md:text-sm font-black tracking-tight transition-all duration-300 ${state.status === 'GAME_OVER' ? 'text-yellow-500 scale-105' : 'text-white/80'}`}>
            {state.message}
          </div>

          {state.status === 'BETTING' && (
            <div className="w-full space-y-2 md:space-y-4">
              {/* Chips Row */}
              <div className="flex justify-center items-center gap-1.5 md:gap-4 bg-black/30 p-1.5 md:p-3 rounded-lg md:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                <Chip value={10} color="bg-blue-600" onClick={handleChipClick} disabled={state.bankroll < 10} />
                <Chip value={25} color="bg-green-600" onClick={handleChipClick} disabled={state.bankroll < 25} />
                <Chip value={50} color="bg-red-600" onClick={handleChipClick} disabled={state.bankroll < 50} />
                <Chip value={100} color="bg-slate-800" onClick={handleChipClick} disabled={state.bankroll < 100} />
                <Chip value={500} color="bg-amber-500" onClick={handleChipClick} disabled={state.bankroll < 500} />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={clearBets}
                  className="flex-1 glass border-white/10 text-white/40 hover:text-white font-black py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
                >
                  Clear
                </button>
                <button
                  onClick={startDeal}
                  disabled={state.bet <= 0}
                  className="flex-[2] bg-yellow-500 text-black font-black py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-yellow-400 disabled:opacity-20 disabled:grayscale transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs"
                >
                  DEAL
                </button>
              </div>
            </div>
          )}

          {state.status === 'PLAYING' && (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleHit}
                  className="flex-1 bg-white text-black font-black py-3 md:py-4 rounded-xl hover:bg-slate-200 active:scale-95 transition-all shadow-xl uppercase tracking-[0.15em] text-xs md:text-sm"
                >
                  HIT
                </button>
                <button
                  onClick={handleStand}
                  className="flex-1 glass border-white/20 text-white font-black py-3 md:py-4 rounded-xl hover:bg-white/10 active:scale-95 transition-all shadow-xl uppercase tracking-[0.15em] text-xs md:text-sm"
                >
                  STAND
                </button>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDouble}
                  disabled={!canDouble}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black py-2.5 md:py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all shadow-lg uppercase tracking-[0.1em] text-[10px] md:text-xs disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                  DOUBLE
                </button>
                <button
                  onClick={handleSplit}
                  disabled={!canSplit}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-2.5 md:py-3 rounded-xl hover:from-purple-400 hover:to-pink-400 active:scale-95 transition-all shadow-lg uppercase tracking-[0.1em] text-[10px] md:text-xs disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                  SPLIT
                </button>
              </div>
            </div>
          )}

          {state.status === 'GAME_OVER' && (
            <button
              onClick={resetGame}
              className="w-full bg-yellow-500 text-black font-black py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] active:scale-95 transition text-sm md:text-base"
            >
              NEW HAND
            </button>
          )}

          {(state.status === 'DEALER_TURN') && (
            <div className="w-full flex items-center justify-center py-2 md:py-4">
              <div className="flex gap-2">
                <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-yellow-500 rounded-full animate-pulse"></div>
                <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-yellow-500 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
