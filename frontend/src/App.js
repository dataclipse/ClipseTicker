import './App.css';
import { useState, useEffect } from 'react';
import { FaHome, FaQuestionCircle, FaBars, FaSearch } from 'react-icons/fa';
import { HiMiniChartBarSquare } from 'react-icons/hi2';

function App() {
  const [showSettings, setShowsettings] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);

  // Fetch API keys when settings page is opened
  useEffect(() => {
    if (showSettings){
      fetch('/api/keys')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          } 
          return response.json();
        })
        .then(data => setApiKeys(data))
        .catch(err => console.error('Error fetching API keys:', err));
    }
  }, [showSettings]);

  // Function to naviagate back to the main content
  const goToHome = () => {
    setShowsettings(false);
  }

  return (
    <div className='App'>
      <header className='navbar'>
        <div className='navbar-left'>
          <h1>ClipseTicker</h1>
        </div>
        <div className='search-bar'>
          <FaSearch className='search-icon' />
          <input
            type='text'
            placeholder='Enter Company or Stock Symbol...'
            className='search-input'
          />
        </div>
        <div className='navbar-right'>
          <button className='icon-button'>
            <FaQuestionCircle />
          </button>
          <button 
            className='icon-button'
            onClick={() => setShowsettings(!showSettings)}
          >
            <FaBars />
          </button>
        </div>
      </header>
      <div className="content-container">
        <aside className='sidebar'>
          <nav>
            <ul>
              <li onClick={goToHome}><FaHome /> Home</li>
              <li><HiMiniChartBarSquare /> Stocks</li>
            </ul>
          </nav>
        </aside>
        <main className='content'>
          {/* Conditionally render content based on the state */}
          {showSettings ? (
            <div className='settings-page'>
              <h1>Settings</h1>
              <hr />
              <h2>API Keys</h2>
              <ul>
                {apiKeys.length > 0 ? (
                  apiKeys.map((key, index) => (
                    <li key={index}>
                      <strong>Service:</strong> {key.service} | <strong>API Key:</strong> {key.api_key}
                    </li>
                  ))
                ) : (
                  <li>No API Keys found</li>
                )}
              </ul>
              {/* Add more settings related content here*/}
            </div>
          ) : (
            <div className='main-content'>
              <p>Edit <code>src/app.js</code> and save to reload.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
