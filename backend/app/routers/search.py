# app/routers/search.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging
import traceback
from ..database import get_db_connection
from ..models import CompanyWinRate, CompanyProject

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["search"],
    responses={404: {"description": "Not found"}},
)

@router.get("/search-companies", response_model=List[CompanyWinRate])
async def search_companies(query: str = Query(..., min_length=2, description="Company name or TIN search query")):
    """
    Search for companies by name or TIN.
    
    Args:
        query: Search string for company name or TIN
        
    Returns:
        List of matching companies with win rate data
    """
    logger.info(f"Searching for companies with query: {query}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create search pattern
        search_pattern = f"%{query}%"
        logger.info(f"Using search pattern: {search_pattern}")
        
        # Query to search companies
        query_sql = """
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
                WHERE b.tin IS NOT NULL AND b.bid > 0
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
            WHERE (company ILIKE %s OR tin ILIKE %s)
            GROUP BY tin, company
            HAVING COUNT(project_id) >= 1
            ORDER BY total_bids DESC
            LIMIT 20
        """
        
        logger.info(f"Executing SQL query...")
        
        # Execute query
        cursor.execute(query_sql, (search_pattern, search_pattern))
        results = cursor.fetchall()
        
        logger.info(f"Query returned {len(results)} results")
        
        # Convert to list of dictionaries
        companies = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        return companies
    
    except Exception as e:
        logger.error(f"Error searching companies: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error searching companies: {str(e)}")
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")

@router.get("/company-projects/{company_tin}", response_model=List[CompanyProject])
async def get_company_projects(company_tin: str):
    """
    Get projects for a specific company by TIN.
    
    Args:
        company_tin: Company TIN
        
    Returns:
        List of company projects
    """
    logger.info(f"Getting projects for company with TIN: {company_tin}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to get company projects
        query = """
            SELECT 
                p.winner,
                p.project_name,
                p.sum_price_agree,
                TO_CHAR(p.transaction_date, 'YYYY-MM-DD') as transaction_date,
                TO_CHAR(p.contract_date, 'YYYY-MM-DD') as contract_date
            FROM public_data.thai_govt_project p
            WHERE p.winner_tin = %s
              AND p.project_name IS NOT NULL
              AND p.sum_price_agree > 0
            ORDER BY 
                COALESCE(p.contract_date, p.transaction_date) DESC NULLS LAST,
                p.sum_price_agree DESC
        """
        
        # Execute query
        cursor.execute(query, (company_tin,))
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        projects = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        if not projects:
            # Try to find projects by alternative method if none found by TIN
            logger.info(f"No projects found by TIN, trying by company name")
            return await get_company_projects_by_name(company_tin)
        
        logger.info(f"Found {len(projects)} projects for company")
        return projects
    
    except Exception as e:
        logger.error(f"Error getting company projects: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error getting company projects: {str(e)}")
    finally:
        if conn:
            conn.close()

async def get_company_projects_by_name(company_tin: str):
    """
    Fallback method to get projects by company name if TIN lookup fails.
    
    Args:
        company_tin: Company TIN
        
    Returns:
        List of company projects
    """
    logger.info(f"Looking up company name from TIN: {company_tin}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First, get company name from TIN
        cursor.execute(
            "SELECT DISTINCT company FROM public_data.thai_project_bid_info WHERE tin = %s LIMIT 1", 
            (company_tin,)
        )
        company_result = cursor.fetchone()
        
        if not company_result:
            logger.warning(f"No company found with TIN: {company_tin}")
            return []
        
        company_name = company_result["company"]
        logger.info(f"Found company name: {company_name}")
        
        # Query to get company projects by name
        query = """
            SELECT 
                p.winner,
                p.project_name,
                p.sum_price_agree,
                TO_CHAR(p.transaction_date, 'YYYY-MM-DD') as transaction_date,
                TO_CHAR(p.contract_date, 'YYYY-MM-DD') as contract_date
            FROM public_data.thai_govt_project p
            WHERE p.winner = %s
              AND p.project_name IS NOT NULL
              AND p.sum_price_agree > 0
            ORDER BY 
                COALESCE(p.contract_date, p.transaction_date) DESC NULLS LAST,
                p.sum_price_agree DESC
        """
        
        # Execute query
        cursor.execute(query, (company_name,))
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        projects = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found {len(projects)} projects by company name")
        return projects
    
    except Exception as e:
        logger.error(f"Error getting company projects by name: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error getting company projects by name: {str(e)}")
    finally:
        if conn:
            conn.close()

@router.get("/competitor-projects")
async def get_competitor_projects(
    company_tin: str = Query(..., description="Company TIN"),
    competitor_tin: str = Query(..., description="Competitor TIN")
):
    """
    Get projects where both the company and competitor participated.
    
    Args:
        company_tin: Company TIN
        competitor_tin: Competitor TIN
        
    Returns:
        List of projects with bid details for both companies
    """
    logger.info(f"Getting competitor projects: company={company_tin}, competitor={competitor_tin}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to find projects where both companies participated
        query = """
            WITH common_projects AS (
                SELECT DISTINCT a.project_id
                FROM public_data.thai_project_bid_info a
                JOIN public_data.thai_project_bid_info b 
                  ON a.project_id = b.project_id
                WHERE a.tin = %s AND b.tin = %s
            )
            SELECT 
                p.project_id,
                p.project_name,
                p.sum_price_agree AS winning_bid,
                p.winner,
                p.winner_tin,
                TO_CHAR(p.transaction_date, 'YYYY-MM-DD') as transaction_date,
                TO_CHAR(p.contract_date, 'YYYY-MM-DD') as contract_date,
                c1.company AS company_name,
                c1.bid AS company_bid,
                c2.company AS competitor_name,
                c2.bid AS competitor_bid,
                CASE WHEN p.winner_tin = %s THEN TRUE 
                     WHEN p.winner_tin = %s THEN FALSE 
                     ELSE NULL 
                END AS company_won
            FROM public_data.thai_govt_project p
            JOIN common_projects cp ON p.project_id = cp.project_id
            JOIN public_data.thai_project_bid_info c1 ON p.project_id = c1.project_id AND c1.tin = %s
            JOIN public_data.thai_project_bid_info c2 ON p.project_id = c2.project_id AND c2.tin = %s
            ORDER BY p.contract_date DESC NULLS LAST
        """
        
        # Execute query
        cursor.execute(query, (company_tin, competitor_tin, company_tin, competitor_tin, company_tin, competitor_tin))
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        projects = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found {len(projects)} common projects between companies")
        return {"company_tin": company_tin, "competitor_tin": competitor_tin, "projects": projects}
    
    except Exception as e:
        logger.error(f"Error getting competitor projects: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error getting competitor projects: {str(e)}")
    finally:
        if conn:
            conn.close()

# Add this to search.py router

@router.get("/adjacent-companies/{company_tin}")
async def get_adjacent_companies(company_tin: str):
    """
    Get companies that have participated in the same bids as the specified company.
    
    Args:
        company_tin: Company TIN
        
    Returns:
        List of adjacent companies with their win rate data
    """
    logger.info(f"Finding adjacent companies for company with TIN: {company_tin}")
    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First, get all project IDs where the company has bid
        projects_query = """
            SELECT DISTINCT project_id
            FROM public_data.thai_project_bid_info
            WHERE tin = %s
        """
        cursor.execute(projects_query, (company_tin,))
        project_results = cursor.fetchall()
        
        if not project_results:
            return []
        
        # Extract project IDs
        project_ids = [row["project_id"] for row in project_results]
        
        # Create placeholders for the IN clause
        placeholders = ', '.join(['%s'] * len(project_ids))
        
        # Query to find all companies that bid on these projects
        query = f"""
            WITH company_bids AS (
                SELECT
                    tin,
                    company,
                    COUNT(DISTINCT project_id) AS bid_count
                FROM public_data.thai_project_bid_info
                WHERE project_id IN ({placeholders})
                AND tin != %s  -- Exclude the original company
                GROUP BY tin, company
                ORDER BY bid_count DESC
            ),
            win_data AS (
                SELECT
                    b.tin,
                    COUNT(DISTINCT b.project_id) AS total_bids,
                    SUM(CASE WHEN b.tin = p.winner_tin THEN 1 ELSE 0 END) AS wins
                FROM public_data.thai_project_bid_info b
                JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.tin IN (SELECT tin FROM company_bids)
                GROUP BY b.tin
            )
            SELECT
                cb.tin,
                cb.company,
                cb.bid_count AS common_bids,
                COALESCE(wd.total_bids, 0) AS total_bids,
                COALESCE(wd.wins, 0) AS wins,
                CASE 
                    WHEN COALESCE(wd.total_bids, 0) > 0 
                    THEN (COALESCE(wd.wins, 0) * 100.0 / COALESCE(wd.total_bids, 0))::numeric(10,1)
                    ELSE 0 
                END AS win_rate
            FROM company_bids cb
            LEFT JOIN win_data wd ON cb.tin = wd.tin
            ORDER BY cb.bid_count DESC
            LIMIT 20
        """
        
        # Execute query with project IDs and the original company TIN
        params = project_ids + [company_tin]
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        adjacent_companies = [dict(row) for row in results]
        
        # Close connection
        cursor.close()
        
        logger.info(f"Found {len(adjacent_companies)} adjacent companies")
        return adjacent_companies
    
    except Exception as e:
        logger.error(f"Error finding adjacent companies: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error finding adjacent companies: {str(e)}")
    finally:
        if conn:
            conn.close()