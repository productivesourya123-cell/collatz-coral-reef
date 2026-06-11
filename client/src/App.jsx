import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CollatzCanvas from './CollatzCanvas';

const socket = io('http://localhost:5000');

function App() {
  const [sequences, setSequences] = useState([]);
  const [inputNumber, setInputNumber] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    // Listen for initial state (receives entire globalCoralData array)
    socket.on('initialState', (data) => {
      setSequences(data);
    });

    // Listen for new sequences
    socket.on('newSequence', (data) => {
      setSequences(prev => [...prev, data]);
    });


    // Listen for submission success
    socket.on('submissionSuccess', (data) => {
      setSubmitStatus({ type: 'success', message: `Seed ${data.number.toLocaleString()} -> ${data.iterations} steps` });
      setTimeout(() => setSubmitStatus(null), 3000);
    });

    // Listen for submission errors
    socket.on('submissionError', (data) => {
      setSubmitStatus({ type: 'error', message: `${data.error}: Seed ${data.number.toLocaleString()}` });
      setTimeout(() => setSubmitStatus(null), 3000);
    });

    return () => {
      socket.off('initialState');
      socket.off('newSequence');
      socket.off('submissionSuccess');
      socket.off('submissionError');
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(inputNumber);
    
    if (isNaN(num) || num < 1) {
      setSubmitStatus({ type: 'error', message: 'Please enter a positive integer' });
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    socket.emit('submitNumber', { number: num });
    setInputNumber('');
  };

  const handleRecenter = () => {
    // This will be handled by the canvas component
    window.dispatchEvent(new CustomEvent('recenterCamera'));
  };

  return (
    <div className="min-h-screen bg-cyber-black text-white font-mono">
      {/* Main Canvas Viewport */}
      <div className="relative w-full h-screen">
        <CollatzCanvas 
          sequences={sequences}
        />

        {/* Control Overlay */}
        <div className="absolute top-4 left-4 bg-cyber-dark/90 backdrop-blur-sm border border-cyber-green/30 rounded-lg p-4 w-72">
          <h2 className="text-cyber-green text-lg font-bold mb-4">{`/// CONTROL PANEL`}</h2>
          
          {/* Number Submission */}
          <form onSubmit={handleSubmit} className="mb-4">
            <label className="block text-cyber-blue text-sm mb-2">SUBMIT SEED NUMBER</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                className="flex-1 bg-cyber-black border border-cyber-green/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-green"
                placeholder="Enter number..."
                min="1"
              />
              <button
                type="submit"
                className="bg-cyber-green hover:bg-cyber-green/80 text-cyber-black font-bold px-4 py-2 rounded transition-colors"
              >
                SUBMIT
              </button>
            </div>
          </form>

          {/* Status Message */}
          {submitStatus && (
            <div className={`mb-4 p-2 rounded text-sm ${
              submitStatus.type === 'success' 
                ? 'bg-cyber-green/20 border border-cyber-green text-cyber-green' 
                : 'bg-cyber-red/20 border border-cyber-red text-cyber-red'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="w-full bg-cyber-purple hover:bg-cyber-purple/80 text-white font-bold px-4 py-2 rounded transition-colors"
          >
            RECENTER CAMERA
          </button>
        </div>


        {/* Stats Overlay */}
        <div className="absolute bottom-4 left-4 bg-cyber-dark/90 backdrop-blur-sm border border-cyber-purple/30 rounded-lg p-3">
          <div className="text-cyber-purple text-sm">
            <div>TOTAL CONTRIBUTED NUMBERS: {sequences.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
