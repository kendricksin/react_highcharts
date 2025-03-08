# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from app.utils.env import load_env_vars, get_db_config
from app.routers import projects, winrates, search, diagnostic

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_env_vars()

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

# Include routers
app.include_router(projects.router)
app.include_router(winrates.router)
app.include_router(search.router)
app.include_router(diagnostic.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Project Data API"}

@app.on_event("startup")
async def startup_event():
    """Log configuration on startup"""
    logger.info("Starting up the Project Data API")
    try:
        # Get database connection parameters (without password)
        config = get_db_config()
        db_host = config["host"]
        db_port = config["port"]
        db_name = config["dbname"]
        db_user = config["user"]
        has_password = "Yes" if config["password"] else "No"
        
        # Log configuration
        logger.info(f"Database configuration: host={db_host}, port={db_port}, dbname={db_name}, user={db_user}, password_set={has_password}")
        logger.info(f"Server configuration: host={os.getenv('HOST', '0.0.0.0')}, port={os.getenv('PORT', '8000')}")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variables or use default
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run("main:app", host=host, port=port, reload=True)