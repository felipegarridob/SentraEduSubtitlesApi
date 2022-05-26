const express = require('express');
const router = express.Router();

router.use('/subtitles', require('./subtitles.routes'));

module.exports = router;