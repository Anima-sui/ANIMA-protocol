"""Backend API client for agent signal execution."""

import asyncio
import logging
import os
import time
from typing import Optional, Dict, Any
import aiohttp
import requests
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class ExecuteRequest:
    """Payload for /agent/execute endpoint."""
    agent_id: str
    signal: str
    price: float
    confidence: float
    timestamp: str
    skill_blob_id: Optional[str] = None
    reasoning: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class BackendAPIClient:
    """
    Client for communicating with ANIMA backend.
    
    Submits trading signals and receives execution confirmations.
    """
    
    def __init__(self, backend_url: Optional[str] = None):
        """
        Initialize backend API client.
        
        Args:
            backend_url: Backend API base URL
                        (default: http://localhost:3000)
        """
        self.backend_url = backend_url or os.getenv(
            "BACKEND_API_URL",
            "http://localhost:3000"
        )
        self.timeout = int(os.getenv("BACKEND_API_TIMEOUT", "30"))
        self.session: Optional[aiohttp.ClientSession] = None
        
        logger.info(f"🔌 BackendAPIClient initialized")
        logger.info(f"   Backend URL: {self.backend_url}")
    
    async def initialize(self):
        """Initialize async HTTP session."""
        if self.session is None:
            self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Close async HTTP session."""
        if self.session:
            await self.session.close()
    
    async def __aenter__(self):
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    def submit_signal(
        self,
        agent_id: str,
        signal: str,
        price: float,
        confidence: float,
        skill_blob_id: Optional[str] = None,
        reasoning: Optional[str] = None,
        max_retries: int = 3
    ) -> bool:
        """
        Submit trading signal to backend.
        
        Args:
            agent_id: ANIMA object ID
            signal: BUY/HOLD/SELL
            price: Current market price
            confidence: Signal confidence (0-100)
            skill_blob_id: Walrus blob ID for skill config
            reasoning: Why the signal was generated
            max_retries: Maximum retry attempts on failure
        
        Returns:
            True if submission successful, False otherwise
        """
        try:
            request = ExecuteRequest(
                agent_id=agent_id,
                signal=signal,
                price=price,
                confidence=confidence,
                timestamp=datetime.utcnow().isoformat(),
                skill_blob_id=skill_blob_id,
                reasoning=reasoning
            )
            
            logger.info(f"📤 Submitting signal to backend: {signal}")
            logger.info(f"   Price: ${price:.4f}")
            logger.info(f"   Confidence: {confidence:.0f}%")
            
            # Try with retries
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        f"{self.backend_url}/agent/execute",
                        json=request.to_dict(),
                        timeout=self.timeout
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        logger.info(f"✓ Signal submitted successfully")
                        logger.debug(f"  Response: {result}")
                        return True
                    
                    elif response.status_code >= 400:
                        logger.error(f"✖ Server error: {response.status_code}")
                        logger.error(f"  Response: {response.text}")
                        
                        if response.status_code >= 500 and attempt < max_retries - 1:
                            # Retry on server errors
                            wait_time = 2 ** attempt  # Exponential backoff
                            logger.info(f"  Retrying in {wait_time}s...")
                            time.sleep(wait_time)
                            continue
                        else:
                            return False
                    
                    else:
                        logger.warning(f"Unexpected status: {response.status_code}")
                        return False
                
                except requests.exceptions.Timeout:
                    logger.error(f"Request timeout (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    else:
                        return False
                
                except requests.exceptions.ConnectionError:
                    logger.error(f"Connection error (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    else:
                        logger.error("Failed to reach backend after retries")
                        return False
            
            return False
        
        except Exception as e:
            logger.error(f"Error submitting signal: {e}")
            return False
    
    def health_check(self) -> bool:
        """
        Check if backend is reachable.
        
        Returns:
            True if backend is healthy, False otherwise
        """
        try:
            logger.info("🏥 Health checking backend...")
            
            response = requests.get(
                f"{self.backend_url}/health",
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                logger.info("✓ Backend is healthy")
                return True
            else:
                logger.warning(f"✗ Backend returned {response.status_code}")
                return False
        
        except requests.exceptions.ConnectionError:
            logger.warning("✗ Cannot reach backend (connection refused)")
            return False
        
        except Exception as e:
            logger.warning(f"✗ Health check failed: {e}")
            return False
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current agent status from backend.
        
        Args:
            agent_id: ANIMA object ID
        
        Returns:
            Status dict or None if unavailable
        """
        try:
            response = requests.get(
                f"{self.backend_url}/agent/{agent_id}/status",
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to get status: {response.status_code}")
                return None
        
        except Exception as e:
            logger.warning(f"Error getting agent status: {e}")
            return None
    
    def get_execution_history(
        self,
        agent_id: str,
        limit: int = 100
    ) -> Optional[list]:
        """
        Get recent executions for an agent.
        
        Args:
            agent_id: ANIMA object ID
            limit: Maximum number of results
        
        Returns:
            List of executions or None
        """
        try:
            response = requests.get(
                f"{self.backend_url}/agent/{agent_id}/executions",
                params={"limit": limit},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to get history: {response.status_code}")
                return None
        
        except Exception as e:
            logger.warning(f"Error getting execution history: {e}")
            return None


def main():
    """Test the backend API client."""
    logging.basicConfig(level=logging.INFO)
    
    client = BackendAPIClient()
    
    # Test health check
    print("\n=== Backend API Client Test ===\n")
    is_healthy = client.health_check()
    
    if is_healthy:
        # Test signal submission
        success = client.submit_signal(
            agent_id="0x1234567890123456789012345678901234567890",
            signal="BUY_SIGNAL",
            price=0.42,
            confidence=85.0,
            reasoning="Moving average crossover bullish signal"
        )
        
        if success:
            print("\n✓ Signal submitted successfully")
        else:
            print("\n✗ Signal submission failed")
    else:
        print("\n⚠️  Backend is not reachable")
        print("   Run: cd ../backend && npm run dev")


if __name__ == "__main__":
    main()
