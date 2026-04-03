const router = require('express').Router();
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/contact');

router.post('/', ctrl.submit);
router.get('/', validateDashboard, ctrl.getAll);
router.patch('/:id/read', validateDashboard, ctrl.markRead);
router.delete('/:id', validateDashboard, ctrl.remove);

module.exports = router;
