# Data Model: Invoice Parsing from PDF Documents

## Overview
This document defines the data models for the invoice parsing feature, including entities, their attributes, relationships, and validation rules.

## Entities

### 1. Invoice
Represents a parsed invoice document with extracted key information.

**Attributes**:
- `id` (string, primary key): Unique identifier for the invoice
- `userId` (string): Identifier of the user who uploaded the invoice
- `fileName` (string): Original name of the uploaded file
- `fileSize` (number): Size of the uploaded file in bytes
- `contentType` (string): MIME type of the uploaded file
- `originalPdfUrl` (string): URL/path to the original PDF file (encrypted storage)
- `status` (string): Processing status (pending, processing, completed, failed)
- `createdAt` (datetime): Timestamp when the invoice was created
- `processedAt` (datetime): Timestamp when processing was completed
- `confidenceScore` (number): Overall confidence score for the parsed data (0.0-1.0)
- `fields` (object[]): Array of parsed fields with confidence scores
- `errors` (string[]): Array of error messages if processing failed

**Validation Rules**:
- `id`: Required, UUID format
- `userId`: Required, string
- `fileName`: Required, string, max 255 characters
- `fileSize`: Required, positive number
- `contentType`: Required, valid MIME type
- `originalPdfUrl`: Required, valid URL format
- `status`: Required, one of: pending, processing, completed, failed
- `createdAt`: Required, datetime
- `processedAt`: Optional, datetime
- `confidenceScore`: Optional, number between 0.0 and 1.0
- `fields`: Required, array of Field objects
- `errors`: Optional, array of strings

### 2. Field
Represents an individual extracted field from the invoice.

**Attributes**:
- `id` (string, primary key): Unique identifier for the field
- `invoiceId` (string): Foreign key linking to the Invoice entity
- `fieldName` (string): Name of the field (vendor, invoiceNumber, date, amount)
- `value` (string): Extracted value from the invoice
- `confidenceScore` (number): Confidence score for this specific field (0.0-1.0)
- `position` (object): Position information (x, y coordinates) if available
- `extractedFrom` (string): Source of extraction (text, image, OCR)
- `createdAt` (datetime): Timestamp when the field was created

**Validation Rules**:
- `id`: Required, UUID format
- `invoiceId`: Required, string
- `fieldName`: Required, one of: vendor, invoiceNumber, date, amount
- `value`: Required, string
- `confidenceScore`: Optional, number between 0.0 and 1.0
- `position`: Optional, object with x,y coordinates
- `extractedFrom`: Optional, one of: text, image, OCR
- `createdAt`: Required, datetime

### 3. UploadSession
Represents a user's document upload session.

**Attributes**:
- `id` (string, primary key): Unique identifier for the session
- `userId` (string): Identifier of the user initiating the upload
- `sessionId` (string): Session identifier for tracking
- `fileId` (string): Reference to the uploaded file
- `status` (string): Session status (active, completed, expired)
- `expiresAt` (datetime): Expiration timestamp for the session
- `createdAt` (datetime): Timestamp when the session was created
- `updatedAt` (datetime): Timestamp when the session was last updated

**Validation Rules**:
- `id`: Required, UUID format
- `userId`: Required, string
- `sessionId`: Required, string
- `fileId`: Optional, string
- `status`: Required, one of: active, completed, expired
- `expiresAt`: Required, datetime
- `createdAt`: Required, datetime
- `updatedAt`: Required, datetime

## Relationships

1. **Invoice - Fields**: One-to-many relationship
   - One invoice can have multiple fields
   - Each field belongs to exactly one invoice

2. **Invoice - UploadSession**: Many-to-one relationship
   - Multiple upload sessions can relate to one invoice
   - Each invoice relates to one upload session

## State Transitions

### Invoice Status Flow:
- `pending` → `processing` → `completed` or `failed`
- `pending` → `failed` (immediate failure)

### UploadSession Status Flow:
- `active` → `completed` or `expired`

## Constraints

1. All timestamps must be in UTC
2. File sizes must be within limits (≤ 10MB)
3. Confidence scores must be between 0.0 and 1.0
4. Field names are restricted to predefined values
5. All sensitive data (PDF files, field values) must be encrypted at rest