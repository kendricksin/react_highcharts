# app/routers/project_bidders.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging
from ..database import get_db_connection
from ..models import CompanyProject, CompanyWinRate

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["project_bidders"],
    responses={404: {"description": "Not found"}},
)

@router.get("/project-bidders")
async def get_project_bidders(
    project_ids: str = Query(..., description="Comma-separated list of project IDs")
):
    """
    Get all bidders for given projects.
    
    Args:
        project_ids: Comma-separated list of project IDs
        
    Returns:
        List of companies that bid on these projects
    """
    logger.info(f"Getting bidders for projects: {project_ids}")
    conn = None
    try:
        # Parse project IDs
        project_id_list = [id.strip() for id in project_ids.split(',') if id.strip()]
        
        if not project_id_list:
            return []
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate placeholders for SQL query
        placeholders = ','.join(['%s'] * len(project_id_list))
        
        # Query to get all bidders for the projects
        query = f"""
            SELECT DISTINCT
                b.tin,
                b.company,
                b.project_id
            FROM public_data.thai_project_bid_info b
            WHERE b.project_id IN ({placeholders})
            ORDER BY b.company
        """
        
        # Execute query
        cursor.execute(query, project_id_list)
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        bidders = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found {len(bidders)} bidders for the specified projects")
        return bidders
    
    except Exception as e:
        logger.error(f"Error getting project bidders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting project bidders: {str(e)}")
    finally:
        if conn:
            conn.close()

@router.get("/company-projects-bulk")
async def get_company_projects_bulk(
    tins: str = Query(..., description="Comma-separated list of company TINs")
):
    """
    Get projects for multiple companies by TIN.
    
    Args:
        tins: Comma-separated list of company TINs
        
    Returns:
        List of company projects
    """
    logger.info(f"Getting projects for companies with TINs: {tins}")
    conn = None
    try:
        # Parse TINs
        tin_list = [tin.strip() for tin in tins.split(',') if tin.strip()]
        
        if not tin_list:
            return []
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate placeholders for SQL query
        placeholders = ','.join(['%s'] * len(tin_list))
        
        # Query to get company projects
        query = f"""
            SELECT 
                p.winner,
                p.project_name,
                p.project_id,
                p.sum_price_agree,
                TO_CHAR(p.transaction_date, 'YYYY-MM-DD') as transaction_date,
                TO_CHAR(p.contract_date, 'YYYY-MM-DD') as contract_date
            FROM public_data.thai_govt_project p
            WHERE p.winner_tin IN ({placeholders})
              AND p.project_name IS NOT NULL
              AND p.sum_price_agree > 0
            ORDER BY 
                COALESCE(p.contract_date, p.transaction_date) DESC NULLS LAST,
                p.sum_price_agree DESC
        """
        
        # Execute query
        cursor.execute(query, tin_list)
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        projects = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found {len(projects)} projects for the specified companies")
        return projects
    
    except Exception as e:
        logger.error(f"Error getting company projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting company projects: {str(e)}")
    finally:
        if conn:
            conn.close()

@router.get("/filtered-win-rates")
async def get_filtered_win_rates(
    tins: str = Query(..., description="Comma-separated list of company TINs")
):
    """
    Get win rates for specified companies.
    
    Args:
        tins: Comma-separated list of company TINs
        
    Returns:
        List of company win rates
    """
    logger.info(f"Getting win rates for companies with TINs: {tins}")
    conn = None
    try:
        # Parse TINs
        tin_list = [tin.strip() for tin in tins.split(',') if tin.strip()]
        
        if not tin_list:
            return []
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate placeholders for SQL query
        placeholders = ','.join(['%s'] * len(tin_list))
        
        # Query to calculate company win rates
        query = f"""
            WITH bid_data AS (
                SELECT 
                    b.project_id,
                    b.company,
                    b.tin,
                    b.bid,
                    p.winner,
                    p.winner_tin,
                    CASE WHEN b.tin = p.winner_tin THEN 1 ELSE 0 END AS won_bid,
                    b.bid / NULLIF(p.sum_price_agree, 0) AS bid_ratio
                FROM public_data.thai_project_bid_info b
                LEFT JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.tin IN ({placeholders})
            )
            SELECT 
                tin,
                company,
                COUNT(project_id) AS total_bids,
                SUM(won_bid) AS wins,
                (SUM(won_bid) * 100.0 / COUNT(project_id))::numeric(10,2) AS win_rate,
                SUM(bid) AS total_bid_value,
                AVG(bid) AS avg_bid,
                AVG(bid_ratio) AS avg_bid_ratio
            FROM bid_data
            GROUP BY tin, company
            ORDER BY win_rate DESC
        """
        
        # Execute query
        cursor.execute(query, tin_list)
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        win_rates = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found win rates for {len(win_rates)} companies")
        return win_rates
    
    except Exception as e:
        logger.error(f"Error getting company win rates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting company win rates: {str(e)}")
    finally:
        if conn:
            conn.close()