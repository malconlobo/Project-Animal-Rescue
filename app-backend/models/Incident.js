const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  city: { type: String, required: true },
  situation: { type: String, required: true },
  location: { type: String, required: true },
  details: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['reported', 'in-progress', 'resolved'],
    default: 'reported'
  },
  // Reference to the PostgreSQL organization ID.
  // Using String or Number since it refers to an external relational DB ID, not a Mongo ObjectId.
  assignedTo: { type: String, default: null }, 
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
