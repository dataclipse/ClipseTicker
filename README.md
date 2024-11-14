# ClipseTicker

ClipseTicker is a stock data aggregation application designed to fetch and manage historical OHLC (Open-High-Low-Close) data from the NYSE using the Polygon.io API. The application features a secure API key management system, role-based user authentication, and scheduling capabilities for data fetching jobs. It includes a Flask backend and a React frontend.

---
## Example Screenshots (WIP)

**Example showing Candlestick Graph for Individual Stock Aggregated Daily Average OHLC Data**
![example](https://github.com/user-attachments/assets/c1d00360-1554-47c3-90bf-f3dfbe3f685a)

**Example showing per minute Data Scrapes for NYSE**
![Screenshot 2024-11-14 094903](https://github.com/user-attachments/assets/3c2ddfcd-3370-48e5-b5c3-c32c552204f2)

**Example Scrape Job running set up to pull 1 minute granularity data during NYSE open hours**
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
