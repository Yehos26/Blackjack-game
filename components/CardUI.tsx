import React from 'react';
import { Card } from '../types';

interface CardUIProps {
    card: Card;
    index: number;
    hidden?: boolean;
}

const getSuitSymbol = (suit: string): string => {
    switch (suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
        default: return '';
    }
};

const getSuitColor = (suit: string): string => {
    return ['hearts', 'diamonds'].includes(suit) ? 'text-red-600' : 'text-slate-900';
};

const CardUI: React.FC<CardUIProps> = ({ card, index, hidden = false }) => {
    if (hidden) {
        return (
            <div
                className="w-10 h-[60px] md:w-16 md:h-[96px] rounded-md md:rounded-lg shadow-xl relative overflow-hidden transition-all duration-300"
                style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'cardDeal 0.3s ease-out forwards'
                }}
            >
                {/* Card Back Design */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
                    <div className="absolute inset-1 border-2 border-blue-400/30 rounded-sm">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-blue-400/40 flex items-center justify-center">
                                <span className="text-blue-400/60 text-xs md:text-lg font-bold">Y</span>
                            </div>
                        </div>
                        {/* Pattern */}
                        <div className="absolute inset-0 opacity-20">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-full h-[1px] bg-blue-300"
                                    style={{ top: `${(i + 1) * 14}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const suitSymbol = getSuitSymbol(card.suit);
    const suitColor = getSuitColor(card.suit);

    return (
        <div
            className="w-10 h-[60px] md:w-16 md:h-[96px] bg-white rounded-md md:rounded-lg shadow-xl relative overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
                animationDelay: `${index * 100}ms`,
                animation: 'cardDeal 0.3s ease-out forwards'
            }}
        >
            {/* Card Content */}
            <div className="absolute inset-0 flex flex-col">
                {/* Top Left Corner */}
                <div className={`absolute top-0.5 left-0.5 md:top-1 md:left-1 flex flex-col items-center leading-none ${suitColor}`}>
                    <span className="text-[10px] md:text-sm font-bold">{card.rank}</span>
                    <span className="text-[8px] md:text-xs">{suitSymbol}</span>
                </div>

                {/* Center Suit */}
                <div className={`flex-grow flex items-center justify-center ${suitColor}`}>
                    <span className="text-xl md:text-3xl">{suitSymbol}</span>
                </div>

                {/* Bottom Right Corner (inverted) */}
                <div className={`absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 flex flex-col items-center leading-none rotate-180 ${suitColor}`}>
                    <span className="text-[10px] md:text-sm font-bold">{card.rank}</span>
                    <span className="text-[8px] md:text-xs">{suitSymbol}</span>
                </div>
            </div>

            {/* Subtle Border */}
            <div className="absolute inset-0 border border-slate-200 rounded-md md:rounded-lg pointer-events-none"></div>
        </div>
    );
};

export default CardUI;
