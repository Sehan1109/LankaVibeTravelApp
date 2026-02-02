import mongoose from 'mongoose';

const ItineraryDaySchema = new mongoose.Schema({
  day: Number,
  location: String,
  description: String,
  activities: [mongoose.Schema.Types.Mixed],
  meals: [String],

  // This Mixed type is key. It allows:
  estimatedCost: mongoose.Schema.Types.Mixed,

  accommodation: mongoose.Schema.Types.Mixed
});

const BookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  arrivalDate: { type: mongoose.Schema.Types.Mixed },
  departureDate: { type: mongoose.Schema.Types.Mixed },
  guests: { type: Number },
  packageName: { type: String },
  packageId: { type: String },

  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Confirmed', 'Cancelled'],
    default: 'Pending'
  },

  itineraryDetails: {
    title: String,
    summary: String,
    estimatedTotalBudget: String,
    days: [ItineraryDaySchema]
  }

}, { timestamps: true });

export default mongoose.model('Booking', BookingSchema);