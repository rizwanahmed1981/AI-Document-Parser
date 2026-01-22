# Document Parser Backend

This is the backend service for the Document Parser application, responsible for handling document uploads and processing.

## Features

- Secure document upload with OAuth 2.0 authentication
- Support for multiple document formats (PDF, DOCX, JPEG, PNG, TXT, HTML)
- File validation and size limits (5MB max)
- Rate limiting to prevent abuse
- Document status tracking

## Project Structure

```
src/
├── ingestion/          # Document input handling
│   ├── api/            # API controllers
│   ├── middleware/     # Authentication and validation middleware
│   └── types/          # Type definitions
├── models/             # Data models
├── services/           # Business logic
├── utils/              # Helper functions
└── types/              # TypeScript definitions
```

## API Endpoints

### Document Upload
```
POST /api/v1/documents
```

**Headers:**
- `Authorization: Bearer <access_token>`

**Body (multipart/form-data):**
- `file`: Document file to upload
- `metadata[description]`: Optional document description

**Response (201 Created):**
```json
{
  "documentId": "uuid-string",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "uploadTimestamp": "2026-01-22T10:30:00Z",
  "processingStatus": "uploaded"
}
```

### Get Document Status
```
GET /api/v1/documents/:documentId
```

**Headers:**
- `Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "documentId": "uuid-string",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "uploadTimestamp": "2026-01-22T10:30:00Z",
  "processingStatus": "uploaded"
}
```

## Development

### Setup
```bash
npm install
```

### Run in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Run tests
```bash
npm test
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
JWT_SECRET=your-jwt-secret-here
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_AUTHORIZATION_URL=https://your-oauth-provider.com/oauth/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth/token
OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

## Security

- All API endpoints require authentication
- File uploads are validated for type and size
- Rate limiting prevents abuse (10 requests/minute/IP)
- Secure temporary file storage
- OAuth 2.0 for secure authentication