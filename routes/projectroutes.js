// src/routes/projectroutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/projectcontroller');

router.get(   '/',     ctrl.getAll);
router.post(  '/',     ctrl.create);   // now handles multipart & JSON
router.put(   '/:id',  ctrl.update);
router.delete('/:id',  ctrl.remove);

module.exports = router;
