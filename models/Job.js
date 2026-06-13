const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  companyName: String,
  role: String,
  status: String,
  notes: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
},
{
  timestamps: true
});

module.exports = mongoose.model("Job", jobSchema);