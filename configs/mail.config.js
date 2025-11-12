const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('SMTP connection failed:', error);
    } else {
        console.log('SMTP connection successful');
    }
});

module.exports = transporter;