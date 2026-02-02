import React, { useEffect, useState } from 'react';
import {
    Plus, X, Image as ImageIcon, Edit, Trash2,
    DollarSign, Clock, Layers, List,
    Star,
    BedDouble,
    Hotel,
    MapPin,
} from 'lucide-react';

interface ItineraryDay {
    day: number;
    title: string;
    description: string;
    image?: string;
    hotel: string;
    meals: string;
    roomType: string;
    activities: string;
    imageFile?: File;
}

interface TravelPackage {
    _id: string;
    title: string;
    description: string;
    price: number;
    duration: string;
    image?: string;
    itinerary: any[];
}

const PackagesTab: React.FC = () => {
    const [packages, setPackages] = useState<TravelPackage[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [packageForm, setPackageForm] = useState({
        title: '',
        description: '',
        price: '',
        duration: '',
    });

    const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([{ day: 1, title: '', description: '', hotel: '', meals: '', roomType: '', activities: '' }]);

    // File States
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
    const [manualFile, setManualFile] = useState<File | null>(null);
    const [itineraryFiles, setItineraryFiles] = useState<{ [key: number]: File }>({});

    useEffect(() => { fetchPackages(); }, []);

    const fetchPackages = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/packages`);
            if (res.ok) setPackages(await res.json());
        } catch (e) { console.error(e); }
    };

    // --- Handlers ---
    const addItineraryDay = () => setItineraryDays([...itineraryDays, { day: itineraryDays.length + 1, title: '', description: '', hotel: '', meals: '', roomType: '', activities: '' }]);

    const updateItineraryDay = (index: number, field: keyof ItineraryDay, val: string) => {
        const n = [...itineraryDays];
        (n[index] as any)[field] = val;
        setItineraryDays(n);
    };

    const removeItineraryDay = (index: number) => {
        const updated = itineraryDays.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
        setItineraryDays(updated);

        // Clean up file reference
        const newFiles = { ...itineraryFiles };
        delete newFiles[index];
        setItineraryFiles(newFiles);
    };

    const handleItineraryFileChange = (index: number, file: File) => {
        setItineraryFiles(prev => ({ ...prev, [index]: file }));

        // Also update the itineraryDays state to hold this file temporarily so handleSubmit can access it via index logic
        const updatedDays = [...itineraryDays];
        updatedDays[index].imageFile = file;
        setItineraryDays(updatedDays);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Prepare the JSON data object
        const packageData = {
            title: packageForm.title,
            description: packageForm.description,
            price: Number(packageForm.price),
            duration: packageForm.duration,
            // Make sure itinerary is formatted correctly
            itinerary: itineraryDays.map(day => ({
                day: day.day,
                title: day.title,
                description: day.description,
                hotel: day.hotel,
                meals: day.meals,
                roomType: day.roomType,
                activities: day.activities
            }))
        };

        // 2. Create FormData
        const formData = new FormData();

        // IMPORTANT: Append all text data as a single JSON string
        formData.append('data', JSON.stringify(packageData));

        // 3. Append Main Image
        if (mainImageFile) {
            formData.append('mainImage', mainImageFile);
        }

        // 4. Append Gallery Images
        if (galleryFiles) {
            Array.from(galleryFiles).forEach((file) => {
                formData.append('gallery', file as any);
            });
        }

        // 5. Append Manual (PDF)
        if (manualFile) {
            formData.append('manual', manualFile);
        }

        // 6. Append Itinerary Images
        // The key must match the backend regex: itineraryImages[0], itineraryImages[1]
        itineraryDays.forEach((day, index) => {
            // Check either the separate state or the day object
            const file = itineraryFiles[index];
            if (file) {
                formData.append(`itineraryImages[${index}]`, file);
            }
        });

        try {
            const url = editingId
                ? `${import.meta.env.VITE_BACKEND_URL}/api/packages/${editingId}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/packages`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save package');
            }

            // Success! Reset form
            alert('Package saved successfully!');
            resetPackageForm();
            fetchPackages();

        } catch (error: any) {
            console.error("Submission Error:", error);
            alert(error.message);
        }
    };

    const handleEditPackage = (pkg: any) => {
        setEditingId(pkg._id);
        setPackageForm({
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            duration: pkg.duration,
        });
        setItineraryDays(pkg.itinerary || []);
        // Reset files when editing (user has to re-upload if they want to change)
        setMainImageFile(null);
        setGalleryFiles(null);
        setManualFile(null);
        setItineraryFiles({});

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePackage = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/packages/${id}`, { method: 'DELETE' });
            fetchPackages();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const resetPackageForm = () => {
        setEditingId(null);
        setPackageForm({ title: '', description: '', price: '', duration: '' });
        setItineraryDays([{ day: 1, title: '', description: '', hotel: '', meals: '', roomType: '', activities: '' }]);
        setMainImageFile(null);
        setGalleryFiles(null);
        setManualFile(null);
        setItineraryFiles({});
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">

            {/* --- LEFT COLUMN: EDITOR FORM --- */}
            <div className="lg:col-span-8 bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 order-2 lg:order-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b border-slate-100 pb-4 gap-4">
                    <div>
                        <h3 className="font-bold text-xl sm:text-2xl text-slate-800">{editingId ? 'Edit Package' : 'Create New Package'}</h3>
                        <p className="text-sm text-slate-400">Fill in the details to list a new travel package.</p>
                    </div>
                    {editingId && (
                        <button onClick={resetPackageForm} className="text-sm font-bold text-red-500 hover:text-red-800 underline self-end sm:self-auto">Cancel Edit</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

                    {/* Basic Details Section */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Package Title</label>
                            <input
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. Majestic Hill Country"
                                value={packageForm.title}
                                onChange={e => setPackageForm({ ...packageForm, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                    <input
                                        type="number"
                                        className="w-full p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="2500"
                                        value={packageForm.price}
                                        onChange={e => setPackageForm({ ...packageForm, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Duration</label>
                                <div className="relative">
                                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                    <input
                                        className="w-full p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="e.g. 5 Days / 4 Nights"
                                        value={packageForm.duration}
                                        onChange={e => setPackageForm({ ...packageForm, duration: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Overview</label>
                            <textarea
                                rows={4}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Detailed description of the package..."
                                value={packageForm.description}
                                onChange={e => setPackageForm({ ...packageForm, description: e.target.value })}
                            />
                        </div>

                        {/* File Uploads Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cover Image</label>
                                <div className="p-1 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setMainImageFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-emerald-600 hover:file:bg-emerald-50 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">PDF Manual (Optional)</label>
                                <div className="p-1 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={e => setManualFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-red-500 hover:file:bg-red-50 cursor-pointer"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-8"></div>

                    {/* Itinerary Section - Updated Design */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-emerald-600" />
                                <h4 className="font-bold text-lg text-slate-800">Itinerary Plan</h4>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {itineraryDays.map((day, index) => (
                                <div key={index} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">

                                    {/* Day Number Header */}
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                        <span className="font-black text-emerald-800 text-xs bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide">
                                            Day {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {itineraryDays.length > 1 && (
                                            <button type="button" onClick={() => removeItineraryDay(index)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-1.5 rounded-full">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* 1. Destination (using title field temporarily as destination if needed, or keeping structure) */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> Title / Destination
                                            </label>
                                            <input
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-emerald-500 outline-none"
                                                placeholder="e.g. Kandy City Tour"
                                                value={day.title}
                                                onChange={e => updateItineraryDay(index, 'title', e.target.value)}
                                            />
                                        </div>

                                        {/* 2. Description */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                            <textarea
                                                rows={2}
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-500 outline-none resize-none"
                                                placeholder="Short description of the day's journey..."
                                                value={day.description}
                                                onChange={e => updateItineraryDay(index, 'description', e.target.value)}
                                            />
                                        </div>

                                        {/* 3. Details Grid (Hotel, Food, Room) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Hotel className="w-3 h-3" /> Stay At
                                                </label>
                                                <input
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 outline-none"
                                                    placeholder="e.g. Topaz Hotel"
                                                    value={day.hotel}
                                                    onChange={e => updateItineraryDay(index, 'hotel', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                    <BedDouble className="w-3 h-3" /> Room Type
                                                </label>
                                                <input
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 outline-none"
                                                    placeholder="e.g. Double Standard"
                                                    value={day.roomType}
                                                    onChange={e => updateItineraryDay(index, 'roomType', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* 4. Experience (Activities) */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-pink-500" /> What You'll Experience
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="w-full p-2.5 bg-pink-50/30 border border-pink-100 rounded-lg text-sm text-slate-600 focus:border-pink-300 outline-none resize-none"
                                                placeholder="• Visit the sacred temple&#10;• Walk by the lake&#10;• Cultural dance show"
                                                value={day.activities}
                                                onChange={e => updateItineraryDay(index, 'activities', e.target.value)}
                                            />
                                            <p className="text-[10px] text-slate-400 text-right">Separate activities with new lines</p>
                                        </div>

                                        {/* 5. Image Upload */}
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full hover:bg-slate-100 transition-colors cursor-pointer relative">
                                                <ImageIcon className="w-4 h-4 shrink-0 text-emerald-500" />
                                                <span className="text-xs font-medium text-slate-500 truncate flex-1">
                                                    {itineraryFiles[index] ? itineraryFiles[index].name : 'Upload Day Image'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={e => e.target.files && handleItineraryFileChange(index, e.target.files[0])}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={addItineraryDay}
                                className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 bg-emerald-50/50 rounded-xl font-bold text-sm hover:bg-emerald-100 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 group"
                            >
                                <div className="bg-emerald-200 p-1 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                                Add Day {itineraryDays.length + 1}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-8"></div>

                    <button className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 shadow-xl shadow-slate-200 hover:shadow-emerald-200 transition-all duration-300 flex items-center justify-center gap-2">
                        {editingId ? <><Edit className="w-5 h-5" /> Update Package</> : <><Plus className="w-5 h-5" /> Publish Package</>}
                    </button>
                </form>
            </div>

            {/* --- RIGHT COLUMN: LIST --- */}
            <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                        <List className="w-5 h-5 text-emerald-500" /> Existing Packages
                    </h3>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">{packages.length}</span>
                </div>

                <div className="space-y-4 max-h-[500px] lg:max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                    {packages.map(pkg => (
                        <div key={pkg._id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
                            <div className="flex gap-3 sm:gap-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                                    {pkg.image ? (
                                        <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={pkg.title} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-300">
                                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-grow py-1">
                                    <h4 className="font-bold text-slate-800 truncate text-sm sm:text-base mb-1">{pkg.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mb-3">
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            <Clock className="w-3 h-3 text-emerald-500" /> {pkg.duration}
                                        </span>
                                        <span className="font-bold text-emerald-600">${pkg.price}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditPackage(pkg)}
                                            className="flex-1 bg-slate-50 text-slate-600 text-xs font-bold py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeletePackage(pkg._id)}
                                            className="bg-slate-50 text-slate-400 px-3 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {packages.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 font-medium">No packages found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackagesTab;