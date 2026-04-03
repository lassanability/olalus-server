const router = require('express').Router();
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/job');

router.get('/', ctrl.getAll);
router.get('/applications', validateDashboard, ctrl.getApplications);
router.get('/:id', ctrl.getById);
router.post('/', validateDashboard, ctrl.create);
router.post('/apply', ctrl.apply);
router.put('/:id', validateDashboard, ctrl.update);
router.delete('/:id', validateDashboard, ctrl.remove);

module.exports = router;
