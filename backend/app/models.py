# app/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime

class ProjectData(BaseModel):
    month: str
    year: int
    total_sum_price_agree: float
    count: int

class CompanyProject(BaseModel):
    winner: str
    project_name: str
    sum_price_agree: float
    transaction_date: Optional[str] = None
    contract_date: Optional[str] = None
    
    class Config:
        # This allows the model to convert dates to strings
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat() if v else None
        }

class CompanyWinRate(BaseModel):
    tin: str
    company: str
    total_bids: int
    wins: int
    win_rate: float
    total_bid_value: float
    avg_bid: float
    avg_bid_ratio: float

class HeadToHeadCompetitor(BaseModel):
    competitor_tin: str
    competitor: str
    encounters: int
    company_wins: int
    competitor_wins: int
    win_rate_vs_competitor: float

class HeadToHeadResponse(BaseModel):
    company: str
    competitors: List[HeadToHeadCompetitor]

class BidRatioStats(BaseModel):
    avg_bid_ratio: float
    median_bid_ratio: Optional[float] = None
    min_bid_ratio: float
    max_bid_ratio: float
    std_bid_ratio: Optional[float] = None
    avg_winning_bid_ratio: Optional[float] = None
    avg_losing_bid_ratio: Optional[float] = None
    percentile: Optional[float] = None

class DepartmentAnalysis(BaseModel):
    dept_name: str
    bids: int
    wins: int
    win_rate: float
    avg_bid_ratio: float

class BidStrategyResponse(BaseModel):
    company: str
    bid_ratio_stats: BidRatioStats
    department_analysis: List[DepartmentAnalysis]