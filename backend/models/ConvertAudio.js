const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  note:     { type: String, required: true },
  start:    { type: Number, required: true },
  end:      { type: Number, required: true },
  duration: { type: Number, required: true },
  volume:   { type: Number, required: true }
}, { _id: false });

const convertAudioSchema = new mongoose.Schema({
  notes:         { type: [noteSchema], required: true },
  instrument:    { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model("ConvertAudio", convertAudioSchema);


