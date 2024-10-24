import './App.css';
import React, { useState, useEffect } from 'react';
import { FaHome, FaQuestionCircle, FaBars, FaSearch, FaPlus, FaTrash, FaCog } from 'react-icons/fa';
import { HiMiniChartBarSquare } from 'react-icons/hi2';
import ConfigureModal from './configure_modal';
import AddApiModal from './add_api_modal';

function App() {
  const [show_settings, set_show_settings] = useState(false);
  const [api_keys, set_api_keys] = useState([]);
  const [show_modal, set_show_modal] = useState(false);
  const [show_add_modal, set_show_add_modal] = useState(false);
  const [selected_api_key, set_selected_api_key] = useState(null);
  const [selected_service, set_selected_service] = useState(null);

  // Fetch API keys when settings page is opened
  useEffect(() => {
    if (show_settings){
      fetch('/api/keys')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          } 
          return response.json();
        })
        .then(data => set_api_keys(data))
        .catch(err => console.error('Error fetching API keys:', err));
    }
  }, [show_settings]);

  // Function to naviagate back to the main content
  const go_to_home  = () => {
    set_show_settings(false);
  };

  // Function to handle adding a new API key
  const add_api_key = () => {
    set_show_add_modal(true);
  };

  // Function to handle saving a new API key (passed to AddApiModal)
  const save_new_api_key = (new_service, new_api_key) => {
    fetch('/api/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: new_service,
        api_key: new_api_key,
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Update UI with the new API key
      set_api_keys([...api_keys, { service: new_service, api_key: new_api_key}]);
    })
    .catch(err => console.error('Error saving new API key:', err));
  };

  // Function to handle deleting an API key
  const delete_api_key = (service) => {
    // Send DELETE request to the server to delete the API key
    fetch(`/api/keys/${service}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Remove the key from the UI
        set_api_keys(api_keys.filter(key => key.service !== service));
      })
      .catch(err => console.error(`Error deleting API key for service: ${service}`, err));
  };

  const open_modal  = (service, api_key) => {
    set_selected_service(service);
    set_selected_api_key(api_key);
    set_show_modal(true);
  };

  const save_changes  = (updated_service, updated_api_key) => {
    fetch(`/api/keys/${selected_service}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: updated_service,
        api_key: updated_api_key,
      }),
    })
    .then(response => {
      if(!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const updated_keys = api_keys.map(key => {
        if (key.service === selected_service) {
          return { service: updated_service, api_key: updated_api_key};
        }
        return key;
      });
      set_api_keys(updated_keys);
    })
    .catch(err => {
      console.error('Error updating API key:', err);
    });
  };

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
            onClick={() => set_show_settings(!show_settings)}
          >
            <FaBars />
          </button>
        </div>
      </header>
      <div className="content-container">
        <aside className='sidebar'>
          <nav>
            <ul>
              <li onClick={go_to_home}><FaHome /> Home</li>
              <li><HiMiniChartBarSquare /> Stocks</li>
            </ul>
          </nav>
        </aside>
        <main className='content'>
          {/* Conditionally render content based on the state */}
          {show_settings  ? (
            <div className='settings-page'>
              <h1>Settings</h1>
              <hr />
              <h2>
                API Keys
                <button className='add-api-button' onClick={add_api_key}>
                  <FaPlus /> <strong>Add API Key</strong>    
                </button>
              </h2>
              <table className='api-keys-table'>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>API Key</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {api_keys.length > 0 ? (
                    api_keys.map((key, index) => (
                      <tr key={index}>
                        <td>{key.service}</td>
                        <td>{key.api_key}</td>
                        <td>
                          <button
                            className='configure-button'
                            onClick={() => open_modal(key.service, key.api_key)}
                            title="Configure API Key"
                          >
                            <FaCog />
                          </button>
                          <button
                            className='trash-button'
                            onClick={() => delete_api_key(key.service)}
                            title="Delete API Key"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No API Keys found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='main-content'>
              <p>Edit <code>src/app.js</code> and save to reload.</p>
            </div>
          )}
        </main>
      </div>
      <ConfigureModal
        show={show_modal}
        on_close={() => set_show_modal(false)}
        service={selected_service}
        api_key={selected_api_key}
        on_save={save_changes}
      />
      <AddApiModal
        show={show_add_modal}
        on_close={() => set_show_add_modal(false)}
        on_save={save_new_api_key}
      />
    </div>
  );
}

export default App;


