import express from 'express';
import {
    createResource,
    getResources,
    updateResource,
    deleteResource
} from '../controllers/resourceController.js';

const router = express.Router();

// Route: /api/resources
router.route('/')
    .get(getResources)
    .post(createResource);

// Route: /api/resources/:id
router.route('/:id')
    .put(updateResource)
    .delete(deleteResource);

export default router;