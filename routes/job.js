const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/job');

router.get('/', ctrl.getAll);
router.get('/applications', requireAuth, requireRole('jobs'), ctrl.getApplications);
router.get('/:id', ctrl.getById);
router.post('/', requireAuth, requireRole('jobs'), ctrl.create);
router.post('/apply', ctrl.apply);
router.put('/:id', requireAuth, requireRole('jobs'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('jobs'), ctrl.remove);

module.exports = router;
