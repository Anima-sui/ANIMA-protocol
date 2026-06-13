"""
Standalone predictor.py - ML-based trading signal generator for ANIMA agent.
Can be run independently or imported as a module.

Usage:
    python predictor.py          # Run with live price data
    python predictor.py test     # Run with test data
"""

import asyncio
import logging
import sys
from datetime import datetime
from src.monitor import PriceMonitor, PriceData
from src.predictor import PricePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)


def generate_test_prices(base_price: float = 1.0, num_points: int = 50) -> list:
    """Generate synthetic price data for testing."""
    prices = []
    price = base_price
    
    import random
    random.seed(42)
    
    for i in range(num_points):
        # Simulate price movement with trend and noise
        trend = 0.001 * (i % 20 - 10)  # Oscillating trend
        noise = random.gauss(0, 0.005)
        price = price * (1 + trend + noise)
        prices.append(max(price, base_price * 0.5))  # Prevent negative
    
    return prices


def log_signal_formatted(signal):
    """Log signal in the required ANIMA format."""
    print(f"\n{'='*70}")
    print(f"[ANIMA] Price: ${signal.price:.4f} | Signal: {signal.action} | Confidence: {signal.confidence:.0f}%")
    print(f"{'='*70}")
    print(f"       Timestamp: {signal.timestamp.isoformat()}")
    print(f"       Reasoning: {signal.reasoning}")
    print(f"{'='*70}\n")


async def run_live_predictor():
    """Run predictor with live price data from CoinGecko."""
    logger.info("\n" + "="*70)
    logger.info("ANIMA PRICE PREDICTOR - LIVE MODE")
    logger.info("="*70)
    logger.info("Connecting to CoinGecko for live SUI price data...")
    logger.info("Signals will update every 30 seconds once we have enough history.\n")
    
    price_monitor = PriceMonitor(poll_interval=30)
    predictor = PricePredictor(fast_window=5, slow_window=20)
    
    prediction_cycle = 0
    min_history = 25
    
    try:
        # Start monitoring loop
        monitor_task = asyncio.create_task(price_monitor.start())
        
        # Prediction loop
        while True:
            try:
                prediction_cycle += 1
                
                # Get price history
                sui_history = await price_monitor.get_price_history("sui", limit=100)
                
                if not sui_history:
                    logger.info(f"[Cycle {prediction_cycle}] Waiting for price data...")
                    await asyncio.sleep(10)
                    continue
                
                prices = [pd.price for pd in sui_history]
                
                # Train model once we have enough data
                if len(prices) >= min_history and not predictor.model_trained:
                    logger.info(f"📚 Training predictor with {len(prices)} price points...")
                    predictor.train(prices)
                    logger.info("✅ Model trained successfully!\n")
                
                # Generate prediction
                if len(prices) >= predictor.slow_window:
                    signal = predictor.predict(prices)
                    log_signal_formatted(signal)
                else:
                    ready_pct = int((len(prices) / predictor.slow_window) * 100)
                    logger.info(f"[Cycle {prediction_cycle}] Warming up... {ready_pct}% ready ({len(prices)}/{predictor.slow_window})")
                
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in prediction cycle: {e}")
                await asyncio.sleep(30)
    
    except KeyboardInterrupt:
        logger.info("\n✅ Predictor stopped by user")
        price_monitor.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
    finally:
        price_monitor.stop()


def run_test_predictor():
    """Run predictor with synthetic test data."""
    logger.info("\n" + "="*70)
    logger.info("ANIMA PRICE PREDICTOR - TEST MODE")
    logger.info("="*70)
    logger.info("Running with synthetic price data...\n")
    
    predictor = PricePredictor(fast_window=5, slow_window=20)
    
    # Generate test prices
    logger.info("📊 Generating synthetic price history...")
    test_prices = generate_test_prices(base_price=1.0, num_points=100)
    logger.info(f"✅ Generated {len(test_prices)} synthetic price points\n")
    
    # Train model
    logger.info("📚 Training predictor...")
    if predictor.train(test_prices):
        logger.info("✅ Model trained successfully!\n")
    
    # Generate signals for multiple price points to show progression
    logger.info("🎯 Generating trading signals...\n")
    
    test_windows = [
        ("Snapshot 1", test_prices[:30]),
        ("Snapshot 2", test_prices[:50]),
        ("Snapshot 3 (Latest)", test_prices),  # All data
    ]
    
    for name, prices in test_windows:
        signal = predictor.predict(prices)
        print(f"\n{name}:")
        log_signal_formatted(signal)
    
    # Demonstrate model behavior with price changes
    logger.info("\n" + "="*70)
    logger.info("TESTING MODEL RESPONSE TO PRICE CHANGES")
    logger.info("="*70)
    
    # Simulate uptrend
    uptrend_prices = test_prices[:30] + [test_prices[-1] * (1 + 0.01*i) for i in range(1, 16)]
    signal = predictor.predict(uptrend_prices)
    print(f"\nScenario: Strong uptrend (price up 15%)")
    log_signal_formatted(signal)
    
    # Simulate downtrend
    downtrend_prices = test_prices[:30] + [test_prices[-1] * (1 - 0.01*i) for i in range(1, 16)]
    signal = predictor.predict(downtrend_prices)
    print(f"\nScenario: Strong downtrend (price down 15%)")
    log_signal_formatted(signal)
    
    # Simulate sideways market
    sideways_prices = test_prices[:30] + [test_prices[-1] for _ in range(15)]
    signal = predictor.predict(sideways_prices)
    print(f"\nScenario: Sideways market (price flat)")
    log_signal_formatted(signal)
    
    logger.info("✅ Test mode completed successfully!")


def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1].lower() == "test":
        run_test_predictor()
    else:
        asyncio.run(run_live_predictor())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n✅ Shutdown complete")
        sys.exit(0)
