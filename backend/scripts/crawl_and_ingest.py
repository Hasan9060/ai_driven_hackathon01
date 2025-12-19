#!/usr/bin/env python3
"""
Crawl and ingest script for RAG chatbot
Crawls the Docusaurus site and ingests all documentation pages
"""

import asyncio
import argparse
import sys
import os
import re
import json
from pathlib import Path
import logging
from typing import List, Set
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Add parent directory to Python path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(parent_dir / "src"))

# Import services
try:
    from src.config import settings
    from src.services.ingestion import ContentIngestionService
    from src.services.qdrant_client import QdrantService
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SiteCrawler:
    """Crawls Docusaurus site to find all documentation pages"""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.visited_urls: Set[str] = set()
        self.doc_urls: List[str] = []

    def crawl(self) -> List[str]:
        """Crawl the site and return all documentation URLs"""
        logger.info(f"Starting crawl of {self.base_url}")

        # Start with the main page
        start_urls = [
            f"{self.base_url}/intro/overview",
            f"{self.base_url}/ros2/fundamentals",
            f"{self.base_url}/simulation/gazebo-setup",
            f"{self.base_url}/aicontrol/isaac-sim-setup",
            f"{self.base_url}/hardware/workstation-spec"
        ]

        for url in start_urls:
            self._crawl_page(url)

        logger.info(f"Found {len(self.doc_urls)} documentation pages")
        return self.doc_urls

    def _crawl_page(self, url: str):
        """Crawl a single page and extract links"""
        if url in self.visited_urls:
            return

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            self.visited_urls.add(url)

            soup = BeautifulSoup(response.content, 'html.parser')

            # Check if this is a documentation page
            if self._is_doc_page(url, soup):
                self.doc_urls.append(url)
                logger.info(f"Found doc page: {url}")

            # Extract links
            links = soup.find_all('a', href=True)
            for link in links:
                href = link.get('href')
                if href:
                    full_url = urljoin(self.base_url, href)
                    # Only crawl internal links
                    if self._is_internal_link(full_url):
                        self._crawl_page(full_url)

        except Exception as e:
            logger.debug(f"Failed to crawl {url}: {e}")

    def _is_doc_page(self, url: str, soup: BeautifulSoup) -> bool:
        """Check if the page is a documentation page"""
        # URL pattern
        doc_patterns = [
            r'/intro/',
            r'/ros2/',
            r'/simulation/',
            r'/aicontrol/',
            r'/hardware/',
            r'/capstone/'
        ]

        for pattern in doc_patterns:
            if re.search(pattern, url):
                return True

        # Check for class names
        doc_classes = ['theme-doc-markdown', 'docItemContainer']
        for class_name in doc_classes:
            if soup.find(class_=class_name):
                return True

        return False

    def _is_internal_link(self, url: str) -> bool:
        """Check if the link is internal to the site"""
        parsed = urlparse(url)
        base_parsed = urlparse(self.base_url)

        # Same domain
        if parsed.netloc == base_parsed.netloc:
            # Exclude certain paths
            exclude_patterns = [
                '/signin',
                '/signup',
                '/author',
                '/assets/',
                '/static/',
                '.css',
                '.js',
                '.png',
                '.jpg',
                '.svg',
                '.ico',
                '#'
            ]

            for pattern in exclude_patterns:
                if pattern in url:
                    return False

            return True

        return False


async def main():
    """Main ingestion function"""
    parser = argparse.ArgumentParser(description="Crawl and ingest documentation")
    parser.add_argument(
        "--url",
        default=getattr(settings, 'docs_base_url', 'https://hackathon-physical-ai-humanoid-robo-five.vercel.app'),
        help="Base URL of the documentation site"
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
    parser.add_argument(
        "--max-pages",
        type=int,
        default=50,
        help="Maximum number of pages to ingest"
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
        except Exception as e:
            logger.info(f"Collection check: {e}")

        # Crawl the site to find all pages
        logger.info(f"Crawling site: {args.url}")
        crawler = SiteCrawler(args.url)
        urls = crawler.crawl()

        # Limit pages if specified
        if args.max_pages and len(urls) > args.max_pages:
            urls = urls[:args.max_pages]
            logger.info(f"Limited to {args.max_pages} pages")

        # Start ingestion
        stats = {
            "pages_processed": 0,
            "chunks_created": 0,
            "errors": [],
            "start_time": None,
            "end_time": None
        }

        logger.info(f"Starting ingestion of {len(urls)} pages...")

        for i, url in enumerate(urls, 1):
            logger.info(f"Processing page {i}/{len(urls)}: {url}")
            try:
                chunks = await ingestion_service._process_page(url)
                stats["pages_processed"] += 1
                stats["chunks_created"] += len(chunks)

                # Store chunks in Qdrant
                if chunks:
                    for chunk in chunks:
                        # Generate embedding
                        embedding = await ingestion_service.cohere_service.generate_embeddings(
                            [chunk.content],
                            input_type="search_document"
                        )

                        # Store in Qdrant
                        qdrant_service.upsert_point(
                            point_id=chunk.chunk_id,
                            vector=embedding[0],
                            payload={
                                "url": chunk.url,
                                "title": chunk.title,
                                "section_title": chunk.section_title,
                                "content": chunk.content,
                                "chapter": chunk.chapter,
                                "content_type": chunk.content_type,
                                "technical_level": chunk.technical_level,
                                "keywords": chunk.keywords,
                                "page_number": chunk.page_number,
                                "chunk_index": chunk.chunk_index,
                                "token_count": chunk.token_count
                            }
                        )

            except Exception as e:
                error_msg = f"Failed to process {url}: {e}"
                logger.error(error_msg)
                stats["errors"].append(error_msg)

        # Report results
        logger.info("\n=== Ingestion Complete ===")
        logger.info(f"Pages processed: {stats['pages_processed']}")
        logger.info(f"Chunks created: {stats['chunks_created']}")

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