import Package from '../models/Package.js';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const extractPathFromUrl = (url) => {
    if (!url) return null;
    try {
        const decodedUrl = decodeURIComponent(url);

        const parts = decodedUrl.split('/package-images/');

        if (parts.length > 1) {
            return parts[1];
        } else {
            console.warn('Invalid Supabase URL format:', url);
            return null;
        }
    } catch (error) {
        console.error('Error parsing URL:', url);
        return null;
    }
};

const uploadToSupabase = async (file, folder = 'packages') => {
    try {
        const fileName = `${folder}/${Date.now()}_${file.originalname.replace(/\s+/g, '-')}`;

        const { data, error } = await supabase.storage
            .from('package-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('package-images')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error("Supabase Upload Error:", err);
        throw new Error("Image upload failed");
    }
};

// @desc    Create a new package with images
// @route   POST /api/packages
// @access  Public (Protected in production)
export const createPackage = async (req, res) => {
    try {
        const data = JSON.parse(req.body.data);
        const files = req.files; // Multer array

        if (!files || files.length === 0) {
            console.log("No files uploaded, proceeding with text data only.");
        }

        // 1. Handle Main Image
        const mainImg = files.find(f => f.fieldname === 'mainImage');
        if (mainImg) {
            data.image = await uploadToSupabase(mainImg, 'covers');
        }

        // 2. Handle Gallery Images
        const galleryFiles = files.filter(f => f.fieldname === 'gallery');
        if (galleryFiles.length > 0) {
            const uploadPromises = galleryFiles.map(file => uploadToSupabase(file, 'gallery'));
            data.gallery = await Promise.all(uploadPromises);
        }

        // 3. Handle Manual/PDF
        const manualFile = files.find(f => f.fieldname === 'manual');
        if (manualFile) {
            data.manualUrl = await uploadToSupabase(manualFile, 'manuals');
        }

        // 4. Handle Itinerary Day Images
        const itineraryFiles = files.filter(f => f.fieldname.startsWith('itineraryImages'));

        if (itineraryFiles.length > 0) {
            const itineraryUploadPromises = itineraryFiles.map(async (file) => {
                const match = file.fieldname.match(/\[(\d+)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const url = await uploadToSupabase(file, 'itinerary');

                    if (data.itinerary && data.itinerary[index]) {
                        data.itinerary[index].image = url;
                    }
                }
            });
            await Promise.all(itineraryUploadPromises);
        }

        // 5. Save to MongoDB
        const newPackage = new Package(data);
        await newPackage.save();

        res.status(201).json(newPackage);

    } catch (error) {
        console.error('Create Package Error:', error);
        res.status(500).json({ error: error.message || 'Error creating package' });
    }
};

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public
export const getPackages = async (req, res) => {
    try {
        const packages = await Package.find();
        res.json(packages);
    } catch (err) {
        console.error('Fetch Packages Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get single package by ID
// @route   GET /api/packages/:id
// @access  Public
export const getPackageById = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({ error: 'Package not found' });
        }
        res.json(pkg);
    } catch (err) {
        console.error('Fetch Single Package Error:', err);
        res.status(500).json({ error: 'Invalid ID format or Server Error' });
    }
};

// @desc    Update a package
// @route   PUT /api/packages/:id
// @access  Public (Protected in production)
export const updatePackage = async (req, res) => {
    try {
        const { id } = req.params;

        const oldPackage = await Package.findById(id);
        if (!oldPackage) {
            return res.status(404).json({ error: 'Package not found' });
        }

        let data = JSON.parse(req.body.data);
        const files = req.files;

        let filesToDelete = [];

        // --- A. Main Image Update ---
        const mainImg = files.find(f => f.fieldname === 'mainImage');
        if (mainImg) {
            if (oldPackage.image) {
                filesToDelete.push(extractPathFromUrl(oldPackage.image));
            }
            data.image = await uploadToSupabase(mainImg, 'covers');
        }

        // --- B. Manual PDF Update ---
        const manualFile = files.find(f => f.fieldname === 'manual');
        if (manualFile) {
            if (oldPackage.manualUrl) {
                filesToDelete.push(extractPathFromUrl(oldPackage.manualUrl));
            }
            data.manualUrl = await uploadToSupabase(manualFile, 'manuals');
        }

        // --- C. Gallery Update ---
        const galleryFiles = files.filter(f => f.fieldname === 'gallery');
        if (galleryFiles.length > 0) {
            if (oldPackage.gallery && oldPackage.gallery.length > 0) {
                oldPackage.gallery.forEach(url => {
                    filesToDelete.push(extractPathFromUrl(url));
                });
            }
            const uploadPromises = galleryFiles.map(file => uploadToSupabase(file, 'gallery'));
            data.gallery = await Promise.all(uploadPromises);
        }

        // --- D. Itinerary Images Update ---
        const itineraryFiles = files.filter(f => f.fieldname.startsWith('itineraryImages'));
        if (itineraryFiles.length > 0) {
            if (!data.itinerary) {
                data.itinerary = [...oldPackage.itinerary];
            }

            const itineraryUploadPromises = itineraryFiles.map(async (file) => {
                const match = file.fieldname.match(/\[(\d+)\]/);
                if (match) {
                    const index = parseInt(match[1]);

                    if (oldPackage.itinerary[index] && oldPackage.itinerary[index].image) {
                        filesToDelete.push(extractPathFromUrl(oldPackage.itinerary[index].image));
                    }

                    const url = await uploadToSupabase(file, 'itinerary');

                    if (data.itinerary[index]) {
                        data.itinerary[index].image = url;
                    }
                }
            });
            await Promise.all(itineraryUploadPromises);
        }

        filesToDelete = filesToDelete.filter(path => path !== null);

        if (filesToDelete.length > 0) {
            const { error } = await supabase.storage
                .from('package-images')
                .remove(filesToDelete);

            if (error) {
                console.error("Error deleting old images:", error);
            } else {
                console.log("Deleted old images:", filesToDelete);
            }
        }

        const updatedPackage = await Package.findByIdAndUpdate(id, data, { new: true });
        res.json(updatedPackage);

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: 'Failed to update package' });
    }
};

