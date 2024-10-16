const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true },
  employeeSize: { type: String, required: true },
  isVarified: { type: Boolean, default: false },
});


const Company = mongoose.model('Company', companySchema);
module.exports = Company;
