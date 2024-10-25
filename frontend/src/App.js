import './App.css';
import React, { useState, useEffect} from 'react';
import { FaHome, FaQuestionCircle, FaBars, FaSearch, FaPlus, FaTrash, FaCog } from 'react-icons/fa';
import { HiMiniChartBarSquare } from 'react-icons/hi2';
import { AiFillSchedule } from "react-icons/ai";
import ConfigureModal from './configure_modal';
import AddApiModal from './add_api_modal';
import FetchDataModal from './fetch_data_modal';

function App() {
  const [api_keys, set_api_keys] = useState([]);
  const [jobs, set_jobs] = useState([]);
  const [show_modal, set_show_modal] = useState(false);
  const [show_add_modal, set_show_add_modal] = useState(false);
  const [selected_api_key, set_selected_api_key] = useState(null);
  const [selected_service, set_selected_service] = useState(null);
  const [active_content, set_active_content] = useState('home');
  const [stocks, set_stocks] = useState([]);
  const [current_page, set_current_page] = useState(0);
  const [rows_per_page] = useState(500);
  const [sort_column, set_sort_column] = useState('ticker_symbol');
  const [sort_direction, set_sort_direction] = useState('asc');
  const [show_fetch_data_modal, set_show_fetch_data_modal] = useState(false);

  // Fetch the jobs list
  useEffect(() => {
    if (active_content === 'jobs') {
      fetch('/api/jobs')
        .then(response => response.json())
        .then(data => set_jobs(data))
        .catch(err => console.error('Error fetching jobs:', err));
    }
  }, [active_content]);

  // Fetch API keys when settings page is opened  
  useEffect(() => {
    if (active_content === 'settings') {
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
  }, [active_content]);

  useEffect(() => {
    if (active_content === 'stocks') {
      fetch('/api/stocks')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const sorted_stocks = sort_stocks_ticker(data, sort_column, sort_direction);  
          set_stocks(sorted_stocks);
        })
        .catch(err => console.error('Error fetching stocks data:', err));
    }
  }, [active_content, sort_column, sort_direction]);

  // Fetch the jobs list
  useEffect(() => {
    if (active_content === 'jobs') {
      fetch('/api/jobs')
        .then(response => response.json())
        .then(data => set_jobs(data))
        .catch(err => console.error('Error fetching jobs:', err));
    }
  }, [active_content]);

  // Function to navigate back to the main content
  const go_to_home  = () => {
    set_active_content('home');
  };

  const go_to_stocks = () => {
    set_active_content('stocks');
    set_current_page(0);
  };

  const go_to_settings = () => {
    set_active_content('settings');
  };

  const go_to_jobs = () => {
    set_active_content('jobs');
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

  // Pagination logic
  const handle_page_change = (pageNumber) => {
    set_current_page(pageNumber);
  };

  const start_row = current_page * rows_per_page;
  const end_row = start_row + rows_per_page;
  const current_stocks = stocks.slice(start_row, end_row);

  const format_currency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const sort_stocks_ticker = (stocks_array, column, direction) => {
    return [...stocks_array].sort((a, b) => {
      const a_value = column === 'ticker_symbol' ? a[column].toLowerCase() : parseFloat(a[column]);
      const b_value = column === 'ticker_symbol' ? b[column].toLowerCase() : parseFloat(b[column]);

      return direction === 'asc' ? (a_value > b_value ? 1 : -1) : (a_value < b_value ? 1 : -1);
    });
  };

  const sort_stocks = (column) => {
    const direction = sort_column === column && sort_direction === 'asc' ? 'desc' : 'asc';

    const sorted_stocks = sort_stocks_ticker(stocks, column, direction);

    set_stocks(sorted_stocks);
    set_sort_column(column);
    set_sort_direction(direction);
  };

  const get_sort_icon = (column) => {
    if (sort_column === column) {
      return sort_direction === 'asc' ? '' : '';
    }
    return '';
  };

  const format_date = (unix_timestamp) => {
    const timestamp_in_ms = unix_timestamp.toString().length === 10
      ? unix_timestamp * 1000
      : unix_timestamp;

    const date = new Date(timestamp_in_ms);
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const delete_job = (job_id) => {
    fetch(`/api/jobs/${job_id}`, {
      method: 'DELETE',
    })
      .then(response => response.ok && set_jobs(jobs.filter(job => job.id !== job_id)))
      .catch(err => console.error(`Error deleting job: ${job_id}`, err));
  };

  // Function to handle fetching data
  const fetch_data = (fetch_params) => {
    if (fetch_params.two_years) {
      console.log('Fetching full 2 years of data...')
      // Implement fetch logic here
    } else {
      const { start_date, end_date } = fetch_params;
      console.log('Fetching data from', start_date, 'to', end_date);
      // Implement fetch logic here
    } 
  };

  // Add a button to open the fetch data modal
  const add_new_job = () => {
    set_show_fetch_data_modal(true);
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
            onClick={go_to_settings}
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
              <li onClick={go_to_stocks}><HiMiniChartBarSquare /> Stocks</li>
              <li onClick={go_to_jobs}><AiFillSchedule /> Jobs</li>
            </ul>
          </nav>
        </aside>
        <main className='content'>
          {active_content === 'home' ? (
            <div className='main-content'>
              <h1>Home Content</h1>
            </div>
          ) : active_content === 'stocks' ? (
            <div className='stocks-content'>
              <h1>All Stock Symbols</h1>
              <hr />
              <table className='stocks-table'>
                <thead>
                  <tr>
                    <th className={`sortable ${sort_column === 'ticker_symbol' ? sort_direction : ''}`} onClick={() => sort_stocks('ticker_symbol')}>Ticker Symbol {get_sort_icon('ticker_symbol')}</th>
                    <th className={`sortable ${sort_column === 'open_price' ? sort_direction : ''}`}onClick={() => sort_stocks('open_price')}>Open Price {get_sort_icon('open_price')}</th>
                    <th className={`sortable ${sort_column === 'close_price' ? sort_direction : ''}`}onClick={() => sort_stocks('close_price')}>Close Price {get_sort_icon('close_price')}</th>
                    <th className={`sortable ${sort_column === 'highest_price' ? sort_direction : ''}`}onClick={() => sort_stocks('highest_price')}>Highest Price (daily) {get_sort_icon('highest_price')}</th>
                    <th className={`sortable ${sort_column === 'lowest_price' ? sort_direction : ''}`}onClick={() => sort_stocks('lowest_price')}>Lowest Price (daily) {get_sort_icon('lowest_price')}</th>
                    <th className={`sortable ${sort_column === 'timestamp_end' ? sort_direction : ''}`}onClick={() => sort_stocks('timestamp_end')}>Date {get_sort_icon('timestamp_end')}</th>
                  </tr>
                </thead>
                <tbody>
                  {current_stocks.length > 0 ? (
                    current_stocks.map((stock, index) => (
                      <tr key={index}>
                        <td>{stock.ticker_symbol}</td>
                        <td>{format_currency(stock.open_price)}</td>
                        <td>{format_currency(stock.close_price)}</td>
                        <td>{format_currency(stock.highest_price)}</td>
                        <td>{format_currency(stock.lowest_price)}</td>
                        <td>{format_date(stock.timestamp_end)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">No Stock Data Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className='pagination'>
                {Array.from({ length: Math.ceil(stocks.length / rows_per_page) }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => handle_page_change(index)}
                    className={current_page === index ? 'active' : ''}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : active_content === 'jobs' ? (
            <div className='jobs-page'>
              <h1>Data Fetch Job Scheduler</h1>
              <hr />
              <button onClick={add_new_job} className='add-job-button'>
                <FaPlus /> <strong>Add New Job</strong>
              </button>
              <table className='jobs-table'>
                <thead>
                  <tr>
                    <th>Job Name</th>
                    <th>Scheduled Start Time</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Run Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length > 0 ? (
                    jobs.map((job, index) => (
                      <tr key={index}>
                        <td>{job.job_name}</td>
                        <td>{job.scheduled_start_time}</td>
                        <td>{job.status}</td>
                        <td>{job.start_time}</td>
                        <td>{job.end_time}</td>
                        <td>{job.run_time}</td>
                        <td>
                          <button 
                            className='delete-job-button'
                            onClick={() => delete_job(job.id)} 
                            title="Delete Job">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No Jobs Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
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
      <FetchDataModal
        show={show_fetch_data_modal}
        on_close={() => set_show_fetch_data_modal(false)}
        on_fetch={fetch_data}
      />
    </div>
  );
}

export default App;


