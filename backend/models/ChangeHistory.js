const mongoose = require('mongoose');

const changeHistorySchema = new mongoose.Schema({
    entity_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    old_value: { type: Object },
    new_value: { type: Object },
    reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ChangeHistory', changeHistorySchema);
