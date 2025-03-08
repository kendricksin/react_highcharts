# app/routers/diagnostic.py
from fastapi import APIRouter, HTTPException
import os
from ..database import test_db_connection

router = APIRouter(
    prefix="/api",
    tags=["diagnostic"],
    responses={500: {"description": "Internal server error"}},
)

@router.get("/db-status")
async def check_database_status():
    """
    Check the status of the database connection and return diagnostic information.
    This endpoint is useful for troubleshooting database connectivity issues.
    """
    # Test database connection
    db_status = test_db_connection()
    
    # Get environment variable information (without exposing passwords)
    env_info = {
        "DB_HOST": os.getenv("DB_HOST", "Not set"),
        "DB_PORT": os.getenv("DB_PORT", "Not set"),
        "DB_NAME": os.getenv("DB_NAME", "Not set"),
        "DB_USER": os.getenv("DB_USER", "Not set"),
        "PASSWORD_SET": "Yes" if os.getenv("DB_PASSWORD") else "No"
    }
    
    return {
        "database": db_status,
        "environment": env_info
    }