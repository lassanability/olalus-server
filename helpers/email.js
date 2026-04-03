const nodemailer = require("nodemailer");
const path = require('path');
const fs = require('fs');

const EMAIL_FROM = process.env.Email;
const WEBSITE_URL = process.env.WEBSITE || '';
const API_URL = process.env.API_URL || '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || EMAIL_FROM;

const baseReplacements = () => ({
  websiteUrl: WEBSITE_URL,
  supportEmail: SUPPORT_EMAIL,
});

const emailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    }
  });
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sendTemplatedEmail = async (options) => {
  const { to, subject, templatePath, replacements } = options;

  if (!to) {
    throw new Error('Recipient email is required.');
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    template = template.replace(regex, escapeHtml(value));
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html: template,
  };

  const transporter = emailTransporter();
  const info = await transporter.sendMail(mailOptions);
  return { success: true, message: 'Email sent successfully.', info };
};

exports.sendWelcomeEmail = async (email, username) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  return sendTemplatedEmail({
    to: email,
    subject: 'Welcome to Olalus Community Healthcare Services',
    templatePath: path.join(__dirname, '../client/welcome.html'),
    replacements: { ...baseReplacements(), username }
  });
};

exports.sendVerificationCodeEmail = async (email, username, verificationCode) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a verification email.');
  }

  return sendTemplatedEmail({
    to: email,
    subject: 'Your Verification Code',
    templatePath: path.join(__dirname, '../client/verification.html'),
    replacements: { ...baseReplacements(), username, verificationCode }
  });
};

exports.sendPasswordResetEmail = async (username, email, resetToken) => {
  const deepLink = `${API_URL}/reset?token=${resetToken}&email=${encodeURIComponent(email)}`;

  return sendTemplatedEmail({
    to: email,
    subject: 'Password Reset Request',
    templatePath: path.join(__dirname, '../client/passwordEmailReset.html'),
    replacements: { ...baseReplacements(), username, resetUrl: deepLink }
  });
};

exports.sendResetSucessfulEmail = async (username, email) => {
  return sendTemplatedEmail({
    to: email,
    subject: 'Password Reset Successful',
    templatePath: path.join(__dirname, '../client/passwordResetSuccesful.html'),
    replacements: { ...baseReplacements(), username }
  });
};

exports.contactEmail = async (email, username, message, subject = 'Contact Us') => {
  if (!email || !username || !message) {
    throw new Error('Email, username and message are required to send a contact email.');
  }

  return sendTemplatedEmail({
    to: EMAIL_FROM,
    subject: `Contact Form: ${subject}`,
    templatePath: path.join(__dirname, '../client/contact.html'),
    replacements: { ...baseReplacements(), username, email, message, subject }
  });
};

exports.sendNewsletterEmails = async (emails, subject, message) => {
  const batchSize = 10;
  const batchDelay = 10000;
  const successfulEmails = [];
  const transporter = emailTransporter();
  const templatePath = path.join(__dirname, '../client/newsletters.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  const applyReplacements = (raw, extra) => {
    let result = raw;
    const all = { ...baseReplacements(), ...extra };
    Object.entries(all).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
    });
    return result;
  };

  if (Array.isArray(emails)) {
    for (let i = 0; i < emails.length; i += batchSize) {
      const batchEmails = emails.slice(i, i + batchSize);

      const promises = batchEmails.map(email => {
        const username = email.split('@')[0];
        const personalizedTemplate = applyReplacements(template, { username, message, subject });

        return transporter.sendMail({ from: EMAIL_FROM, to: email, subject, html: personalizedTemplate });
      });

      const results = await Promise.all(promises);
      successfulEmails.push(...results
        .filter(result => result.accepted && result.accepted.length > 0)
        .map(result => result.accepted[0]));

      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
  } else {
    const username = emails.split('@')[0];
    const personalizedTemplate = applyReplacements(template, { username, message, subject });
    const result = await transporter.sendMail({ from: EMAIL_FROM, to: emails, subject, html: personalizedTemplate });
    if (result.accepted && result.accepted.length > 0) {
      successfulEmails.push(result.accepted[0]);
    }
  }

  return successfulEmails;
};

exports.sendHealthReminderEmail = async (email, username, message) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a health reminder email.');
  }

  return sendTemplatedEmail({
    to: email,
    subject: 'A Reminder from Olalus Community Healthcare Services',
    templatePath: path.join(__dirname, '../client/remainder.html'),
    replacements: { ...baseReplacements(), username, message }
  });
};

exports.sendAdminEmail = async (email, username, makeAdmin) => {
  if (!email || !username) {
    throw new Error('Email and username required for admin status email');
  }

  const emailData = {
    title: makeAdmin ? 'Welcome New Admin' : 'Admin Access Removed',
    message: makeAdmin
      ? 'You now have admin privileges. Access the admin panel to manage site features.'
      : 'Your admin access has been revoked. You no longer have access to admin features.',
    subject: makeAdmin ? 'Admin Access Granted' : 'Admin Access Removed'
  };

  return sendTemplatedEmail({
    to: email,
    subject: emailData.subject,
    templatePath: path.join(__dirname, '../client/adminEmail.html'),
    replacements: {
      ...baseReplacements(),
      username,
      title: emailData.title,
      message: emailData.message
    }
  });
};

exports.deleteAccountEmail = async (email, username, details) => {
  const subject = details.deletedByAdmin
    ? 'Your Account Has Been Deleted by Administrator'
    : 'Account Deletion Successful';

  const deletionDate = new Date(details.deletionDate).toLocaleString();

  let message = '';
  if (details.deletedByAdmin) {
    message += `Your account has been deleted by an administrator on ${deletionDate}.`;
    if (details.bulkDeletion) {
      message += '\nThis action was part of a bulk account cleanup process.';
    }
  } else {
    message += `As requested, your account has been successfully deleted on ${deletionDate}.`;
  }

  return sendTemplatedEmail({
    to: email,
    subject,
    templatePath: path.join(__dirname, '../client/accountDeleted.html'),
    replacements: { ...baseReplacements(), username, message }
  });
};

module.exports = exports;
