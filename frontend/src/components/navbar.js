import React, { useState, useEffect } from "react";
import { FaQuestionCircle, FaBars } from "react-icons/fa";
import { IoSearch } from 'react-icons/io5';
import '../css/navbar.css'

function Navbar({ onNavigate, set_selected_ticker }) {
    const [search_term, set_search_term] = useState('');
    const [suggestions, set_suggestions] = useState([]);

    useEffect(() => {
        const fetch_ticker_symbols = async () => {
            if (search_term.length > 0) {
                try {
                    const response = await fetch(`/api/stocks`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const stocks = await response.json();
                    const filtered_suggestions = stocks
                        .map(stock => stock.ticker_symbol)
                        .filter(ticker => ticker.toLowerCase().includes(search_term.toLowerCase()));
                    set_suggestions(filtered_suggestions);
                } catch (err) {
                    console.error('Error fetching stocks:', err);
                } 
            } else {
                set_suggestions([]);
            }
        };
        fetch_ticker_symbols();
    }, [search_term]);

    const handle_search_change = (event) => {
        set_search_term(event.target.value);
    };

    const handle_suggestion_click = (ticker) => {
        set_selected_ticker(ticker);
        set_search_term('');
        set_suggestions([]);
        onNavigate('stocks', ticker);
    };

    return (
        <header className='navbar'>
            <div className='navbar-left'>
                <h1>ClipseTicker</h1>
            </div>
            <div className='search-container'>
                <input
                    type='text'
                    placeholder='Search Ticker Symbol...'
                    value={search_term}
                    onChange={handle_search_change}
                    className='search-input'
                />
                <IoSearch className='search-icon'/>
                {suggestions.length > 0 && (
                    <ul className='suggestions-list'>
                        {suggestions.map((ticker, index) => (
                            <li key={index} onClick={() => handle_suggestion_click(ticker)}>
                                {ticker}
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