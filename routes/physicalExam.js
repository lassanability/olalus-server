const router = require('express').Router();
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/physicalExam');

router.post('/', ctrl.submit);
router.get('/', validateDashboard, ctrl.getAll);
router.patch('/:id/read', validateDashboard, ctrl.markRead);

module.exports = router;
