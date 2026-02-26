import SavedPlan from '../models/SavedPlan.js';
import DraftPlan from '../models/DraftPlan.js';
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
        const { id } = req.params;
        const deletedPlan = await SavedPlan.findByIdAndDelete(id);

        if (!deletedPlan) {
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

// --- ADMIN LIVE VIEW ---

// @desc    Auto-save draft while user is typing
// @route   POST /api/plans/auto-save
export const autoSaveDraft = async (req, res) => {
    try {
        // 1. Get sessionId, lastCompletedStep AND isGenerated from the request
        const { userId, guestId, inputData, sessionId, lastCompletedStep, isGenerated } = req.body; // <--- isGenerated මෙතනට ගත්තා

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID required" });
        }

        // 2. Filter the data based on what step the user just clicked "Next" on
        let filteredInputData = {};

        if (lastCompletedStep >= 1) {
            filteredInputData.arrivalDate = inputData.arrivalDate;
            filteredInputData.arrivalTime = inputData.arrivalTime;
            filteredInputData.departureDate = inputData.departureDate;
            filteredInputData.departureTime = inputData.departureTime;
            filteredInputData.startPoint = inputData.startPoint;
            filteredInputData.endPoint = inputData.endPoint;
        }

        if (lastCompletedStep >= 2) {
            filteredInputData.budget = inputData.budget;
            filteredInputData.adults = inputData.adults;
            filteredInputData.children = inputData.children;
            filteredInputData.vehicleType = inputData.vehicleType;
            filteredInputData.includeGuide = inputData.includeGuide;
        }

        if (lastCompletedStep >= 3) {
            filteredInputData.hotelRating = inputData.hotelRating;
            filteredInputData.interests = inputData.interests;
            filteredInputData.nextDestinations = inputData.nextDestinations;
        }

        if (lastCompletedStep >= 4) {
            filteredInputData.userNotes = inputData.userNotes;
        }

        if (!lastCompletedStep) {
            filteredInputData = inputData;
        }

        // --- අලුත් වෙනස: Database එකට යවන්න ඕන Data ටික වෙනම හදාගන්නවා ---
        const updateFields = {
            userId,
            guestId,
            inputData: filteredInputData,
            lastCompletedStep,
            lastUpdated: new Date()
        };

        // Frontend එකෙන් isGenerated: true කියලා ඇවිත් නම්, ඒකත් updateFields වලට දානවා
        if (isGenerated !== undefined) {
            updateFields.isGenerated = isGenerated;
        }

        // 3. Update or Insert (Upsert)
        const updatedDraft = await DraftPlan.findOneAndUpdate(
            { sessionId: sessionId },
            { $set: updateFields }, // <--- updateFields ඔබ්ජෙක්ට් එක මෙතනට දෙනවා
            {
                new: true,
                upsert: true
            }
        );

        res.json({ message: 'Draft auto-saved/updated successfully', id: updatedDraft._id });
    } catch (error) {
        console.error('Auto-Save Error:', error);
        res.status(500).json({ error: 'Failed to auto-save' });
    }
};

// @desc    Get all active drafts for Admin
// @route   GET /api/plans/drafts
export const getAllDrafts = async (req, res) => {
    try {
        // අලුත්ම ඒවා මුලින් එන විදියට Sort කරන්න
        const drafts = await DraftPlan.find({})
            .sort({ lastUpdated: -1 })
            .limit(50);

        res.json(drafts);
    } catch (error) {
        console.error('Fetch Drafts Error:', error);
        res.status(500).json({ error: 'Failed to fetch drafts' });
    }
};

