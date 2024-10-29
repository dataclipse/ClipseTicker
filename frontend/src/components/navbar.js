import React, {useState, useEffect } from "react";
import { FaQuestionCircle, FaBars } from "react-icons/fa";
import '../css/navbar.css'

function Navbar({ onNavigate }) {
    const [search_input, set_search_input] = useState('');
    const [suggestions, set_suggestions] = useState([]);
    const [ticker_symbols, set_ticker_symbols] = useState([]);

    // Fetch ticker symbols from the stocks database
    useEffect(() => {
        const fetch_ticker_symbols = async () => {
            try {
                const response = await fetch('/api/stocks');
                const data = await response.json();
                console.log('Fetched ticker symbols:', data);
                set_ticker_symbols(data.map(stock => stock.ticker_symbol));
            } catch (error) {
                console.error('Error fetching ticker symbols:', error);
            }
        };
        fetch_ticker_symbols();
    }, []);

    // Handle input change in the search bar
    const handle_input_change = (e) => {
        const value = e.target.value || '';
        set_search_input(value);
        console.log('Input value:', value);

        if (value) {
            const filtered_suggestions = ticker_symbols.filter(symbol =>
                symbol && symbol.toLowerCase().includes(value.toLowerCase())
            );
            console.log('Filtered suggestions:', filtered_suggestions);
            set_suggestions(filtered_suggestions);
        } else {
            set_suggestions([]);
        }
    };

    // Handle selecting a suggestion from the dropdown
    const handle_suggestion_click = (symbol) => {
        set_search_input(symbol);
        set_suggestions([]);
        onNavigate(symbol);
    };

    return (
        <header className='navbar'>
            <div className='navbar-left'>
                <h1>ClipseTicker</h1>
            </div>
            <div className='search-bar'>
                <input 
                    type='text' 
                    value={search_input} 
                    onChange={handle_input_change}  
                    placeholder='Enter Company or Stock Symbol...' 
                    className='search-input'
                />
                {suggestions.length > 0 && (
                    <ul className='suggestions-list'>
                        {suggestions.map((symbol, index) => (
                            <li key={index} onClick={() => handle_suggestion_click(symbol)}>
                                {symbol}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className='navbar-right'>
                <button className='icon-button'>
                    <FaQuestionCircle />
                </button>
                <button className='icon-button' onClick={() => onNavigate('settings')}>
                    <FaBars />
                </button>
            </div>
        </header>
    );
}

export default Navbar;