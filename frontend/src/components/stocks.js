import React, { useState, useEffect } from "react";
import { sort_items } from "../utils/sort_items"

function Stocks() {
    const [stocks, set_stocks] = useState([]);
    const [current_page, set_current_page] = useState(0);
    const [rows_per_page] = useState(500);
    const [sort_column, set_sort_column] = useState('ticker_symbol');
    const [sort_direction, set_sort_direction] = useState('asc');

    // Fetch stocks on component mount or when sort changes
    useEffect(() => {
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
            })
            .catch(err => console.error('Error fetching stocks data:', err));
    }, [sort_column, sort_direction]);

    // Pagination and sorting logic
    const handle_page_change = (pageNumber) => set_current_page(pageNumber);

    const handle_sort = (column) => {
        const new_direction = sort_column === column && sort_direction === 'asc' ? 'desc' : 'asc';
        set_sort_column(column);
        set_sort_direction(new_direction);
        set_stocks(prev_stocks => sort_items(prev_stocks, column, new_direction));
    };
    
    const format_currency = (value) => `$${parseFloat(value).toFixed(2)}`;

    const format_date = (unix_timestamp) => {
        const date = new Date(unix_timestamp * 1000);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',    
        });
    };

    const start_row = current_page * rows_per_page;
    const end_row = start_row + rows_per_page;
    const current_stocks = stocks.slice(start_row, end_row);

    return (
        <div className='stocks-content'>
            <h1>All Stock Symbols</h1>
            <hr />
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
    );
}

export default Stocks;