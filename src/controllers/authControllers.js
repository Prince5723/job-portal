const Company = require('../models/company');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const twilio = require('twilio')

//twillio credentials
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);


// Registration Controller
const register = async (req, res) => {
    let { name, phoneNumber, companyName, companyEmail, employeeSize } = req.body;
    console.log(name, phoneNumber, companyName, companyEmail, employeeSize)
    phoneNumber = '+91' + phoneNumber;

    try {
        let company = await Company.findOne({ companyEmail });

        //todo - if unvarified company exists send them email again and verfiy
        if (company) {
            return res.status(400).json({ msg: 'Company already exists' });
        }

        company = new Company({
            name,
            phoneNumber,
            companyName, 
            companyEmail, 
            employeeSize
        });

        await company.save();

        // Generate JWT token
        const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        const phoneOtp = speakeasy.totp({ secret: process.env.SPEAKEASY_SECRET + phoneNumber, encoding: 'base32' });
        const mailOtp = speakeasy.totp({ secret: process.env.SPEAKEASY_SECRET + companyEmail, encoding: 'base32' });

        console.log(phoneOtp, mailOtp);

        // Send verification code using Twilio
        client.messages.create({
            body: `Your OTP code for job-portal is ${phoneOtp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        })
            .then((message) => {
                res.status(200).json({
                    msg: `OTP sent to ${phoneNumber}`
                });
            })
            .catch((error) => {
                console.error("Failed to send OTP:", error);
                res.status(500).json({
                    msg: "Failed to send OTP"
                })
            });


        // Send verification email using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: companyEmail,
            subject: 'Verify your account',
            text: `Your verification code for job-portal is: ${mailOtp}`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ msg: 'Failed to send verification email' });
            } else {
                res.status(200).json({ msg: 'Company registered, please verify your email', token });
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
        console.log(err);
    }
};

// Auto Login Controller
const autoLogin = async (req, res) => {
    try {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const company = await Company.findById(decoded.companyId).select('-password');

        if (!company) {
            return res.status(400).json({ msg: 'Invalid token' });
        }

        if (!company.isVerified) {
            return res.status(401).json({ msg: 'Please verify your email first' });
        }

        res.json(company);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Email Verification Controller
const verifyEmail = async (req, res) => {
    const { emailOtp, companyEmail } = req.body;
    console.log("Inside verifyEmail", emailOtp, companyEmail)
  
    try {
      const company = await Company.findOne({ companyEmail });
  
      if (!company) {
        return res.status(400).json({ msg: 'Company not found' });
      }

      const verified = speakeasy.totp.verify({
        secret: process.env.SPEAKEASY_SECRET + companyEmail,
        encoding: 'base32',
        token: emailOtp,
        window: 1
    });

    console.log(verified)

      if (!verified) {
        return res.status(400).json({ msg: 'Invalid verification code' });
      }else{
        company.isVerified = true;
        await company.save();
        return res.status(200).json({ msg: 'Email verified successfully' });
      }
  
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'Server Error' });
    }
  };

  const verifyPhone = async (req, res) => {
    let { phoneOtp, phoneNumber} = req.body;
    phoneNumber = '+91' + phoneNumber;
    console.log("Inside verifyPhone", phoneOtp, phoneNumber)
  
    try {
      const company = await Company.findOne({ phoneNumber });
  
      if (!company) {
        return res.status(400).json({ msg: 'Company not found' });
      }

      const verified = speakeasy.totp.verify({
        secret: process.env.SPEAKEASY_SECRET + phoneNumber,
        encoding: 'base32',
        token: phoneOtp,
        window: 1
    });

    console.log(verified)

      if (!verified) {
        return res.status(400).json({ msg: 'Invalid verification code' });
      }else{
        company.isVerified = true;
        await company.save();
        return res.status(200).json({ msg: 'Phone Number verified successfully' });
      }
  
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'Server Error' });
    }
  };

  module.exports = { register, autoLogin, verifyEmail, verifyPhone };
  
  