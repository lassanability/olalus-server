const router = require('express').Router();
const multer = require('multer');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/resource');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', ctrl.getAll);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id', ctrl.getById);
router.post('/', requireAuth, requireRole('resources'), upload.single('pdf'), ctrl.create);
router.put('/:id', requireAuth, requireRole('resources'), upload.single('pdf'), ctrl.update);
router.delete('/:id', requireAuth, requireRole('resources'), ctrl.remove);

module.exports = router;
