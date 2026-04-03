const router = require('express').Router();
const multer = require('multer');
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/partner');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateDashboard, upload.single('logo'), ctrl.create);
router.put('/:id', validateDashboard, upload.single('logo'), ctrl.update);
router.delete('/:id', validateDashboard, ctrl.remove);

module.exports = router;
