import './App.css';
import { FaHome, FaQuestionCircle, FaBars, FaSearch } from 'react-icons/fa';
import { HiMiniChartBarSquare } from 'react-icons/hi2';

function App() {
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
          <button className='icon-button'>
            <FaBars />
          </button>
        </div>
      </header>
      <div className="content-container">
        <aside className='sidebar'>
          <nav>
            <ul>
              <li><FaHome /> Home</li>
              <li><HiMiniChartBarSquare /> Stocks</li>
            </ul>
          </nav>
        </aside>
        <main className='content'>
          <p>Edit <code>src/app.js</code> and save to reload.</p>
        </main>
      </div>
    </div>
  );
}

export default App;
