# Midnight Ace Blackjack

Midnight Ace Blackjack is a premium, high-stakes digital Blackjack experience designed with a sleek casino aesthetic. It features a professional-grade user interface, immersive animations, and an intelligent AI dealer that provides real-time game commentary.

## 🌟 Features

- **Premium UI**: Elegant "Casino Felt" design with smooth card animations and responsive layout.
- **Side Bets**: Includes popular casino side bets like **Perfect Pairs** and **21+3**.
- **AI Dealer**: Experience dynamic game commentary.
- **Responsive Design**: Playable on desktop, tablet, and mobile devices.
- **High-Stakes Atmosphere**: Real casino vibes with bankroll management and chip-based betting.

## 🃏 Game Rules

### Basic Rules
- The goal is to beat the dealer's hand without exceeding 21.
- Number cards (2-10) are worth their face value.
- Face cards (J, Q, K) are worth 10.
- Aces can be worth 1 or 11.
- **Soft 17**: The dealer must hit on all totals of 16 or less and stand on all totals of 17 or more.
- **Blackjack**: A total of 21 on the first two cards pays 3:2.

### Payouts
- **Blackjack**: 3:2
- **Standard Win**: 1:1
- **Push**: Bet returned

## 💎 Side Bets

### Perfect Pairs
Wins if your first two cards are a pair:
- **Perfect Pair**: Same rank, same suit (25:1)
- **Colored Pair**: Same rank, same color (12:1)
- **Mixed Pair**: Same rank, different colors (6:1)

### 21+3
Wins based on your first two cards and the dealer's upcard, forming a 3-card poker hand:
- **Suited Trips**: Three of a kind, same suit (100:1)
- **Straight Flush**: Three cards in sequence, same suit (40:1)
- **Three of a Kind**: Three cards of the same rank (30:1)
- **Straight**: Three cards in sequence (10:1)
- **Flush**: Three cards of the same suit (5:1)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yehos26/midnight-ace-blackjack.git
   cd midnight-ace-blackjack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Gemini API key (required for dealer commentary):
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🛠️ Tech Stack
- **React** for UI components.
- **Vite** for fast development and bundling.
- **Tailwind CSS** for modern, responsive styling.
- **Google Generative AI (Gemini)** for the intelligent dealer commentary.

---
Enjoy your time at the table. Play responsibly!
