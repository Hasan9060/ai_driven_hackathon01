---
ID: 001
TITLE: Docusaurus Content Extraction Research
STAGE: general
DATE_ISO: 2025-01-17
SURFACE: agent
MODEL: claude-opus-4-5-20251101
FEATURE: none
BRANCH: 007-rag-chatbot
USER: user
COMMAND: Research how to extract content from a Docusaurus site deployed on Vercel at https://hackathon-physical-ai-humanoid-robo-five.vercel.app/.

I need to understand:
1. How content is structured in Docusaurus (markdown files, static content)
2. Best practices for extracting text content from Docusaurus sites
3. How to preserve chapter/section metadata during extraction
4. What HTML structure to expect for content parsing
5. Whether to use sitemap.xml, direct page scraping, or API access

Focus on practical implementation strategies for ingesting the content for RAG processing.
LABELS: ["docusaurus", "content-extraction", "rag", "vercel", "web-scraping"]
LINKS:
  SPEC: null
  TICKET: null
  ADR: null
  PR: null
FILES_YAML:
  - /mnt/d/Hackathon/humanoid-robotics-textbook/backend/docusaurus-content-extraction-guide.md
TESTS_YAML:
  -
PROMPT_TEXT: |
  Research how to extract content from a Docusaurus site deployed on Vercel at https://hackathon-physical-ai-humanoid-robo-five.vercel.app/.

  I need to understand:
  1. How content is structured in Docusaurus (markdown files, static content)
  2. Best practices for extracting text content from Docusaurus sites
  3. How to preserve chapter/section metadata during extraction
  4. What HTML structure to expect for content parsing
  5. Whether to use sitemap.xml, direct page scraping, or API access

  Focus on practical implementation strategies for ingesting the content for RAG processing.
RESPONSE_TEXT: |
  Created comprehensive guide covering:
  - Docusaurus content structure (source and built)
  - Three extraction strategies: sitemap-based (recommended), direct scraping, API access
  - Metadata preservation techniques for hierarchy and content info
  - Expected HTML structure with specific selectors
  - Complete pipeline implementation with code examples
  - Best practices including rate limiting, error handling, and content validation

  Provided a multi-strategy approach starting with sitemap.xml for reliable discovery, with structured extraction preserving heading hierarchy and metadata essential for RAG processing.
OUTCOME: Successfully created a comprehensive implementation guide for extracting Docusaurus content with practical code examples and best practices.
EVALUATION: The research covered all requested aspects and provided actionable implementation strategies for RAG content ingestion.
---

# Prompt History Record

## Request
Research how to extract content from a Docusaurus site deployed on Vercel at https://hackathon-physical-ai-humanoid-robo-five.vercel.app/.

I need to understand:
1. How content is structured in Docusaurus (markdown files, static content)
2. Best practices for extracting text content from Docusaurus sites
3. How to preserve chapter/section metadata during extraction
4. What HTML structure to expect for content parsing
5. Whether to use sitemap.xml, direct page scraping, or API access

Focus on practical implementation strategies for ingesting the content for RAG processing.

## Response Summary
Created a comprehensive implementation guide at `/mnt/d/Hackathon/humanoid-robotics-textbook/backend/docusaurus-content-extraction-guide.md` covering:

1. **Docusaurus Structure**: Detailed organization of source files (docs/, static/, sidebars.js) and built site structure
2. **Extraction Strategies**:
   - Sitemap-based approach (recommended) for systematic discovery
   - Direct page scraping with BeautifulSoup for rendered content
   - API-based extraction checks for JSON endpoints
3. **Metadata Preservation**: Complete methods for extracting chapter hierarchy, breadcrumbs, TOC, and content metadata
4. **HTML Structure**: Specific CSS selectors and DOM structure for Docusaurus v3+
5. **Implementation**: Complete Python pipeline with multi-strategy approach, content chunking, and RAG preparation

## Key Technical Details
- Primary selectors: `.theme-doc-sidebar-container`, `article.markdown`, `.tableOfContents`
- Sitemap location: `/sitemap.xml`
- Content chunking strategies: page-level, section-level, and sub-chunk for long content
- Rate limiting implementation to respect Vercel hosting
- Error handling with retry logic using tenacity library

## Recommendations
1. Start with sitemap.xml for reliable page discovery
2. Use structured extraction preserving heading hierarchy
3. Implement respectful crawling with delays
4. Validate content before RAG ingestion
5. Monitor extraction process for failures