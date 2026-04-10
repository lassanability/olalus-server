const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/waiver');

router.get('/', ctrl.getSection);
router.put('/', requireAuth, requireRole('waiver'), ctrl.updateSection);

module.exports = router;
