// fetch_data_modal.js
import React, { useEffect, useState } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './fetch_data_modal.css';

const FetchDataModal = ({ show, on_close, on_fetch }) => {
    const [fetch_option, set_fetch_option] = useState('date_range');
    const [start_date, set_start_date] = useState(null);
    const [end_date, set_end_date] = useState(null);

    // Function to calculated the dates for 'two_years' selection
    const calculate_two_years_dates = () => {
        const today = new Date();
        const two_years_ago = new Date(today.getFullYear()-2, today.getMonth(), today.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { start_date: two_years_ago, end_date: yesterday};
    };
    
    // Update start and end dates when 'two_years' option is selected
    useEffect(() => {
        if (fetch_option === 'two_years') {
            const { start_date, end_date } = calculate_two_years_dates();
            set_start_date(start_date);
            set_end_date(end_date);
        } else {
            // clear the dates when switching back to the 'date range' option
            set_start_date(null);
            set_end_date(null);
        }
    }, [fetch_option]);

    const handle_fetch = () => {
        console.log("Fetch Data button clicked");
        
        // Close the modal immediately and run the batch job in the background.
        on_close();

        if (fetch_option === 'two_years') {
            console.log("Fetching two years data");
            fetch('/api/jobs/2yr')
                .then(response => {
                    if (!response.ok) throw new Error("Failed to fetch two years data");
                    return response.json();
                })
                .then(data => {
                    on_fetch(data);
                })
                .catch(error => {
                    console.error("Error fetching two years data:", error);
                });
        } else {
            console.log("Fetching data for date range");
            fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_date, end_date })
            })
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch data for date range");
                return response.json();
            })
            .then(data => {
                on_fetch(data);
            })
            .catch(error => {
                console.error("Error fetching data from date range:", error);
            });
        }
    };
  
    if (!show) return null;

    return (
        <div className='modal-backdrop'>
            <div className='modal-content'>
                <h2>Fetch Data</h2>
                <div className='radio-group'>    
                    <div className='radio-option'>
                        <label>
                            <input
                                type='radio'
                                value='date_range'
                                checked={fetch_option === 'date_range'}
                                onChange={() => set_fetch_option('date_range')}
                            />
                            Date Range
                        </label>
                    </div>
                    <div className='radio-option'>
                        <label>
                            <input
                                type='radio'
                                value='two_years'
                                checked={fetch_option === 'two_years'}
                                onChange={() => set_fetch_option('two_years')}
                            />
                            Full 2 Years
                        </label>
                    </div>
                </div>
                {(fetch_option === 'date_range' || fetch_option === 'two_years') && (
                    <div className='date-picker-container'>
                        <div className='date-picker-field'>
                            <label>Start Date:</label>
                            <DatePicker 
                                selected={start_date} 
                                onChange={date => set_start_date(date)}
                                readOnly={fetch_option === 'two_years'}
                                className={fetch_option === 'two_years' ? 'disabled-datepicker' : ''}
                                disabled={fetch_option === 'two_years'}
                            />
                        </div>
                        <div className='date-picker-field'>
                            <label>End Date:</label>
                            <DatePicker 
                                selected={end_date} 
                                onChange={date => set_end_date(date)}
                                readOnly={fetch_option === 'two_years'}
                                className={fetch_option === 'two_years' ? 'disabled-datepicker' : ''} 
                                disabled={fetch_option === 'two_years'}
                            />
                        </div>
                    </div>
                )}
                <div className='modal-actions'>
                    <button onClick={handle_fetch}>Fetch Data</button>
                    <button onClick={on_close}>Cancel</button>
                </div>
            </div> 
        </div>
    );
};

export default FetchDataModal;