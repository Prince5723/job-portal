const express = require('express');
const { register, autoLogin, verifyEmail, verifyPhone } = require('../controllers/authControllers');
const router = express.Router();

console.log(register, autoLogin, verifyEmail)

router.post('/register', register);
router.post('/autoLogin', autoLogin);
router.post('/verifyEmail', verifyEmail);
router.post('/verifyPhone', verifyPhone);


module.exports = router;