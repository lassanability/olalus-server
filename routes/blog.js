const router = require('express').Router();
const multer = require('multer');
const { validateDashboard } = require('../middleware/auth');
const ctrl = require('../controllers/blog');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', ctrl.getAll);
router.get('/featured', ctrl.getFeatured);
router.get('/categories', ctrl.getCategories);
router.get('/tags', ctrl.getTags);
router.get('/author/:authorId', ctrl.getByAuthor);
router.get('/:id', ctrl.getById);
router.post('/', validateDashboard, upload.single('image'), ctrl.create);
router.put('/:id', validateDashboard, upload.single('image'), ctrl.update);
router.patch('/:id/featured', validateDashboard, ctrl.toggleFeatured);
router.delete('/:id', validateDashboard, ctrl.remove);

module.exports = router;
