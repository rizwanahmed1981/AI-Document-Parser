import express from 'express';
import { ResultsController } from './results-controller';
import { authenticateToken } from '../../../middleware/auth';

const router = express.Router();

// Get processing results
router.get('/:id',
  authenticateToken,
  ResultsController.getResults
);

// Update corrected data
router.put('/:id/corrected-data',
  authenticateToken,
  ResultsController.updateCorrectedData
);

// Get audit trail
router.get('/:id/audit-trail',
  authenticateToken,
  ResultsController.getAuditTrail
);

export { router as resultsRouter };