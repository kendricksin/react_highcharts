// src/types/index.ts

// Current project data interfaces
export interface ProjectData {
  month: string;
  year: number;
  total_sum_price_agree: number;
  count: number;
}

export interface ProjectInfo {
  name: string;
  value: number;
  date: string;
}

export interface CompanyYearInfo {
  total: number;
  projects: ProjectInfo[];
}

export interface ChartDataPoint {
  y: number;
  projects?: ProjectInfo[];
  color?: string;
}

export interface CompanyProject {
  winner: string;
  project_name: string;
  sum_price_agree: number;
  transaction_date?: string;
  contract_date?: string;
}

// New interfaces for PostgreSQL data
export interface CompanyWinRate {
  tin: string;
  company: string;
  total_bids: number;
  wins: number;
  win_rate: number;
  total_bid_value: number;
  avg_bid: number;
  avg_bid_ratio: number;
}

export interface HeadToHeadCompetitor {
  competitor_tin: string;
  competitor: string;
  encounters: number;
  company_wins: number;
  competitor_wins: number;
  win_rate_vs_competitor: number;
}

export interface HeadToHeadResponse {
  company: string;
  competitors: HeadToHeadCompetitor[];
}

export interface BidStrategyStats {
  avg_bid_ratio: number;
  median_bid_ratio?: number;
  min_bid_ratio: number;
  max_bid_ratio: number;
  std_bid_ratio?: number;
  avg_winning_bid_ratio?: number;
  avg_losing_bid_ratio?: number;
  percentile?: number;
}

export interface DepartmentAnalysis {
  dept_name: string;
  bids: number;
  wins: number;
  win_rate: number;
  avg_bid_ratio: number;
}

export interface BidStrategyResponse {
  company: string;
  bid_ratio_stats: BidStrategyStats;
  department_analysis: DepartmentAnalysis[];
}