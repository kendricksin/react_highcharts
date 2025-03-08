# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# Import your routers
from app.routers import projects, search, winrates, diagnostic

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Thai Government Projects API",
    description="API for Thai government project data analysis",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(projects.router)
app.include_router(search.router)
app.include_router(winrates.router)
app.include_router(diagnostic.router)

@app.get("/")
async def root():
    """
    Root endpoint providing API information.
    """
    return {
        "message": "Welcome to the Thai Government Projects API",
        "documentation": "/docs",
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
    }

# Run the application using Uvicorn if executed as script
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Log startup information
    logger.info(f"Starting server on {host}:{port}")
    
    # Run the server
    uvicorn.run("main:app", host=host, port=port, reload=True)