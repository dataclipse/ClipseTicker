import React, { useState, useEffect } from "react";

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
                console.log('Fetched Data:', data);
                const sorted_stocks = sort_stocks_ticker(data, sort_column, sort_direction);
                console.log('Sorted stocks:', sorted_stocks);
                set_stocks(sorted_stocks);
            })
            .catch(err => console.error('Error fetching stocks data:', err));
    }, [sort_column, sort_direction]);

    // Pagination and sorting logic
    const handle_page_change = (pageNumber) => set_current_page(pageNumber);

    const sort_stocks_ticker = (stocks_array, column, direction) => {
        return[...stocks_array].sort((a, b) => {
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
    console.log(stocks)
    console.log(`Start Row: ${start_row}, End Row: ${end_row}`);
    const current_stocks = stocks.slice(start_row, end_row);
    console.log('Current Stocks:', current_stocks);

    return (
        <div className='stocks-content'>
            <h1>All Stock Symbols</h1>
            <hr />
            <table className='stocks-table'>
                <thead>
                    <tr>
                        <th className={`sortable ${sort_column === 'ticker_symbol' ? sort_direction : ''}`} onClick={() => sort_stocks('ticker_symbol')}>Ticker Symbol</th>
                        <th className={`sortable ${sort_column === 'open_price' ? sort_direction : ''}`} onClick={() => sort_stocks('open_price')}>Open Price</th>
                        <th className={`sortable ${sort_column === 'close_price' ? sort_direction : ''}`} onClick={() => sort_stocks('close_price')}>Close Price</th>
                        <th className={`sortable ${sort_column === 'highest_price' ? sort_direction : ''}`}onClick={() => sort_stocks('highest_price')}>Highest Price</th>
                        <th className={`sortable ${sort_column === 'lowest_price' ? sort_direction : ''}`}onClick={() => sort_stocks('lowest_price')}>Lowest Price</th> 
                        <th className={`sortable ${sort_column === 'timestamp_end' ? sort_direction : ''}`}onClick={() => sort_stocks('timestamp_end')}>Date</th>
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