# Document Parser API

A secure REST API for uploading and managing documents with AI-powered parsing capabilities.

## Features

- Secure document upload with OAuth 2.0 authentication
- Support for multiple document formats (PDF, DOCX, JPEG, PNG, TXT, HTML)
- File validation and integrity checking
- Rate limiting to prevent abuse
- Secure file storage with encryption
- Document status tracking

## API Endpoints

### Upload Document
```
POST /v1/documents
```

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Body:**
- `file`: Document file to upload

**Response:**
```json
{
  "documentId": "doc_abc123xyz",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "uploadTimestamp": "2026-01-22T10:00:00Z",
  "processingStatus": "uploaded"
}
```

### Get Document Status
```
GET /v1/documents/:documentId
```

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "documentId": "doc_abc123xyz",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "uploadTimestamp": "2026-01-22T10:00:00Z",
  "processingStatus": "processing",
  "userId": "user_123",
  "checksum": "a1b2c3d4e5f6..."
}
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations
5. Start the server: `npm run dev`

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=document_parser
JWT_SECRET=your-jwt-secret-here
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

## Security

- All API requests require OAuth 2.0 authentication
- Rate limiting (10 requests per minute per IP)
- File validation to prevent malicious uploads
- Secure temporary file storage with encryption
- Security headers for XSS and CSRF protection