// @desc    Delete a package
// @route   DELETE /api/packages/:id
// @access  Public (Protected in production)
export const deletePackage = async (req, res) => {
    try {
        const packageId = req.params.id;

        const pkg = await Package.findById(packageId);

        if (!pkg) {
            return res.status(404).json({ error: 'Package not found' });
        }

        let filesToDelete = [];

        if (pkg.image) {
            const path = extractPathFromUrl(pkg.image);
            if (path) filesToDelete.push(path);
        }

        // Gallery Images
        if (pkg.gallery && pkg.gallery.length > 0) {
            pkg.gallery.forEach(imgUrl => {
                const path = extractPathFromUrl(imgUrl);
                if (path) filesToDelete.push(path);
            });
        }

        // Manual PDF
        if (pkg.manualUrl) {
            const path = extractPathFromUrl(pkg.manualUrl);
            if (path) filesToDelete.push(path);
        }

        // Itinerary Images
        if (pkg.itinerary && pkg.itinerary.length > 0) {
            pkg.itinerary.forEach(day => {
                if (day.image) {
                    const path = extractPathFromUrl(day.image);
                    if (path) {
                        filesToDelete.push(path);
                    } else {
                        console.log('Failed to extract path for itinerary image:', day.image);
                    }
                }
            });
        }

        console.log("Files to be deleted from Supabase:", filesToDelete);

        if (filesToDelete.length > 0) {
            const { data, error: storageError } = await supabase
                .storage
                .from('package-images')
                .remove(filesToDelete);

            if (storageError) {
                console.error('Supabase Delete Error:', storageError);
            } else {
                console.log('Successfully deleted files from Supabase');
            }
        }

        await Package.findByIdAndDelete(packageId);

        res.json({ message: 'Package and associated images removed' });

    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

