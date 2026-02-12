# Langton's Ant

A TypeScript implementation of Langton's Ant, a two-dimensional universal Turing machine with a very simple set of rules.

## Rules

1. At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
2. At a black square, turn 90° counterclockwise, flip the color of the square, move forward one unit

## Features

- Pure TypeScript implementation
- Console version for Node.js
- Interactive browser visualization with HTML5 Canvas
- Adjustable simulation speed
- Step-by-step mode

## Installation

```bash
npm install
```

## Usage

### Console Version (Node.js)

```bash
npm run build
npm start
```

This will run 11,000 steps and display statistics about the simulation.

### Browser Version

1. Build the project:

```bash
npm run build
```

2. Open `index.html` in a web browser (you may need to serve it via a local server due to CORS restrictions with ES modules).

Or use a simple HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Then open http://localhost:8000 in your browser
```

## Project Structure

- `src/langtons-ant.ts` - Core Langton's Ant implementation
- `src/visualizer.ts` - Browser visualization class
- `src/index.ts` - Entry point (exports for browser, runs console version in Node.js)
- `index.html` - Browser interface
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## How It Works

The ant starts on a grid of white squares. As it moves:

- On white: turn right, flip to black, move forward
- On black: turn left, flip to white, move forward

After about 10,000 steps, the ant enters a repeating "highway" pattern, moving diagonally and leaving a repeating trail.
