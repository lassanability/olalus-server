const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/waiver');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireAuth, requireRole('waiver'), ctrl.create);
router.put('/:id', requireAuth, requireRole('waiver'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('waiver'), ctrl.remove);

module.exports = router;
