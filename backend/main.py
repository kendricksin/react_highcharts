# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
import os
from pydantic import BaseModel
from typing import List, Optional

# Initialize FastAPI app
app = FastAPI(title="Project Data API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectData(BaseModel):
    month: str
    year: int
    total_sum_price_agree: float
    count: int

@app.get("/")
def read_root():
    return {"message": "Welcome to the Project Data API"}

@app.get("/api/data", response_model=List[ProjectData])
def get_monthly_data(year: Optional[int] = None):
    try:
        # Path to your CSV file
        csv_path = "projects_data.csv"
        
        # Check if file exists
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="CSV file not found")
        
        # Read CSV file
        df = pd.read_csv(csv_path)
        
        # Convert date strings to datetime objects
        df['contract_date'] = pd.to_datetime(df['contract_date'])
        
        # Extract month and year
        df['month'] = df['contract_date'].dt.month_name()
        df['year'] = df['contract_date'].dt.year
        
        # Filter by year if specified
        if year:
            df = df[df['year'] == year]
        
        # Group by month and year
        monthly_data = df.groupby(['year', 'month']).agg({
            'sum_price_agree': 'sum',
            'project_id': 'count'  # Count number of projects
        }).reset_index()
        
        # Rename columns
        monthly_data = monthly_data.rename(columns={
            'sum_price_agree': 'total_sum_price_agree',
            'project_id': 'count'
        })
        
        # Sort by year and month
        month_order = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        monthly_data['month_num'] = monthly_data['month'].map(month_order)
        monthly_data = monthly_data.sort_values(['year', 'month_num'])
        monthly_data = monthly_data.drop('month_num', axis=1)
        
        # Convert to list of dictionaries
        result = monthly_data.to_dict(orient='records')
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
