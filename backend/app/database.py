# app/database.py
import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException
from .utils.env import get_db_config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Establish connection to PostgreSQL database"""
    try:
        # Get connection parameters from environment variables
        config = get_db_config()
        db_host = config["host"]
        db_port = config["port"]
        db_name = config["dbname"]
        db_user = config["user"]
        db_password = config["password"]
                
        if not db_host or not db_name or not db_user:
            raise ValueError("Missing required database connection parameters")
            
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            cursor_factory=RealDictCursor
        )
        
        logger.info("Database connection successful")
        return conn
        
    except ValueError as ve:
        error_msg = f"Database configuration error: {str(ve)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
        
    except psycopg2.OperationalError as e:
        error_msg = f"Could not connect to database: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
        
    except Exception as e:
        error_msg = f"Database connection error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def test_db_connection():
    """Test the database connection and return details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get PostgreSQL version
        cursor.execute("SELECT version();")
        version = cursor.fetchone()["version"]
        
        # Check if required tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public_data' 
            AND table_name IN ('thai_govt_project', 'thai_project_bid_info');
        """)
        tables = [row["table_name"] for row in cursor.fetchall()]
        
        # Get row counts
        table_counts = {}
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM public_data.{table}")
            count = cursor.fetchone()["count"]
            table_counts[table] = count
        
        # Close connection
        cursor.close()
        conn.close()
        
        return {
            "status": "connected",
            "version": version,
            "tables": tables,
            "row_counts": table_counts
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }