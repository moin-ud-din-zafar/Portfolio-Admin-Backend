const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/blogcontroller');

router.post('/',    ctrl.createWithImage);
router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getOne);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
