# ClipseTicker
Stock Data Aggregation Application
This application supports importing a Polygon.io API key and fetching historical OHLC (Open-High-Low-Close) aggregated stock data from the NYSE. It allows authenticated users to perform operations such as managing users, storing encrypted API keys, and scheduling data fetching jobs. This setup includes a Flask backend and a React frontend.

Features
API Key Management: Securely store and manage Polygon API keys with encryption.
User Authentication: JWT-based authentication with role-based access control (admin, user, guest).
Data Fetching: Pull OHLC aggregated data for NYSE stocks from Polygon for a specified date range or the previous two years.
Job Scheduling: Manage scheduled data-fetching jobs with endpoints for listing, creating, and deleting jobs.

Prerequisites
Python 3.8+
Node.js 14+ (for frontend development)

