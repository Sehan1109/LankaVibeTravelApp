import express from 'express'
import {
    createPackageReview,
    getPackageReviews,
    getAllReviews,
    createGeneralReview,
    deleteReview
} from '../controllers/reviewController.js'

const router = express.Router();

router.route('/:id/reviews')
    .post(createPackageReview)
    .get(getPackageReviews);
router.post('/', createGeneralReview);
router.get('/all', getAllReviews);
router.delete('/:id', deleteReview);

export default router;