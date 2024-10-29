import React, { useState } from 'react';
import './css/App.css';
import Navbar from './components/navbar.js';
import Sidebar from './components/sidebar.js';
import Home from './components/home.js';
import Stocks from './components/stocks.js';
import Jobs from './components/jobs.js';
import Settings from './components/settings.js';
import StockDetails from './components/stock_details.js';

function App() {
    const [active_content, set_active_content] = useState('home');
    const [selected_ticker, set_selected_ticker] = useState(null);

    const handle_navigation = (content, ticker_symbol) => {
        if (content === 'stocks' && ticker_symbol) {
            set_active_content('stock_details'); // You may need to adjust this if you're using a different method for routing
            set_selected_ticker(ticker_symbol); // Pass the selected ticker symbol to stock details
        } else {
            set_active_content(content);
        }
    };

    const handle_ticker_selection = (ticker) => {
        set_selected_ticker(ticker);
        set_active_content('stocks');
    };

    return(
        <div className='App'>
            <Navbar 
                onNavigate={handle_navigation}
                set_selected_ticker={handle_ticker_selection}
            />
            <div className='content-container'>
                <Sidebar onNavigate={handle_navigation} />
                <main className='content'>
                    {active_content === 'home' && <Home />}
                    {active_content === 'stocks' && <Stocks />}
                    {active_content === 'stock_details' && selected_ticker && (
                        <StockDetails 
                            ticker_symbol={selected_ticker} 
                            on_back={() => {
                                set_selected_ticker(null); // Reset selected ticker
                                set_active_content('stocks'); // Navigate back to stocks
                            }} 
                        />
                    )}
                    {active_content === 'jobs' && <Jobs />}
                    {active_content === 'settings' && <Settings />}
                </main>
            </div>
        </div>
    );
}

export default App;