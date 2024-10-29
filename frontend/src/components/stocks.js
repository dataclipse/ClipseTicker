import React, { useState, useEffect, useCallback } from "react";
import { sort_items } from "../utils/sort_items";
import '../css/stocks.css';
import StockDetails from "./stock_details";
import { IoCaretBack, IoCaretForward } from "react-icons/io5";

function Stocks() {
    const [stocks, set_stocks] = useState([]);
    const [loading, set_loading] = useState(false);
    const [current_page, set_current_page] = useState(1);
    const items_per_page = 50;
    const [sort_column, set_sort_column] = useState('ticker_symbol');
    const [sort_direction, set_sort_direction] = useState('asc');
    const [selected_ticker, set_selected_ticker] = useState(null);

    const fetch_stocks = useCallback(() => {
        set_loading(stocks.length === 0);
        fetch('/api/stocks')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const sorted_stocks = sort_items(data, sort_column, sort_direction);
                set_stocks(sorted_stocks);
                set_loading(false);
            })
            .catch(err => {
                console.error('Error fetching stocks data:', err);
                set_loading(false);
            });
    }, [sort_column, sort_direction, stocks.length]);

    // Fetch stocks on component mount or when sort changes
    useEffect(() => {
        fetch_stocks();

        //Polling to refresh jobs every 30 seconds
        const interval_id = setInterval(() => {
            fetch_stocks();
        }, 30000); 

        return () => clearInterval(interval_id);
    }, [fetch_stocks]);

    const handle_sort = (column) => {
        const new_direction = sort_column === column && sort_direction === 'asc' ? 'desc' : 'asc';
        set_sort_column(column);
        set_sort_direction(new_direction);
        set_stocks(prev_stocks => sort_items(prev_stocks, column, new_direction));
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

    const index_of_first_record = current_page * items_per_page;
    const index_of_last_record = index_of_first_record + items_per_page;
    const current_stocks = stocks.slice(index_of_first_record, index_of_last_record);
    const total_pages = Math.ceil(stocks.length / items_per_page);

    return (
        <div className='stocks-content'>
            {selected_ticker ? (
                <StockDetails 
                    ticker_symbol={selected_ticker} 
                    on_back={() => set_selected_ticker(null)} 
                />
            ) : (
                <>
                    <h1>All Stock Symbols</h1>
                    <hr />
                    {loading ? (
                        <div className='loading-container'>
                            <div className='spinner'></div>
                            <p className='loading-text'>Fetching Stock Data...</p>
                        </div>
                    ) : (
                        <>
                            <table className='stocks-table'>
                                <thead>
                                    <tr>
                                        <th className={`sortable ${sort_column === 'ticker_symbol' ? sort_direction : ''}`} onClick={() => handle_sort('ticker_symbol')}>Ticker Symbol</th>
                                        <th className={`sortable ${sort_column === 'open_price' ? sort_direction : ''}`} onClick={() => handle_sort('open_price')}>Open Price</th>
                                        <th className={`sortable ${sort_column === 'close_price' ? sort_direction : ''}`} onClick={() => handle_sort('close_price')}>Close Price</th>
                                        <th className={`sortable ${sort_column === 'highest_price' ? sort_direction : ''}`}onClick={() => handle_sort('highest_price')}>Highest Price</th>
                                        <th className={`sortable ${sort_column === 'lowest_price' ? sort_direction : ''}`}onClick={() => handle_sort('lowest_price')}>Lowest Price</th> 
                                        <th className={`sortable ${sort_column === 'timestamp_end' ? sort_direction : ''}`}onClick={() => handle_sort('timestamp_end')}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {current_stocks.length > 0 ? (
                                        current_stocks.map((stock, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <span
                                                        className='ticker-link'
                                                        onClick={() => set_selected_ticker(stock.ticker_symbol)}
                                                    >
                                                        {stock.ticker_symbol}
                                                    </span>
                                                </td>
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
                                    className='pagination-button-prev'
                                    onClick={() => set_current_page(prev => Math.max(prev -1 , 1))}
                                    disabled={current_page === 1}
                                >
                                    <IoCaretBack /> <strong>Previous</strong>
                                </button>
                                <span>  Page {current_page} of {total_pages}  </span>
                                <button
                                    className='pagination-button-next'
                                    onClick={() => set_current_page(prev => Math.min(prev + 1, total_pages))}
                                    disabled={current_page === total_pages}
                                >
                                    <strong>Next</strong> <IoCaretForward />
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default Stocks;