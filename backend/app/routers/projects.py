# app/routers/projects.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging
from ..database import get_db_connection
from ..models import ProjectData, CompanyProject

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)

@router.get("/data", response_model=List[ProjectData])
async def get_monthly_data(year: Optional[int] = None):
    """
    Get monthly project data.
    
    Args:
        year: Optional year filter
        
    Returns:
        List of monthly project data
    """
    logger.info(f"Getting monthly data: year={year}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base query to get monthly data
        query = """
            SELECT 
                TO_CHAR(contract_date, 'Month') AS month,
                EXTRACT(YEAR FROM contract_date) AS year,
                SUM(sum_price_agree) AS total_sum_price_agree,
                COUNT(project_id) AS count
            FROM public_data.thai_govt_project
            WHERE contract_date IS NOT NULL
        """
        
        # Add year filter if specified
        params = []
        if year:
            query += " AND EXTRACT(YEAR FROM contract_date) = %s"
            params.append(year)
        
        # Group and order
        query += """
            GROUP BY month, year
            ORDER BY year, TO_CHAR(TO_DATE(month, 'Month'), 'MM')
        """
        
        # Execute query
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        monthly_data = [dict(row) for row in results]
        
        logger.info(f"Found {len(monthly_data)} months of data")
        
        # Close connection
        cursor.close()
        
        return monthly_data
    
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")

@router.get("/company-projects", response_model=List[CompanyProject])
async def get_company_projects(limit: int = Query(20, ge=1, le=100)):
    """
    Get top companies and their projects.
    
    Args:
        limit: Number of top companies to include (default: 20)
        
    Returns:
        List of company projects
    """
    logger.info(f"Getting top company projects: limit={limit}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to get top companies and their projects
        query = """
            WITH company_totals AS (
                SELECT 
                    winner,
                    SUM(sum_price_agree) AS total_value
                FROM public_data.thai_govt_project
                WHERE winner IS NOT NULL AND sum_price_agree > 0
                GROUP BY winner
                ORDER BY total_value DESC
                LIMIT %s
            )
            SELECT 
                p.winner,
                p.project_name,
                p.sum_price_agree,
                TO_CHAR(p.transaction_date, 'YYYY-MM-DD') as transaction_date,
                TO_CHAR(p.contract_date, 'YYYY-MM-DD') as contract_date
            FROM public_data.thai_govt_project p
            JOIN company_totals c ON p.winner = c.winner
            WHERE p.project_name IS NOT NULL
              AND p.sum_price_agree > 0
            ORDER BY p.sum_price_agree DESC
        """
        
        # Execute query
        cursor.execute(query, (limit,))
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        company_projects = [dict(row) for row in results]
        
        logger.info(f"Found {len(company_projects)} company projects")
        
        # Close connection
        cursor.close()
        
        return company_projects
    
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")