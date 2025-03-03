# Project Data Visualization with React and Highcharts

This project visualizes contract data using FastAPI for the backend API and React with Highcharts for the frontend visualization.

## Project Structure

```
react_highcharts/
│
├── backend/                 # FastAPI backend
│   ├── main.py              # Main API file
│   ├── convert_json_to_csv.py  # Converts JSON to CSV
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Dockerfile for backend
│   └── document_structure.json  # Sample JSON data
│
└── frontend/                # React frontend
    ├── public/              # Public assets
    ├── src/                 # Source files
    │   ├── App.js           # Main React component
    │   ├── App.css          # Styles
    │   └── index.js         # Entry point
    ├── package.json         # Node dependencies
    └── README.md            # Frontend documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Convert JSON to CSV:
   ```
   python convert_json_to_csv.py
   ```

5. Run the FastAPI server:
   ```
   uvicorn main:app --reload
   ```

The API will be available at http://localhost:8000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The React app will be available at http://localhost:3000.

## API Endpoints

- `GET /api/data` - Get monthly project data
  - Optional query parameters:
    - `year` - Filter by year

## Data Format

The CSV file should contain the following columns:
- project_id
- project_name
- project_type_name
- dept_name
- dept_sub_name
- purchase_method_name
- announce_date
- project_money
- price_build
- sum_price_agree
- budget_year
- transaction_date
- province
- district
- subdistrict
- project_status
- winner_tin
- winner
- contract_date
- contract_price_agree
