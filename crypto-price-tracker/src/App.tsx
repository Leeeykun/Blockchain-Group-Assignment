import React from 'react';
import './App.css';
import PriceTracker from './pages/PriceTracker';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Price Tracker</h1>
      </header>
      <main>
        <PriceTracker />
      </main>
    </div>
  );
}

export default App;