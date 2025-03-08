# app/utils/env.py
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def load_env_vars():
    """
    Load environment variables from .env file.
    This function tries multiple locations to find the .env file.
    """
    # Try to find .env in the project root (parent of app directory)
    root_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(root_path, '.env')
    
    if os.path.exists(env_path):
        logger.info(f"Loading environment variables from {env_path}")
        load_dotenv(dotenv_path=env_path)
        return True
    
    # Try the app directory itself
    app_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(app_path, '.env')
    
    if os.path.exists(env_path):
        logger.info(f"Loading environment variables from {env_path}")
        load_dotenv(dotenv_path=env_path)
        return True
        
    # Try the current working directory
    cwd_path = os.path.join(os.getcwd(), '.env')
    
    if os.path.exists(cwd_path):
        logger.info(f"Loading environment variables from {cwd_path}")
        load_dotenv(dotenv_path=cwd_path)
        return True
    
    logger.warning("No .env file found in any expected location")
    return False

def get_db_config():
    """Get database configuration from environment variables"""
    # Ensure environment variables are loaded
    load_env_vars()
    
    config = {
        "host": os.getenv("POSTGRES_HOST", ""),
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "dbname": os.getenv("POSTGRES_NAME", "projects"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", ""),
    }
    
    return config