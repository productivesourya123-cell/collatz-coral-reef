import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CollatzCanvas from './CollatzCanvas';

const socket = io(window.location.origin);

function App() {
  const [sequences, setSequences] = useState([]);
  const [inputNumber, setInputNumber] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedSequence, setSelectedSequence] = useState(null);

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

  const handleSequenceSelect = (sequenceNumber) => {
    const sequence = sequences.find(s => s.number === sequenceNumber);
    setSelectedSequence(sequence);
  };

  const handleCloseSidebar = () => {
    setSelectedSequence(null);
  };

  return (
    <div className="min-h-screen bg-cyber-black text-white font-mono">
      {/* Main Canvas Viewport */}
      <div className="relative w-full h-screen">
        <CollatzCanvas 
          sequences={sequences}
          onSequenceSelect={handleSequenceSelect}
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

        {/* Sidebar for sequence details */}
        {selectedSequence && (
          <div className="absolute top-4 right-4 bottom-4 w-96 bg-cyber-dark/95 backdrop-blur-sm border border-cyber-blue/30 rounded-lg p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-cyber-blue text-lg font-bold">{`/// SEQUENCE DETAILS`}</h2>
              <button
                onClick={handleCloseSidebar}
                className="text-cyber-red hover:text-cyber-red/80 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-cyber-green text-sm mb-2">SEED NUMBER</div>
              <div className="text-white text-xl font-bold">{selectedSequence.number.toLocaleString()}</div>
            </div>

            <div className="mb-4">
              <div className="text-cyber-green text-sm mb-2">TOTAL STEPS</div>
              <div className="text-white text-xl font-bold">{selectedSequence.iterations}</div>
            </div>

            <div className="mb-4">
              <div className="text-cyber-green text-sm mb-2">CALCULATION STEPS</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedSequence.sequence.map((num, index) => {
                  const isEven = num % 2 === 0;
                  const operation = isEven ? `${num} ÷ 2 = ${num / 2}` : `${num} × 3 + 1 = ${num * 3 + 1}`;
                  const type = isEven ? 'EVEN' : 'ODD';
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        isEven 
                          ? 'bg-cyber-green/10 border-cyber-green/30' 
                          : 'bg-cyber-orange/10 border-cyber-orange/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-mono text-sm">
                          Step {index}: {num.toLocaleString()}
                        </span>
                        <span className={`text-xs font-bold ${isEven ? 'text-cyber-green' : 'text-cyber-orange'}`}>
                          {type}
                        </span>
                      </div>
                      <div className="text-cyber-blue text-xs mt-1">
                        {operation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
