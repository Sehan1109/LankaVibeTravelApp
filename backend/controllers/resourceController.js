import Resource from '../models/Resource.js';

// @desc    Create a new resource (Hotel, Driver, etc.)
// @route   POST /api/resources
// @access  Public (Protected in production)
export const createResource = async (req, res) => {
    try {
        const resource = new Resource(req.body);
        await resource.save();
        res.status(201).json(resource);
    } catch (error) {
        console.error('Create Resource Error:', error);
        res.status(400).json({ error: 'Error adding resource' });
    }
};

// @desc    Get all resources with optional filtering
// @route   GET /api/resources?location=...&type=...
// @access  Public
export const getResources = async (req, res) => {
    try {
        const { location, type } = req.query;
        let query = {};

        // Search by location (case-insensitive regex)
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by type (exact match)
        if (type) {
            query.type = type;
        }

        const resources = await Resource.find(query);
        res.json(resources);
    } catch (error) {
        console.error('Fetch Resources Error:', error);
        res.status(500).json({ error: 'Error fetching resources' });
    }
};

// @desc    Update a resource
// @route   PUT /api/resources/:id
// @access  Public (Protected in production)
export const updateResource = async (req, res) => {
    try {
        const updated = await Resource.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Return the updated document
        );

        if (!updated) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update Resource Error:', error);
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Public (Protected in production)
export const deleteResource = async (req, res) => {
    try {
        const deleted = await Resource.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete Resource Error:', error);
        res.status(500).json({ error: error.message });
    }
};