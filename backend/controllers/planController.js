import SavedPlan from '../models/SavedPlan.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Save a generated itinerary
// @route   POST /api/plans/save
// @access  Public (Protected in production)
export const savePlan = async (req, res) => {
    try {
        const { userId, name, inputData, itineraryData } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User Login Required" });
        }

        const newPlan = new SavedPlan({
            userId: userId,
            name: name,
            inputData,
            itineraryData,
            shareId: uuidv4() // Generate unique share ID
        });

        await newPlan.save();

        res.status(201).json({
            message: 'Plan saved successfully',
            shareId: newPlan.shareId
        });
    } catch (error) {
        console.error('Save Plan Error:', error);
        res.status(500).json({ error: 'Failed to save plan' });
    }
};

// @desc Delete a saved plan
// @route DELETE /api/plans/:id
export const deletePlan = async (req, res) => {
    try {
        if (!deletePlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
};

// @desc    Get all plans for a specific user
// @route   GET /api/plans/user/:userId
// @access  Public
export const getUserPlans = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find plans matching the userId, sorted by newest first
        const plans = await SavedPlan.find({ userId }).sort({ createdAt: -1 });

        res.json(plans);
    } catch (error) {
        console.error('Get User Plans Error:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

// @desc    Get a single plan by Share ID
// @route   GET /api/plans/:shareId
// @access  Public
export const getPlanByShareId = async (req, res) => {
    try {
        const plan = await SavedPlan.findOne({ shareId: req.params.shareId });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Fetch Plan Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};