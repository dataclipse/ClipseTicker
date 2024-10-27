import React, { useState } from 'react';
import './css/App.css';
import Navbar from './components/navbar.js'
import Sidebar from './components/sidebar.js'
import Home from './components/home.js'
import Stocks from './components/stocks.js'
import Jobs from './components/jobs.js'
import Settings from './components/settings.js'
import FetchDataModal from './modules/fetch_data_modal';

function App() {
    const [active_content, setActiveContent] = useState('home');
    const [show_fetch_data_modal, set_show_fetch_data_modal] = useState(false);

    const handle_navigation = (content) => {
        setActiveContent(content);
    };

    return(
        <div className='App'>
            <Navbar onNavigate={handle_navigation} />
            <div className='content-container'>
                <Sidebar onNavigate={handle_navigation} />
                <main className='content'>
                    {active_content === 'home' && <Home />}
                    {active_content === 'stocks' && <Stocks />}
                    {active_content === 'jobs' && <Jobs />}
                    {active_content === 'settings' && <Settings />}
                </main>
            </div>
            <FetchDataModal
              show={show_fetch_data_modal}
              on_close={() => set_show_fetch_data_modal(false)}
            />
        </div>
    );
}

export default App;