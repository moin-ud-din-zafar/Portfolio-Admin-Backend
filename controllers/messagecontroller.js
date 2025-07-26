const Message = require('../models/Message');
const nodemailer = require('nodemailer');

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP configuration at startup
transporter.verify(err => {
  if (err) {
    console.error('❌ SMTP configuration error:', err);
  } else {
    console.log('✅ SMTP server is ready to send messages');
  }
});

/**
 * GET /api/messageroutes/
 * Fetch all contact messages
 */
exports.getAll = async (req, res) => {
  try {
    const msgs = await Message.find().sort({ receivedAt: -1 });
    return res.json(msgs);
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * POST /api/messageroutes/
 * Save a new message and send email notification
 */
exports.create = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input presence
    const missing = [];
    ['name', 'email', 'subject', 'message'].forEach(field => {
      if (!req.body[field]) missing.push(field);
    });
    if (missing.length) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: missing
      });
    }

    // 1) Save to database
    const msg = new Message({ name, email, subject, message });
    await msg.save();

    // 2) Prepare email
    const recipient = process.env.EMAIL_TO;
    if (!recipient) {
      console.warn('⚠️  EMAIL_TO is not defined, skipping email send');
    } else {
      const mailOpts = {
        from: `"Website Contact Form" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `New Contact Form: ${subject}`,
        text: `You have received a new message from your website.\n\n` +
              `Name:    ${name}\n` +
              `Email:   ${email}\n` +
              `Subject: ${subject}\n\n` +
              `Message:\n${message}\n\n` +
              `Received at: ${msg.receivedAt.toISOString()}`
      };

      console.log('📤 Attempting to send email to:', recipient);
      transporter.sendMail(mailOpts, (err, info) => {
        if (err) {
          console.error('❌ Error sending email:', err);
        } else {
          console.log('✅ Email sent! Message ID:', info.messageId);
          console.log('📬 SMTP response:', info.response);
        }
      });
    }

    console.log('🎯 Email handling block completed');
    return res.status(201).json(msg);
  } catch (err) {
    console.error('Error saving message:', err);
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details });
    }
    return res.status(500).json({ error: 'Failed to save message' });
  }
};
