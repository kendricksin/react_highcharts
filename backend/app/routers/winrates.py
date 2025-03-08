# app/routers/winrates.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..database import get_db_connection
from ..models import CompanyWinRate, HeadToHeadResponse, BidStrategyResponse

router = APIRouter(
    prefix="/api",
    tags=["win_rates"],
    responses={404: {"description": "Not found"}},
)

@router.get("/head-to-head", response_model=HeadToHeadResponse)
async def get_head_to_head(
    company_tin: str = Query(..., description="Company TIN to analyze"),
    top_n: int = Query(5, ge=1, le=20, description="Number of top competitors to include")
):
    """
    Get head-to-head competition data for a specific company.
    
    Args:
        company_tin: TIN of the company to analyze
        top_n: Number of top competitors to include (default: 5)
        
    Returns:
        Head-to-head competition analysis
    """
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to find company name first
        cursor.execute("SELECT DISTINCT company FROM public_data.thai_project_bid_info WHERE tin = %s LIMIT 1", (company_tin,))
        company_result = cursor.fetchone()
        
        if not company_result:
            raise HTTPException(status_code=404, detail=f"Company with TIN {company_tin} not found")
        
        company_name = company_result["company"]
        
        # Query to get projects where the company participated
        query_projects = """
            SELECT project_id 
            FROM public_data.thai_project_bid_info 
            WHERE tin = %s
        """
        cursor.execute(query_projects, (company_tin,))
        project_results = cursor.fetchall()
        
        if not project_results:
            return {"company": company_name, "competitors": []}
        
        company_projects = [row["project_id"] for row in project_results]
        
        # Format project IDs for IN clause
        projects_placeholders = ', '.join(['%s'] * len(company_projects))
        
        # Query to get head-to-head data
        query_h2h = f"""
            WITH company_projects AS (
                SELECT DISTINCT project_id
                FROM public_data.thai_project_bid_info
                WHERE tin = %s
            ),
            project_bidders AS (
                SELECT 
                    b.project_id,
                    b.tin,
                    b.company,
                    p.winner_tin,
                    CASE WHEN b.tin = p.winner_tin THEN 1 ELSE 0 END AS won_bid
                FROM public_data.thai_project_bid_info b
                JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.project_id IN ({projects_placeholders})
            ),
            competitor_encounters AS (
                SELECT 
                    pb.tin AS competitor_tin,
                    pb.company AS competitor,
                    COUNT(DISTINCT pb.project_id) AS encounters
                FROM project_bidders pb
                WHERE pb.tin != %s
                GROUP BY pb.tin, pb.company
                HAVING COUNT(DISTINCT pb.project_id) > 1
                ORDER BY encounters DESC
                LIMIT %s
            )
            SELECT 
                ce.competitor_tin,
                ce.competitor,
                ce.encounters,
                SUM(CASE WHEN pb.tin = %s AND pb.won_bid = 1 THEN 1 ELSE 0 END) AS company_wins,
                SUM(CASE WHEN pb.tin = ce.competitor_tin AND pb.won_bid = 1 THEN 1 ELSE 0 END) AS competitor_wins
            FROM competitor_encounters ce
            JOIN project_bidders pb ON (pb.tin = ce.competitor_tin OR pb.tin = %s)
                AND pb.project_id IN (
                    SELECT project_id FROM project_bidders 
                    WHERE tin = ce.competitor_tin
                    INTERSECT
                    SELECT project_id FROM project_bidders 
                    WHERE tin = %s
                )
            GROUP BY ce.competitor_tin, ce.competitor, ce.encounters
            ORDER BY ce.encounters DESC
        """
        
        # Prepare parameters - company_tin appears multiple times
        params = [company_tin] + company_projects + [company_tin, top_n, company_tin, company_tin, company_tin]
        
        # Execute query
        cursor.execute(query_h2h, params)
        h2h_results = cursor.fetchall()
        
        # Process results
        competitors = []
        for row in h2h_results:
            row_dict = dict(row)
            # Calculate win rate
            encounters = row_dict.get("encounters", 0)
            company_wins = row_dict.get("company_wins", 0)
            
            win_rate = (company_wins / encounters * 100) if encounters > 0 else 0
            row_dict["win_rate_vs_competitor"] = round(win_rate, 2)
            
            competitors.append(row_dict)
        
        # Close connection
        cursor.close()
        conn.close()
        
        return {"company": company_name, "competitors": competitors}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")

