# Collatz Coral Reef

A real-time collaborative web application that visualizes the Collatz Conjecture as a shared fractal coral reef.

## Features

- **Real-time Collaboration**: Multiple users can submit numbers simultaneously and see each other's sequences appear instantly
- **Fractal Visualization**: Collatz sequences are rendered as branching coral-like structures
- **Cinematic Camera**: Smooth zoom and pan with automatic framing of new data
- **Interactive Controls**: Adjust turning angles and branch lengths in real-time
- **Safety Mechanisms**: Cycle detection and iteration limits to prevent system abuse
- **Hacker-Style UI**: Dark, high-tech dashboard with live submission feed

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React.js, HTML5 Canvas, Tailwind CSS
- **Real-time Sync**: WebSockets via Socket.io

## Installation

### Prerequisites
- Node.js (>=16.0.0)
- npm or yarn

### Setup

1. Install backend dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
```

3. Start the backend server:
```bash
npm start
```

The server will run on port 5000 by default.

4. In a new terminal, start the React development server:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your browser
2. Enter a positive integer in the "SUBMIT SEED NUMBER" field
3. Click "SUBMIT" to calculate and visualize its Collatz sequence
4. Use the sliders to adjust:
   - **Even Angle (θ)**: Rotation for even numbers
   - **Odd Angle (β)**: Rotation for odd numbers
   - **Branch Length**: Length of each segment
5. Use mouse wheel to zoom and drag to pan
6. Click "RECENTER CAMERA" to return to the density center
7. Watch the live feed to see submissions from other users

## Math & Rendering

The visualization uses the Collatz conjecture rules:
- If n is even: n → n/2
- If n is odd: n → 3n + 1

Each sequence is plotted as a path starting from the origin:
- Even numbers rotate the path by +θ
- Odd numbers rotate the path by -β
- When a sequence hits an existing number node, branches link together

## Safety Features

- **Cycle Detection**: Floyd's algorithm detects loops in sequences
- **Iteration Limit**: Maximum 20,000 iterations per sequence
- **Duplicate Prevention**: Same number cannot be submitted twice

## API

### Socket Events

**Client → Server:**
- `submitNumber`: `{ number, userId }` - Submit a new number for calculation

**Server → Client:**
- `initialState`: `{ sequences, submissionLog }` - Initial state on connection
- `newSequence`: `{ number, sequence, iterations, timestamp }` - New sequence broadcast
- `logUpdate`: `{ number, userId, iterations, status, timestamp }` - Log entry update
- `submissionSuccess`: `{ number, iterations }` - Successful submission confirmation
- `submissionError`: `{ number, error, iterations }` - Failed submission notification

## License

MIT
