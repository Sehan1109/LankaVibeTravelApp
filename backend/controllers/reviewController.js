import Review from '../models/Review.js';

// @desc    Create a new review
// @route   POST /api/packages/:id/reviews
export const createPackageReview = async (req, res) => {
    try {
        const { rating, comment, userName, userId } = req.body;

        const packageId = req.params.id;

        // 1. Create Review
        const review = new Review({
            packageId,
            user: userId,
            userName,
            rating: Number(rating),
            comment
        });

        await review.save();

        res.status(201).json({ message: 'Review added', review });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Error adding review' });
    }
};

// @desc    Create a general review (not tied to a package)
// @route   POST /api/reviews
export const createGeneralReview = async (req, res) => {
    try {
        const { rating, comment, userName, userId, packageId } = req.body;

        // If packageId is provided in body, use it, otherwise undefined
        const reviewData = {
            user: userId,
            userName,
            rating: Number(rating),
            comment
        };

        if (packageId) {
            reviewData.packageId = packageId;
        }

        const review = new Review(reviewData);
        await review.save();

        // If it has a packageId, populate it for immediate display
        if (packageId) {
            await review.populate('packageId', 'title');
        }

        res.status(201).json({ message: 'Review added', review });
    } catch (err) {
        console.error("Review Error:", err);
        res.status(400).json({ error: 'Error adding review' });
    }
};

// @desc    Get reviews for a package
// @route   GET /api/packages/:id/reviews
export const getPackageReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ packageId: req.params.id }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching reviews' });
    }
};

// @desc    Get ALL reviews (for Home Page)
// @route   GET /api/packages/reviews/all
export const getAllReviews = async (req, res) => {
    try {
        // Fetch all reviews, sort by newest first
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .populate('packageId', 'title image');

        res.json(reviews);
    } catch (err) {
        console.error('Fetch All Reviews Error:', err);
        res.status(500).json({ error: 'Error fetching all reviews' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Public (Protected in production)
export const deleteReview = async (req, res) => {
    try {
        const deletedReview = await Review.findByIdAndDelete(req.params.id);

        if (!deletedReview) {
            return res.status(404).json({ error: "Review not found" });
        }

        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Delete Review Error:", error);
        res.status(500).json({ error: "Server error while deleting review" });
    }
};