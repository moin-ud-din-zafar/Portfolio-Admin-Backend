const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/projectcontroller');

router.post('/',    ctrl.create);
router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
