# Quickstart Guide: Invoice Parsing from PDF Documents

## Overview
This guide provides a step-by-step introduction to using the invoice parsing feature. The feature enables users to upload PDF invoices and automatically extract key information using AI-powered technology.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Access to the DocuParser API

## Installation

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/docuparser.git
cd docuparser

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

## API Usage Examples

### 1. Upload an Invoice
```bash
curl -X POST https://api.docuparser.com/v1/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/invoice.pdf" \
  -F "retain=true"
```

### 2. Check Processing Status
```bash
curl -X GET https://api.docuparser.com/v1/results/UPLOAD_SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get Parsed Results
```bash
curl -X GET https://api.docuparser.com/v1/parse/UPLOAD_SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Frontend Integration

### React Component Example
```jsx
import React, { useState } from 'react';

const InvoiceUploader = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('retain', true);

    try {
      const response = await fetch('https://api.docuparser.com/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Invoice'}
        </button>
      </form>

      {result && (
        <div>
          <h3>Upload Successful!</h3>
          <p>Session ID: {result.id}</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceUploader;
```

## Configuration Options

### Environment Variables
```bash
# API Configuration
API_BASE_URL=https://api.docuparser.com/v1
API_TIMEOUT=30000

# Storage Configuration
STORAGE_TEMP_DIR=/tmp/docuparser
STORAGE_ENCRYPTION_KEY=your-encryption-key-here

# AI/ML Configuration
AI_MODEL_PATH=./models/invoice-parser
OCR_ENGINE=tesseract
```

## Error Handling

### Common Error Codes
- `400 Bad Request`: Invalid file format or parameters
- `401 Unauthorized`: Invalid or missing authentication token
- `413 Payload Too Large`: File exceeds 10MB limit
- `500 Internal Server Error`: Unexpected server error

### Retry Logic
For transient errors (5xx), implement exponential backoff:
1. First retry after 1 second
2. Second retry after 2 seconds
3. Third retry after 4 seconds
4. Maximum 3 retries

## Performance Tips

1. **File Optimization**: Compress PDF files before upload when possible
2. **Batch Processing**: Process multiple invoices in parallel when feasible
3. **Memory Management**: Monitor memory usage for large documents
4. **Caching**: Cache frequently accessed parsed results

## Troubleshooting

### Issue: File Upload Fails
**Solution**: Check file size (must be ≤ 10MB) and format (PDF only)

### Issue: Parsing Fails
**Solution**: Ensure the PDF is not password protected and has readable text

### Issue: Slow Processing
**Solution**: Verify network connectivity and consider upgrading to premium plan for better performance

## Support
For issues with the invoice parsing feature, contact support@docuparser.com or visit our documentation at https://docs.docuparser.com