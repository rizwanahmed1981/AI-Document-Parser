# Quickstart: Document Upload API

## Overview
This guide explains how to upload documents using the Document Parser API. The API supports multiple document formats and provides secure, authenticated access to document ingestion.

## Prerequisites
- OAuth 2.0 client credentials (obtain from admin panel)
- A valid document file (PDF, DOCX, JPEG, PNG, TXT, HTML)
- File size ≤ 5MB

## Authentication
All API requests must include a valid OAuth 2.0 access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Upload Document
To upload a document, send a POST request to `/v1/documents` with the file in the `file` field:

### Example using cURL:
```bash
curl -X POST "https://api.documentparser.com/v1/documents" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "metadata[description]=Invoice from ACME Corp"
```

### Example using JavaScript (fetch):
```javascript
const formData = new FormData();
formData.append('file', document.getElementById('fileInput').files[0]);
formData.append('metadata[description]', 'Invoice from ACME Corp');

fetch('https://api.documentparser.com/v1/documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log('Document ID:', data.documentId));
```

## Response Format
Successful uploads return a JSON object with document information:

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

## Error Handling
The API returns standard HTTP status codes:
- 201: Document uploaded successfully
- 400: Invalid request format
- 401: Authentication required or invalid token
- 403: Insufficient permissions
- 413: File too large (>5MB)
- 415: Unsupported file type
- 429: Rate limit exceeded
- 500: Internal server error

## Get Document Status
To check the status of a document:

```
GET /v1/documents/{documentId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Rate Limits
- Maximum 10 requests per minute per IP address
- Exceeding rate limits results in 429 status code

## Supported File Types
- PDF (.pdf)
- Microsoft Word (.docx)
- JPEG (.jpeg, .jpg)
- PNG (.png)
- Plain Text (.txt)
- HTML (.html)