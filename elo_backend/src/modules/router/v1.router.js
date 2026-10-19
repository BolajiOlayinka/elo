const router = require('express').Router();
const authRouter = require('../auth/auth.routes');
const { publicAnalysisRouter, adminAnalysisRouter } = require('../analysis/analysis.routes');
const uploadRouter = require('../uploads/upload.routes');

router.use('/auth', authRouter);
router.use('/analysis', publicAnalysisRouter);
router.use('/admin/analysis', adminAnalysisRouter);
router.use('/uploads', uploadRouter);

module.exports = router;
