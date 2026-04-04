const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/resource');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireAuth, requireRole('resources'), ctrl.create);
router.put('/:id', requireAuth, requireRole('resources'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('resources'), ctrl.remove);

module.exports = router;
