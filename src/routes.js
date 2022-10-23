const express = require('express');
const router = express.Router();

// Controllers
const ticketController = require('./controllers/ticketController');

// Routes
router.post("/agendar-ticket", ticketController.registerTicket)

module.exports = router;