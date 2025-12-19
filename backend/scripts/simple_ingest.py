#!/usr/bin/env python3
"""
Simple ingestion script that processes known URLs directly
"""

import asyncio
import sys
import os
from pathlib import Path
import logging
from datetime import datetime

# Add parent directory to Python path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(parent_dir / "src"))

# Import services
try:
    from src.config import settings
    from src.services.ingestion import ContentIngestionService
    from src.services.qdrant_client import QdrantService
    from qdrant_client.models import PointStruct
    from src.services.cohere_client import cohere_service
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Known documentation URLs
DOC_URLS = [
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/intro/overview",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/intro/architecture-overview",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/intro/hardware-requirements",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/ros2/fundamentals",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/ros2/rclpy-implementation",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/ros2/urdf-and-robot-modeling",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/simulation/gazebo-setup",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/simulation/sensor-modeling",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/simulation/unity-visualization",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/aicontrol/isaac-sim-setup",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/aicontrol/humanoid-kinematics",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/aicontrol/sim-to-real-transfer",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/hardware/workstation-spec",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/hardware/procurement-tables",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/capstone/final-project-breakdown",
    "https://hackathon-physical-ai-humanoid-robo-five.vercel.app/capstone/vla-conversational-ai"
]


async def main():
    """Main ingestion function"""
    try:
        # Initialize services
        logger.info("Initializing services...")
        ingestion_service = ContentIngestionService()
        qdrant_service = QdrantService()

        # Initialize Qdrant
        await qdrant_service.initialize()
        logger.info("Qdrant service initialized")

        # Check collection status
        try:
            info = qdrant_service.get_collection_info()
            if info:
                logger.info(f"Collection exists with {info.points_count} points")
        except Exception as e:
            logger.info(f"Collection check: {e}")

        # Statistics
        stats = {
            "pages_processed": 0,
            "chunks_created": 0,
            "embeddings_generated": 0,
            "errors": []
        }

        logger.info(f"Starting ingestion of {len(DOC_URLS)} pages...")

        for i, url in enumerate(DOC_URLS, 1):
            logger.info(f"Processing page {i}/{len(DOC_URLS)}: {url}")
            try:
                # Process page
                chunks = await ingestion_service._process_page(url)

                if chunks:
                    # Generate embeddings and store in Qdrant
                    for chunk in chunks:
                        # Generate embedding
                        embedding = cohere_service.generate_embeddings(
                            [chunk.content],
                            input_type="search_document"
                        )

                        # Store in Qdrant
                        point = PointStruct(
                            id=chunk.chunk_id,
                            vector=embedding[0],
                            payload={
                                "url": chunk.url,
                                "title": chunk.title,
                                "section_title": chunk.section_title,
                                "content": chunk.content,
                                "chapter": chunk.chapter,
                                "content_type": chunk.content_type,
                                "technical_level": chunk.technical_level,
                                "keywords": chunk.breadcrumb_path if hasattr(chunk, 'breadcrumb_path') else [],
                                "page_number": getattr(chunk, 'page_number', None),
                                "chunk_index": getattr(chunk, 'chunk_index', None),
                                "token_count": chunk.token_count
                            }
                        )
                        qdrant_service.add_points([point])
                        stats["embeddings_generated"] += 1

                    stats["pages_processed"] += 1
                    stats["chunks_created"] += len(chunks)
                    logger.info(f"  ✓ Created {len(chunks)} chunks with {len(chunks)} embeddings")
                else:
                    logger.warning(f"  ✗ No content found on page")

            except Exception as e:
                error_msg = f"Failed to process {url}: {e}"
                logger.error(error_msg)
                stats["errors"].append(error_msg)

        # Report results
        logger.info("\n=== Ingestion Complete ===")
        logger.info(f"Pages processed: {stats['pages_processed']}")
        logger.info(f"Chunks created: {stats['chunks_created']}")
        logger.info(f"Embeddings generated: {stats['embeddings_generated']}")

        if stats.get("errors"):
            logger.error(f"Errors encountered: {len(stats['errors'])}")
            for error in stats["errors"]:
                logger.error(f"  - {error}")
        else:
            logger.info("No errors encountered!")

        # Verify collection
        try:
            final_count = qdrant_service.count_points()
            logger.info(f"Final collection count: {final_count} points")
        except Exception as e:
            logger.warning(f"Could not verify final count: {e}")

        return 0 if not stats.get("errors") else 1

    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)