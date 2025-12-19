#!/usr/bin/env python3
"""
Modified content ingestion script for RAG chatbot embeddings
"""

import asyncio
import argparse
import sys
import os
from pathlib import Path
import logging

# Add parent directory to Python path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(parent_dir / "src"))

# Now import with absolute paths
try:
    from src.config import settings
    from src.services.ingestion import ContentIngestionService
    from src.services.qdrant_client import QdrantService
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main ingestion function"""
    parser = argparse.ArgumentParser(description="Ingest book content into Qdrant")
    parser.add_argument(
        "--url",
        default=getattr(settings, 'docs_base_url', 'https://hackathon-physical-ai-humanoid-robo-five.vercel.app'),
        help="Base URL of Docusaurus site"
    )
    parser.add_argument(
        "--collection",
        default=getattr(settings, 'qdrant_collection_name', 'book_content'),
        help="Qdrant collection name"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing collection before ingestion"
    )
    args = parser.parse_args()

    try:
        # Initialize services
        logger.info("Initializing services...")
        ingestion_service = ContentIngestionService()
        qdrant_service = QdrantService()

        # Initialize Qdrant
        await qdrant_service.initialize()
        logger.info("Qdrant service initialized")

        # Clear collection if requested
        if args.clear:
            logger.warning(f"Collection clear requested - please delete collection '{args.collection}' manually if needed")

        # Check collection status
        try:
            info = qdrant_service.get_collection_info()
            if info:
                logger.info(f"Collection '{args.collection}' exists with {info.points_count} points")
            else:
                logger.info(f"Collection '{args.collection}' exists but no info available")
        except Exception as e:
            logger.info(f"Collection check warning: {e}")

        # Start ingestion
        logger.info(f"Starting ingestion from: {args.url}")
        stats = await ingestion_service.ingest_from_url(args.url)

        # Report results
        logger.info("\n=== Ingestion Complete ===")
        logger.info(f"Pages processed: {stats['pages_processed']}")
        logger.info(f"Chunks created: {stats['chunks_created']}")

        if 'duration_seconds' in stats:
            logger.info(f"Duration: {stats['duration_seconds']:.2f} seconds")

        if 'embeddings_generated' in stats:
            logger.info(f"Embeddings generated: {stats['embeddings_generated']}")

        if stats.get("errors"):
            logger.error(f"Errors encountered: {len(stats['errors'])}")
            for error in stats["errors"][:5]:  # Show first 5 errors
                logger.error(f"  - {error}")
            if len(stats["errors"]) > 5:
                logger.error(f"  ... and {len(stats['errors']) - 5} more errors")
        else:
            logger.info("No errors encountered!")

        # Verify collection
        try:
            final_count = qdrant_service.count_points()
            logger.info(f"Final collection count: {final_count} points")
        except Exception as e:
            logger.warning(f"Could not verify final count: {e}")

        return 0 if not stats.get("errors") else 1

    except KeyboardInterrupt:
        logger.info("\nIngestion interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)