const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String },
    fileUrl: { type: String },
    type: {
        type: String,
        enum: ['Contract', 'Report', 'Legal', 'Financial', 'Other'],
        default: 'Other'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Record Locking
    locked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    locked_at: { type: Date, default: null }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
