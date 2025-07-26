const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/blogcontroller');

// ——— Single endpoint for image + blog creation — accepts multipart/form-data
router.post('/', ctrl.createWithImage);

// ——— CRUD endpoints
router.get('/',      ctrl.getAll);    // fetch all blogs
router.get('/:id',   ctrl.getOne);    // fetch one by ID
router.put('/:id',   ctrl.update);    // update fields (JSON)
router.delete('/:id',ctrl.remove);    // delete by ID

module.exports = router;
