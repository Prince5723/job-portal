const express = require('express');
const { postJob } = require('../controllers/jobControllers');
const auth = require('../middleware/authMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/post-job', authMiddleware, postJob);

module.exports = router;