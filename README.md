# Yemen Market Analysis Dashboard

This project is a comprehensive web-based dashboard for analyzing market data in Yemen, built with [Next.js](https://nextjs.org/) and [Material UI (MUI)](https://mui.com/). The dashboard provides interactive visualizations and analytical tools to explore commodity prices, conflict intensity, and various econometric analyses based on a detailed methodology.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
- [Project Structure](#project-structure)
- [Data Sources](#data-sources)
- [Learn More](#learn-more)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Interactive Visualizations**: Explore price and conflict data through dynamic charts.
- **Econometric Analyses**: Perform various tests and models aligned with a comprehensive methodology.
- **Dark Mode Support**: Toggle between light and dark themes for better accessibility.
- **Responsive Design**: Optimized for desktop and mobile devices.
- **Modular Components**: Easily extendable and maintainable codebase.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js version 14.x or higher installed.
- **npm or Yarn**: Package manager for installing dependencies.

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/yemen-market-analysis-dashboard.git
   cd yemen-market-analysis-dashboard
   ```

2. **Install Dependencies**

   Using npm:

   ```bash
   npm install
   ```

   Or using Yarn:

   ```bash
   yarn install
   ```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

The page will automatically reload if you make edits to the code.

## Project Structure

- **`/pages`**: Contains Next.js page components.
- **`/components`**: Reusable React components such as `Dashboard`, `Methodology`, and `ResultsVisualization`.
- **`/lib`**: Utility functions for data fetching and processing.
- **`/public`**: Static assets like images and icons.
- **`/styles`**: Global and component-specific styles.

## Data Sources

The dashboard uses data from the following sources:

- **Price Data**: World Food Program (WFP)
- **Conflict Data**: Armed Conflict Location & Event Data Project (ACLED)
- **Geographic Information**: ACAPS YEMEN
- **Population Data**: Latest estimates for Yemen

Ensure you have access to these data sources and have them properly configured in your project.

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Material UI Documentation](https://mui.com/)
- [Recharts Documentation](https://recharts.org/en-US/)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with descriptive messages.
4. Push your branch to your fork.
5. Submit a pull request to the main repository.

Please ensure your code adheres to the project's coding standards and passes all tests.

## License

This project is licensed under the [MIT License](LICENSE).


