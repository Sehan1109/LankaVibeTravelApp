import express from 'express';
import {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage,
} from '../controllers/packageController.js';

const router = express.Router();

router.get('/', getPackages);
router.get('/:id', getPackageById);
router.post('/', createPackage);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router;