import multer from 'multer';

const storage = multer.memoryStorage();

// Config multer
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Optional: Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        // Optional: Accept only images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed!'), false);
        }
    }
});
export default upload;