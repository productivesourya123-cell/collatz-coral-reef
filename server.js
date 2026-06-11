const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Global shared coral data - single array of all processed Collatz sequences
let globalCoralData = [];
let submittedNumbers = new Set();

// Collatz sequence calculation - pure algorithm without cycle detection
function calculateCollatzSequence(seed, maxIterations = 5000) {
  let sequence = [];
  let current = seed;
  
  while (current !== 1 && sequence.length < maxIterations) {
    sequence.push(current);
    if (current % 2 === 0) {
      current = current / 2;
    } else {
      current = 3 * current + 1;
    }
  }
  
  sequence.push(1); // Ensure it ends at 1
  
  // Reverse the sequence so we draw from 1 outwards to the seed number
  sequence.reverse();
  
  return {
    success: true,
    sequence: sequence,
    iterations: sequence.length
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send entire global coral data to new client for instant sync
  socket.emit('initialState', globalCoralData);
  
  // Handle new number submission (anonymous)
  socket.on('submitNumber', (data) => {
    const { number } = data;
    
    // Check if number already exists
    if (submittedNumbers.has(number)) {
      socket.emit('submissionError', {
        number,
        error: 'Number already submitted'
      });
      return;
    }
    
    // Calculate Collatz sequence
    const result = calculateCollatzSequence(number);
    
    // Add to global coral data
    submittedNumbers.add(number);
    globalCoralData.push({
      number,
      sequence: result.sequence,
      iterations: result.iterations,
      timestamp: Date.now()
    });
    
    // Broadcast to all clients simultaneously
    io.emit('newSequence', {
      number,
      sequence: result.sequence,
      iterations: result.iterations,
      timestamp: Date.now()
    });
    
    // Send success response to submitter
    socket.emit('submissionSuccess', {
      number,
      iterations: result.iterations
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
