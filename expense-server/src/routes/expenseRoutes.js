const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const express = require('express');
const router = express.Router();


router.use(authMiddleware.protect);

router.post('/create', authorizeMiddleware('expense:create'), expenseController.create);
router.put('/update', authorizeMiddleware('expense:update'), expenseController.update);
router.get('/group/:groupId', authorizeMiddleware('expense:view'), expenseController.getByGroupId);
router.get('/summary/:groupId', authorizeMiddleware('expense:view'), expenseController.getSummary);
router.post('/settle', authorizeMiddleware('expense:update'), expenseController.settleGroup);
router.get('/:expenseId', authorizeMiddleware('expense:view'), expenseController.getByExpenseId);
router.delete('/:expenseId', authorizeMiddleware('expense:delete'), expenseController.delete);
router.patch('/split/update', authorizeMiddleware('expense:update'), expenseController.updateSplitAmount);
router.patch('/split/add', authorizeMiddleware('expense:update'), expenseController.addSplitUser);

module.exports = router;

