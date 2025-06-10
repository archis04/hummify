const mongoose = require("mongoose");

const instrumentAudioSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  original_notes: {
    type: [String],
    required: true,
  },
  instrument_type: {
    type: String,
    default: "piano",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InstrumentAudio", instrumentAudioSchema);
