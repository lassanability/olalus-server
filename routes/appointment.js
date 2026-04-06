const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/appointment');

router.post('/', ctrl.submit);
router.get('/', requireAuth, requireRole('appointments'), ctrl.getAll);
router.patch('/:id/status', requireAuth, requireRole('appointments'), ctrl.updateStatus);
router.patch('/:id/read', requireAuth, requireRole('appointments'), ctrl.markRead);
router.delete('/:id', requireAuth, requireRole('appointments'), ctrl.remove);

module.exports = router;
