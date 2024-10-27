import React from "react";
import { FaQuestionCircle, FaBars } from "react-icons/fa";

function Navbar({ onNavigate }) {
    return (
        <header className='navbar'>
            <div className='navbar-left'>
                <h1>ClipseTicker</h1>
            </div>
            <div className='search-bar'>
                <input type='text' placeholder='Enter Company or Stock Symbol...' className='search-input' />
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