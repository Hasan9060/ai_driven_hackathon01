#!/usr/bin/env python3
"""
Content ingestion script for RAG chatbot

Usage:
    python scripts/ingest.py [--url <base_url>] [--collection <collection_name>]

Options:
    --url         Base URL of Docusaurus site (default: from config)
    --collection  Qdrant collection name (default: from config)
"""

import asyncio
import argparse
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from config import settings
from services.ingestion import ContentIngestionService
from services.qdrant_client import qdrant_service
import logging

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
        default=settings.docs_base_url,
        help=f"Base URL of Docusaurus site (default: {settings.docs_base_url})"
    )
    parser.add_argument(
        "--collection",
        default=settings.qdrant_collection_name,
        help=f"Qdrant collection name (default: {settings.qdrant_collection_name})"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing collection before ingestion"
    )
    args = parser.parse_args()

    try:
        # Initialize services
        ingestion_service = ContentIngestionService()
        await qdrant_service.initialize()

        # Clear collection if requested
        if args.clear:
            logger.info(f"Clearing collection '{args.collection}'...")
            # Note: Qdrant client doesn't have a direct clear method
            # You would need to delete and recreate the collection
            logger.warning("Collection clear not implemented - please delete manually if needed")

        # Check collection status
        info = qdrant_service.get_collection_info()
        if info:
            logger.info(f"Collection '{args.collection}' exists with {info.points_count} points")
        else:
            logger.error(f"Collection '{args.collection}' not found")
            return 1

        # Start ingestion
        logger.info(f"Starting ingestion from: {args.url}")
        stats = await ingestion_service.ingest_from_url(args.url)

        # Report results
        logger.info("\n=== Ingestion Complete ===")
        logger.info(f"Pages processed: {stats['pages_processed']}")
        logger.info(f"Chunks created: {stats['chunks_created']}")
        logger.info(f"Duration: {stats.get('duration_seconds', 0):.2f} seconds")

        if stats["errors"]:
            logger.error(f"Errors encountered: {len(stats['errors'])}")
            for error in stats["errors"]:
                logger.error(f"  - {error}")
        else:
            logger.info("No errors encountered!")

        # Verify collection
        final_count = qdrant_service.count_points()
        logger.info(f"Final collection count: {final_count} points")

        return 0 if not stats["errors"] else 1

    except KeyboardInterrupt:
        logger.info("\nIngestion interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))