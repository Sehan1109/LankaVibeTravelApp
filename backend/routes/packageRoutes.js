import express from 'express';
import multer from 'multer';

import {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage,
} from '../controllers/packageController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const anyUpload = upload.any();

router.get('/', getPackages);
router.get('/:id', getPackageById);
router.post('/', anyUpload, createPackage);
router.put('/:id', anyUpload, updatePackage);
router.delete('/:id', deletePackage);

export default router;