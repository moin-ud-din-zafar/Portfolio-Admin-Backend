const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messagecontroller');

// List all messages
router.get('/', ctrl.getAll);

// Receive a new message
router.post('/', ctrl.create);

module.exports = router;