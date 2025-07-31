const Message   = require('../models/Message');
const nodemailer = require('nodemailer');

// SMTP setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify(err => {
  if (err) console.error('SMTP error:', err);
  else      console.log('SMTP ready');
});

// GET /api/messages
exports.getAll = async (req, res) => {
  try {
    const msgs = await Message.find().sort({ receivedAt: -1 });
    res.json(msgs);
  } catch (err) {
    console.error('getAllMessages ERROR:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/messages
exports.create = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const missing = ['name','email','subject','message'].filter(f => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ error:'Missing fields', details: missing });
    }
    // save
    const msg = new Message({ name, email, subject, message });
    await msg.save();

    // send mail if EMAIL_TO set
    const recipient = process.env.EMAIL_TO;
    if (recipient) {
      const opts = {
        from: `"Contact Form" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `New message: ${subject}`,
        text:
          `Name: ${name}\nEmail: ${email}\n\n${message}\n`
      };
      transporter.sendMail(opts, (err, info) =>
        err ? console.error('Mailer error:', err) :
              console.log('Mailer sent:', info.messageId)
      );
    }
    res.status(201).json(msg);

  } catch (err) {
    console.error('createMessage ERROR:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
