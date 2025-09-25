const express = require('express');
const router = express.Router();
const { getPointsTable } = require('../controllers/pointsTableController');

// GET /api/points-table/:seasonId
router.get('/:seasonId', getPointsTable);

module.exports = router;
