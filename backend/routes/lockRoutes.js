const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { lockRecord, unlockRecord, getLockStatus } = require('../controllers/lockController');

// POST /api/v1/:entity/:id/lock    — lock a record
// POST /api/v1/:entity/:id/unlock  — unlock a record
// GET  /api/v1/:entity/:id/lock-status — check lock status
router.post('/:entity/:id/lock',   protect, lockRecord);
router.post('/:entity/:id/unlock', protect, unlockRecord);
router.get('/:entity/:id/lock-status', protect, getLockStatus);

module.exports = router;
