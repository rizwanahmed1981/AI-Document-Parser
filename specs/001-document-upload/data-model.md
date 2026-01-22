# Data Model: Document Upload API

## Entity: Document
**Description**: Represents an uploaded document with metadata and processing information

**Fields**:
- id: string (UUID) - Unique identifier for the document
- fileName: string - Original name of the uploaded file
- fileType: string - MIME type of the document (e.g., application/pdf, image/jpeg)
- fileSize: number - Size of the file in bytes
- uploadTimestamp: Date - Time when the document was uploaded
- documentId: string - Unique identifier for tracking in the system
- processingStatus: string - Current status (e.g., 'uploaded', 'processing', 'processed', 'failed')
- userId: string (optional) - ID of the user who uploaded the document (for multi-tenant support)
- filePath: string - Path to the stored file in the system
- checksum: string - SHA-256 hash for file integrity validation

**Relationships**:
- One UploadSession can be associated with one Document (on successful upload)
- One User can have many Documents (many-to-one relationship)

## Entity: UploadSession
**Description**: Tracks the state of an ongoing upload session

**Fields**:
- sessionId: string (UUID) - Unique identifier for the session
- userId: string (optional) - ID of the user associated with the upload
- uploadStart: Date - Time when the upload started
- uploadEnd: Date (nullable) - Time when the upload completed
- status: string - Current status ('uploading', 'completed', 'failed')
- originalFileName: string - Original name of the file being uploaded
- tempFilePath: string - Path to temporary storage location
- fileSize: number - Size of the file in bytes
- error: string (nullable) - Error message if upload failed

**Relationships**:
- One UploadSession can result in one Document (one-to-one relationship, optional until completion)

## Entity: APIRequest
**Description**: Contains authentication credentials and metadata for API requests

**Fields**:
- requestId: string (UUID) - Unique identifier for the request
- timestamp: Date - Time when the request was made
- userId: string (optional) - ID of the user making the request
- clientId: string - ID of the client application (for OAuth)
- ipAddress: string - IP address of the requesting client
- userAgent: string (nullable) - User agent string from the request
- documentId: string (nullable) - ID of the document associated with the request
- endpoint: string - API endpoint that was accessed

## Validation Rules
- Document.fileName: Required, max 255 characters
- Document.fileType: Must be one of the supported types (application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png, text/plain, text/html)
- Document.fileSize: Must be ≤ 5,242,880 bytes (5MB)
- Document.processingStatus: Must be one of ['uploaded', 'processing', 'processed', 'failed']
- UploadSession.status: Must be one of ['uploading', 'completed', 'failed']

## State Transitions
- UploadSession: 'uploading' → 'completed' or 'failed'
- Document: 'uploaded' → 'processing' → 'processed' or 'failed'