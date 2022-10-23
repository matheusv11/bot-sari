const express = require('express');
const router = express.Router();

// Controllers
const ticketController = require('./controllers/ticketController');

// Routes
router.get("/", (req, res) => res.send("<h2> Página Inicial </h2>"))

router.post("/agendar-ticket", ticketController.registerTicket)

module.exports = router;