const express = require('express');
const { syncExternalHackathons } = require('../services/externalHackathons');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Manually trigger external hackathon sync
// @route   POST /api/sync/hackathons
// @access  Private
router.post('/hackathons', protect, async (req, res) => {
  const result = await syncExternalHackathons();
  res.status(200).json({
    success: true,
    message: `Synced ${result.upserted} hackathons from external platforms`,
    ...result,
  });
});

// @desc    Get sync status / last sync info
// @route   GET /api/sync/status
// @access  Public
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    sources: ['devfolio', 'hackerearth', 'unstop', 'mlh'],
    autoSyncInterval: '6 hours',
    message: 'Use POST /api/sync/hackathons to trigger manual sync',
  });
});

module.exports = router;