// @desc    Get dashboard statistics for charts (Updated for Unique Users & isGenerated flag)
// @route   GET /api/plans/stats
export const getDashboardStats = async (req, res) => {
    try {
        // 1. ප්ලෑන් කීයක් හැදිලා තියෙනවද (Documents count)
        const savedPlansCount = await SavedPlan.countDocuments();

        // අලුත් වෙනස: Generate කරපු ඒවා සහ තාම හදන ගමන් (Drafts) තියෙන ඒවා වෙන වෙනම ගණන් කිරීම
        const generatedPlansCount = await DraftPlan.countDocuments({ isGenerated: true });
        const draftsCount = await DraftPlan.countDocuments({ isGenerated: { $ne: true } });

        // 2. අද්විතීය පරිශීලකයින් ගණනය කිරීම (Calculate Unique Visitors)
        // Database එකෙන් Duplicate නැතිව (distinct) userId සහ guestId අරගන්නවා
        const uniqueDraftUsers = await DraftPlan.distinct("userId", { userId: { $ne: null } });
        const uniqueDraftGuests = await DraftPlan.distinct("guestId", { guestId: { $ne: null } });

        // SavedPlans වල ඉන්න අයත් ගන්නවා (සාමාන්‍යයෙන් SavedPlans වල ඉන්නේ ලොග් වුන අය විතරයි)
        const uniqueSavedUsers = await SavedPlan.distinct("userId", { userId: { $ne: null } });

        // JavaScript 'Set' එකක් භාවිතා කරලා, මේ ඔක්කොම එකට එකතු කරලා ඉන් duplicate වෙන අයව අයින් කරනවා
        const allUniqueUsers = new Set([
            ...uniqueDraftUsers.map(id => id.toString()),
            ...uniqueSavedUsers.map(id => id.toString()),
            ...uniqueDraftGuests.map(id => id.toString())
        ]);

        const totalUniqueVisitors = allUniqueUsers.size; // ඇත්තටම ආපු මුළු Unique Users ලා ගණන

        // 3. Conversion Rate ගණනය කිරීම 
        // ප්ලෑන් එකක් save කරපු අද්විතීය යූසර්ස්ලා ගණන / මුළු අද්විතීය යූසර්ස්ලා ගණන
        const uniqueConvertedUsers = new Set(uniqueSavedUsers.map(id => id.toString())).size;
        const conversionRate = totalUniqueVisitors > 0
            ? Math.round((uniqueConvertedUsers / totalUniqueVisitors) * 100)
            : 0;

        // 4. මාසික අද්විතීය පරිශීලකයින් (Monthly Unique Visitors)
        const currentYear = new Date().getFullYear();
        const monthlyActivity = await DraftPlan.aggregate([
            {
                $match: {
                    lastUpdated: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$lastUpdated" },
                    // මේ මාසය ඇතුලත ආපු අයගේ userId එක හෝ guestId එක Set එකකට දානවා. 
                    // $addToSet නිසා එකම කෙනා ආයෙත් ආවොත් දෙපාරක් එකතු වෙන්නේ නෑ (Unique).
                    uniqueIdentities: { $addToSet: { $ifNull: ["$userId", "$guestId"] } }
                }
            },
            {
                $project: {
                    // ඒ මාසෙට අදාල unique අය කීදෙනෙක් හිටියද කියලා ගණන් කරනවා
                    visitors: { $size: "$uniqueIdentities" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // මාස 12ට අදාලව Bar Chart එකට දත්ත හැඩගැන්වීම
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const visitorAnalyticsData = monthNames.map((month, index) => {
            const monthData = monthlyActivity.find(item => item._id === index + 1);
            return {
                name: month,
                visitors: monthData ? monthData.visitors : 0
            };
        });

        // අලුත් වෙනස: savedPlansCount වෙනුවට generatedPlansCount භාවිතා කිරීම
        const planStatsData = [
            { name: 'Generated Plans', value: generatedPlansCount, color: '#059669' },
            { name: 'Drafts (Not Generated)', value: draftsCount, color: '#eab308' },
        ];

        // Frontend එකට දත්ත යැවීම
        res.json({
            planStatsData,
            visitorAnalyticsData,
            summary: {
                totalVisitors: totalUniqueVisitors,
                savedPlansCount,
                generatedPlansCount, // අලුතින් Frontend එකට යවන දත්තය
                draftsCount,
                conversionRate
            }
        });

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};