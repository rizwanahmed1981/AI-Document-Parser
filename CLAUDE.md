# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Document Parser Project

This is a smart document parsing system that extracts structured data from various document formats (PDFs, emails, images, spreadsheets, HTML, text files) using AI and OCR technology. Inspired by Parseur, it automates the tedious work of manual data entry by intelligently extracting key information from documents.

## Project Architecture

The document parser follows a modular architecture with three main extraction engines:

1. **AI Engine** - Self-learning system that infers fields from examples
2. **OCR Engine** - Handles scanned documents and images with dynamic OCR capabilities
3. **Text Parsing Engine** - Rule-based extraction for structured emails and HTML

The system has three main layers:
- **Input Layer**: Handles document ingestion via email, API, manual upload, or integrations
- **Processing Layer**: Applies appropriate extraction engine based on document type
- **Output Layer**: Exports structured data to CSV, Google Sheets, APIs, or integrated systems

## Development Commands

### Setup
```bash
npm install  # Install dependencies
```

### Building
```bash
npm run build  # Build the project
npm run dev    # Run in development mode
```

### Testing
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Running Individual Tests
```bash
npm test -- <test-file-path>  # Run a specific test file
npm test -- --grep=<pattern>  # Run tests matching a pattern
```

### Linting
```bash
npm run lint           # Check code for linting errors
npm run lint:fix       # Automatically fix linting issues
npm run format         # Format code according to project standards
```

### Other Common Commands
```bash
npm run start          # Start the application in production mode
npm run serve          # Serve the application locally
npm run clean          # Clean build artifacts
npm run docs           # Generate documentation
```

## High-Level Architecture

### Core Components

1. **Document Ingestion Module** - Handles various input sources (email, API, file uploads, integrations)
2. **Document Type Classifier** - Determines the appropriate parsing engine based on document characteristics
3. **Extraction Engines** - Three specialized engines for different document types:
   - AI Engine: Machine learning-based field inference
   - OCR Engine: Optical character recognition for images/scanned docs
   - Text Parser: Rule-based extraction for structured text
4. **Data Transformation Layer** - Normalizes extracted data into consistent formats
5. **Output Adapters** - Connectors for various export destinations (CSV, API, Google Sheets, etc.)

### File Structure
```
src/
├── ingestion/          # Document input handling
├── classification/     # Document type detection
├── extraction/         # AI, OCR, and text parsing engines
├── transformation/     # Data normalization
├── output/            # Export adapters
├── models/            # Data models and schemas
├── utils/             # Helper functions
└── types/             # TypeScript definitions
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── fixtures/          # Test documents and data
```

### Key Technologies
- TypeScript for type safety
- AI/ML libraries for intelligent extraction
- OCR libraries for image processing
- Stream processing for large documents
- Modular plugin architecture for extensibility

### Development Workflow
1. Add new document parsing features in the appropriate extraction module
2. Write unit tests for new functionality
3. Add integration tests covering end-to-end document processing
4. Update documentation as needed
5. Follow the existing code patterns and style guides

### Testing Strategy
- Unit tests for individual functions and classes
- Integration tests for end-to-end document processing workflows
- Performance tests for large document handling
- Accuracy tests for extraction quality validation

## Active Technologies
- TypeScript 5.0+ (001-invoice-parse)
- Temporary file storage with encryption at rest, PostgreSQL for structured data persistence (001-invoice-parse)
- TypeScript 5.0+ (based on CLAUDE.md) + Express.js for REST API, Multer for file uploads, Passport.js for OAuth 2.0 authentication, PostgreSQL for data persistence, temporary file storage with encryption at rest (001-document-upload)
- PostgreSQL for structured data persistence, temporary file storage for uploaded documents (001-document-upload)

## Recent Changes
- 001-invoice-parse: Added TypeScript 5.0+
