import express from 'express';
import {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage,
} from '../controllers/packageController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getPackages);
router.get('/:id', getPackageById);
router.post('/', upload.any(), createPackage);
router.put('/:id', upload.any(), updatePackage);
router.delete('/:id', deletePackage);

export default router;