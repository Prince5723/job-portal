const Job = require('../models/job');
const nodemailer = require('nodemailer');
const Company = require('../models/company');
const mongoose = require('mongoose');

// Post Job
const postJob = async (req, res) => {
  const { title, description, experienceLevel, endDate, candidates } = req.body;
  const companyId = req.company.companyId;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return res.status(400).json({ msg: 'Invalid company ID format' });
  }

  const company = await Company.findById(companyId);
  const companyName = company.companyName;
  console.log(company.companyName);
  if (!companyName) {
    return res.status(404).json({ msg: 'Company not found' });
  }

  if(company.isVarified === false){
    return res.status(400).json({ msg: 'Please verify your email first' });
  }

  try {
    const job = new Job({
      title,
      description,
      experienceLevel,
      endDate,
      company: companyId,
      candidates
    });

    console.log(title, description, experienceLevel, endDate, candidates, companyId);

    await job.save();


    // Email candidates using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    for (let candidate of candidates) {
      const mailOptions = {
        from: process.env.NODEMAILER_EMAIL,
        to: candidate,
        subject: `Job Alert: ${job.title}`,
        text: `Hello, we have a new job opening for ${job.title}. Here are the details:\n\n${job.description}\n\nExperience Level: ${job.experienceLevel}\n\nEnd Date: ${job.endDate}\n\nCompany: ${companyName}\n\n Please apply before the deadline.`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('Error sending email:', err);
          res.status(500).json({ msg: 'Error sending email' });
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    res.status(201).json({ msg: 'Job posted and emails sent to candidates' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { postJob };
