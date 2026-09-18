# Best Deal Finder

A multi-agent system that searches shopping sites for a product, compares the listings on price, rating and delivery, and recommends the single best site to buy from.

## Features

- **Product Scout Agent**: Searches shopping sites for listings of any product
- **Comparator Agent**: Compares listings on price, rating and delivery, with pros/cons
- **Recommender Agent**: Picks the single best site/deal and explains why

## Tech Stack

- **Next.js 16** - React framework
- **Inngest Agent Kit** - Multi-agent orchestration
- **OpenAI GPT-5** - AI models
- **MongoDB** - Database
- **TailwindCSS** - Styling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file with:
OPENAI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri
SERPER_API_KEY=your_serper_key
INNGEST_SIGNING_KEY=your_inngest_key
INNGEST_EVENT_KEY=your_inngest_event_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a product to search for (e.g., "iPhone 15", "gaming laptop under $1000")
2. Choose how many listings to compare, then click "Run Agents" to start the multi-agent workflow
3. Watch as agents collaborate to find listings, compare them, and pick the best deal
4. View results in real-time as each agent completes its task
