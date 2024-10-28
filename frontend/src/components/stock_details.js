import React, { useState, useEffect } from "react";
import'../css/stock_details.css';
import { sort_items } from "../utils/sort_items";
import { IoCaretBack, IoCaretForward } from "react-icons/io5";

function StockDetails({ ticker_symbol, on_back }) {
    const [stock_details, set_stock_details] = useState([]);
    const [loading, set_loading] = useState(false);
    const [sort_column, set_sort_column] = useState('timestamp_end');
    const [sort_direction, set_sort_direction] = useState('desc');
    const [current_page, set_current_page] = useState(1);
    const items_per_page = 10;
    

    useEffect(() => {
        set_loading(true);
        fetch(`/api/stocks/${ticker_symbol}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            return response.json();
            })
            .then(data => {
                const sorted_data = sort_items(data, sort_column, sort_direction);
                set_stock_details(sorted_data);
                console.log('Fetched stock details:', data);
                set_loading(false);
            })
            .catch(err => {
                console.error('Error fetching stock details:', err);
                set_loading(false);
            });
    }, [ticker_symbol, sort_column, sort_direction]);

    const handle_sort = (column) => {
        const new_direction = (sort_column === column && sort_direction === 'asc') ? 'desc' : 'asc';
        set_sort_column(column);
        set_sort_direction(new_direction);
    };

    const format_currency = (value) => `$${parseFloat(value).toFixed(2)}`;

    const format_date = (unix_timestamp) => {
        const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true    
        });
    };

    // Calculate the current records to display based on the current page
    const index_of_last_record = current_page * items_per_page;
    const index_of_first_record = index_of_last_record - items_per_page;
    const current_records = stock_details.slice(index_of_first_record, index_of_last_record)

    // Calculate total pages
    const total_pages = Math.ceil(stock_details.length / items_per_page);

    return (
        <div className='stock-details-content'>
            {loading ? (
                <div className='loading-container'>
                    <div className='spinner'></div>
                    <p className='loading-text'>Fetching Stock Details...</p>
                </div>
            ) : stock_details.length > 0 ? (
                <>
                    <button onClick={on_back} className='back-button'><IoCaretBack /><strong> Back to all Stocks</strong></button>
                    <h2>Details for {ticker_symbol}</h2>
                    <table className='stocks-details-table'>
                        <thead>
                            <tr>
                                <th onClick={() => handle_sort('ticker_symbol')} className={`sortable ${sort_column === 'ticker_symbol' ? sort_direction : ''}`} >Ticker Symbol</th>
                                <th onClick={() => handle_sort('open_price')} className={`sortable ${sort_column === 'open_price' ? sort_direction : ''}`} >Open Price</th>
                                <th onClick={() => handle_sort('close_price')} className={`sortable ${sort_column === 'close_price' ? sort_direction : ''}`} >Close Price</th>
                                <th onClick={() => handle_sort('highest_price')} className={`sortable ${sort_column === 'highest_price' ? sort_direction : ''}`} >Highest Price</th>
                                <th onClick={() => handle_sort('lowest_price')} className={`sortable ${sort_column === 'lowest_price' ? sort_direction : ''}`} >Lowest Price</th> 
                                <th onClick={() => handle_sort('timestamp_end')} className={`sortable ${sort_column === 'timestamp_end' ? sort_direction : ''}`} >Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {current_records.length > 0 ? (
                                current_records.map((stock, index) => (
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
                                    <td colSpan='6'>No Stock Data Found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className='pagination-controls'>
                        <button 
                        onClick={() => set_current_page(prev => Math.max(prev -1, 1))}
                        disabled={current_page === 1}
                        >
                            <IoCaretBack /> Previous
                        </button>
                        <span>Page {current_page} of {total_pages}</span>
                        <button
                            onClick={() => set_current_page(prev => Math.min(prev + 1, total_pages))}
                            disabled={current_page === total_pages}
                        >
                            Next <IoCaretForward />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <button onClick={on_back} className='back-button'>
                        <IoCaretBack /><strong> Back to all Stocks</strong>
                    </button>
                    <p>No stock details found for {ticker_symbol}.</p>
                </>
            )}
        </div>
    );

}

export default StockDetails;