@router.get("/bid-strategy", response_model=BidStrategyResponse)
async def get_bid_strategy(
    company_tin: str = Query(..., description="Company TIN to analyze")
):
    """
    Get bid strategy analysis for a specific company.
    
    Args:
        company_tin: TIN of the company to analyze
        
    Returns:
        Bid strategy analysis
    """
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to find company name first
        cursor.execute("SELECT DISTINCT company FROM public_data.thai_project_bid_info WHERE tin = %s LIMIT 1", (company_tin,))
        company_result = cursor.fetchone()
        
        if not company_result:
            raise HTTPException(status_code=404, detail=f"Company with TIN {company_tin} not found")
        
        company_name = company_result["company"]
        
        # Query to get bid ratio statistics
        query_stats = """
            WITH bid_data AS (
                SELECT 
                    b.project_id,
                    b.company,
                    b.tin,
                    b.bid,
                    p.winner,
                    p.winner_tin,
                    p.sum_price_agree,
                    p.dept_name,
                    CASE WHEN b.tin = p.winner_tin THEN 1 ELSE 0 END AS won_bid,
                    b.bid / NULLIF(p.sum_price_agree, 0) AS bid_ratio
                FROM public_data.thai_project_bid_info b
                LEFT JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.tin IS NOT NULL AND b.bid > 0
            )
            SELECT 
                AVG(bid_ratio) AS avg_bid_ratio,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bid_ratio) AS median_bid_ratio,
                MIN(bid_ratio) AS min_bid_ratio,
                MAX(bid_ratio) AS max_bid_ratio,
                STDDEV(bid_ratio) AS std_bid_ratio,
                AVG(CASE WHEN won_bid = 1 THEN bid_ratio ELSE NULL END) AS avg_winning_bid_ratio,
                AVG(CASE WHEN won_bid = 0 THEN bid_ratio ELSE NULL END) AS avg_losing_bid_ratio
            FROM bid_data
            WHERE tin = %s
        """
        
        # Execute query
        cursor.execute(query_stats, (company_tin,))
        stats_result = cursor.fetchone()
        
        if not stats_result:
            raise HTTPException(status_code=404, detail=f"No bid data found for company with TIN {company_tin}")
        
        bid_ratio_stats = dict(stats_result)
        
        # Query to get percentile ranking among other companies
        query_percentile = """
            WITH company_avg_ratios AS (
                SELECT 
                    tin,
                    AVG(b.bid / NULLIF(p.sum_price_agree, 0)) AS avg_ratio
                FROM public_data.thai_project_bid_info b
                LEFT JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.bid > 0
                GROUP BY tin
                HAVING COUNT(*) >= 3
            ),
            target_avg AS (
                SELECT avg_ratio 
                FROM company_avg_ratios 
                WHERE tin = %s
            ),
            ranked AS (
                SELECT 
                    COUNT(*) AS total_count,
                    SUM(CASE WHEN avg_ratio <= (SELECT avg_ratio FROM target_avg) THEN 1 ELSE 0 END) AS below_count
                FROM company_avg_ratios
            )
            SELECT 
                100.0 * below_count / total_count AS percentile
            FROM ranked
        """
        
        # Execute query
        cursor.execute(query_percentile, (company_tin,))
        percentile_result = cursor.fetchone()
        
        if percentile_result:
            bid_ratio_stats["percentile"] = percentile_result["percentile"]
        
        # Query to get department analysis
        query_dept = """
            WITH bid_data AS (
                SELECT 
                    b.project_id,
                    b.company,
                    b.tin,
                    b.bid,
                    p.winner,
                    p.winner_tin,
                    p.sum_price_agree,
                    p.dept_name,
                    CASE WHEN b.tin = p.winner_tin THEN 1 ELSE 0 END AS won_bid,
                    b.bid / NULLIF(p.sum_price_agree, 0) AS bid_ratio
                FROM public_data.thai_project_bid_info b
                LEFT JOIN public_data.thai_govt_project p ON b.project_id = p.project_id
                WHERE b.tin IS NOT NULL AND b.bid > 0
            )
            SELECT 
                dept_name,
                COUNT(project_id) AS bids,
                SUM(won_bid) AS wins,
                (SUM(won_bid) * 100.0 / COUNT(project_id))::numeric(10,2) AS win_rate,
                AVG(bid_ratio) AS avg_bid_ratio
            FROM bid_data
            WHERE tin = %s AND dept_name IS NOT NULL
            GROUP BY dept_name
            ORDER BY bids DESC
        """
        
        # Execute query
        cursor.execute(query_dept, (company_tin,))
        dept_results = cursor.fetchall()
        
        # Convert to list of dictionaries
        department_analysis = [dict(row) for row in dept_results]
        
        # Close connection
        cursor.close()
        conn.close()
        
        return {
            "company": company_name,
            "bid_ratio_stats": bid_ratio_stats,
            "department_analysis": department_analysis
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")