#!/usr/bin/env python3
"""
Verify embeddings in Qdrant collection
"""

import asyncio
import sys
from pathlib import Path
import logging

# Add parent directory to Python path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(parent_dir / "src"))

# Import services
from src.services.qdrant_client import QdrantService
from src.services.cohere_client import cohere_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Verify embeddings"""
    try:
        # Initialize services
        logger.info("Initializing services...")
        qdrant_service = QdrantService()
        await qdrant_service.initialize()

        # Get collection info
        info = qdrant_service.get_collection_info()
        if info:
            logger.info(f"Collection exists with {info.points_count} points")
            logger.info(f"Collection status: {info.status}")
            logger.info(f"Vector size: {info.config.params.vectors.size}")
            logger.info(f"Distance metric: {info.config.params.vectors.distance}")
        else:
            logger.error("Collection not found")
            return 1

        # Test search
        logger.info("\nTesting search functionality...")
        query = "What is robotics?"

        # Generate query embedding
        query_embedding = cohere_service.generate_embeddings(
            [query],
            input_type="search_query"
        )[0]

        # Search for similar content
        results = qdrant_service.search(
            query_vector=query_embedding,
            limit=5
        )

        logger.info(f"Found {len(results)} results for query: '{query}'")

        for i, result in enumerate(results, 1):
            logger.info(f"\nResult {i}:")
            logger.info(f"  Score: {result['score']:.4f}")
            payload = result.get('payload', {})
            logger.info(f"  Title: {payload.get('title', 'N/A')}")
            logger.info(f"  URL: {payload.get('url', 'N/A')}")
            logger.info(f"  Content: {payload.get('content', 'N/A')[:200]}...")

        # Count total points
        count = qdrant_service.count_points()
        logger.info(f"\nTotal points in collection: {count}")

        # Success
        logger.info("\n✅ Embeddings verification complete!")
        return 0

    except Exception as e:
        logger.error(f"Verification failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)