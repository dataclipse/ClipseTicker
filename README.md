# ClipseTicker

ClipseTicker is a stock data aggregation application designed to fetch and manage historical OHLC (Open-High-Low-Close) data from the NYSE using the Polygon.io API. The application features a secure API key management system, role-based user authentication, and scheduling capabilities for data fetching jobs. It includes a Flask backend and a React frontend.

---
## Example Screenshots (WIP)



**Example showing Stock Screener for individual Stock Data**
![stockdetails](https://github.com/user-attachments/assets/c0bfdea8-7d07-4a0b-a1bd-3fba42ce1002)

**Example showing Candlestick Graph for Individual Stock Aggregated Daily Average OHLC Data**
![stockaggavg](https://github.com/user-attachments/assets/09887710-875a-4c7e-a07b-0ef01cf3698d)

**Example Scrape Job running set up to pull 5 minute granularity data during NYSE open hours**
![jobs](https://github.com/user-attachments/assets/c4634e17-c7fb-4b42-b36a-344708601972)


## Features

- **API Key Management**: Securely store and manage Polygon.io API keys with encryption.
- **User Authentication**: JWT-based authentication with role-based access control for admin, user, and guest levels.
- **Data Fetching**: Retrieve OHLC aggregated data for NYSE stocks from Polygon.io for a specified date range or the previous two years.
- **Job Scheduling**: Manage data-fetching jobs with endpoints to list, create, and delete jobs.

---

## Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 14 or higher (for frontend development)
