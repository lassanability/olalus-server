const router = require('express').Router();
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/waiver');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateDashboard, ctrl.create);
router.put('/:id', validateDashboard, ctrl.update);
router.delete('/:id', validateDashboard, ctrl.remove);

module.exports = router;
