const express = require('express');
const router = express.Router();
const { chatListen } = require('../handlers/chat');

router.get('/listen', chatListen);

module.exports = router;
