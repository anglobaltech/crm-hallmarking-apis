import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { pool } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// Mock OTP storage (in production use Redis or DB with TTL s)
const otpStore = new Map();

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes expiry
  
  console.log(`\n\n=== OTP for ${email} is: ${otp} ===\n\n`);
  
  try {
    const userEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    
    // Check if SMTP is configured
    if (!userEmail || userEmail === 'your_email@gmail.com') {
      return res.status(500).json({ error: 'Email configuration missing in .env file. Please add your credentials.' });
    }

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'HallmarkPro'}" <${process.env.SMTP_FROM || userEmail}>`,
      to: email,
      subject: 'Your OTP Code for HallmarkPro Registration',
      text: `Hello, your OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Welcome to HallmarkPro</h2>
              <p>Your OTP code is: <strong style="font-size: 24px;">${otp}</strong></p>
              <p>This code will expire in 10 minutes.</p>
             </div>`
    });
    console.log(`Email successfully sent to ${email}`);
    
    // Only return success if the email was actually sent
    res.json({ message: 'OTP sent successfully' });
    
  } catch (emailError) {
    console.error('Failed to send OTP via email:', emailError);
    return res.status(500).json({ error: 'Failed to send email. Check your SMTP credentials.' });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
  
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ error: 'No OTP requested for this email' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP has expired' });
  
  if (record.otp === otp) {
    otpStore.delete(email);
    // You could issue a temporary reset token here, but for simplicity we'll just return success
    return res.json({ message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password required' });
  
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const pinHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET pin_hash = $1 WHERE email = $2', [pinHash, email]);
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { 
      fullName, email, mobile, centreName, 
      bisLicence, address, gstNumber, logoUrl, password 
    } = req.body;
    
    if (!fullName || !email || !mobile || !centreName || !bisLicence || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tenantRes = await pool.query(
      'INSERT INTO tenants (name, bis_licence, address, gst_number, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [centreName, bisLicence, address || '', gstNumber || '', logoUrl || '']
    );
    const tenantId = tenantRes.rows[0].id;

    const pinHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (tenant_id, name, role, pin_hash, email, mobile) VALUES ($1, $2, $3, $4, $5, $6)',
      [tenantId, fullName, 'admin', pinHash, email, mobile]
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password, device_token } = req.body;

    if (!identifier || !password || !device_token) {
      return res.status(400).json({ error: 'Missing required fields (identifier, password, device_token)' });
    }

    // 1. Find the user and tenant info (identifier can be email or centre name)
    const userResult = await pool.query(
      `SELECT u.*, t.name as tenant_name, t.bis_licence, t.bis_licence_expiry, t.address as tenant_address, t.logo_url, t.gst_number
       FROM users u 
       JOIN tenants t ON u.tenant_id::varchar = t.id::varchar 
       WHERE u.email = $1 OR t.name = $1 LIMIT 1`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // 2. Verify Password (Support both hashed and plain for dummy data)
    let isMatch = false;
    if (user.pin_hash.startsWith('$2a$') || user.pin_hash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.pin_hash);
    } else {
      isMatch = (password === user.pin_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Check active devices (Single Device Limit)
    const deviceCheck = await pool.query(
      'SELECT device_token FROM devices WHERE user_id = $1',
      [user.id]
    );

    if (deviceCheck.rows.length > 0) {
      const activeDevice = deviceCheck.rows[0].device_token;
      if (activeDevice !== device_token) {
        await pool.query(
          'UPDATE devices SET device_token = $1, last_active = CURRENT_TIMESTAMP WHERE user_id = $2',
          [device_token, user.id]
        );
      } else {
        await pool.query(
          'UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1',
          [user.id]
        );
      }
    } else {
      await pool.query(
        'INSERT INTO devices (user_id, device_token) VALUES ($1, $2)',
        [user.id, device_token]
      );
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenant_id, 
        role: user.role, 
        name: user.name,
        deviceToken: device_token,
        tenant_name: user.tenant_name,
        bis_licence: user.bis_licence,
        bis_licence_expiry: user.bis_licence_expiry,
        tenant_address: user.tenant_address,
        logo_url: user.logo_url,
        gst_number: user.gst_number
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        name: user.name,
        role: user.role,
        tenant_name: user.tenant_name,
        bis_licence: user.bis_licence,
        bis_licence_expiry: user.bis_licence_expiry,
        tenant_address: user.tenant_address,
        logo_url: user.logo_url,
        gst_number: user.gst_number
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM devices WHERE user_id = $1', [userId]);
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: req.user });
};

export const getTenants = async (req, res) => {
  try {
    const tenants = await pool.query('SELECT id, name FROM tenants ORDER BY id');
    res.json(tenants.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

export const updateLicenceExpiry = async (req, res) => {
  try {
    const { expiry_date } = req.body;
    const tenantId = req.user.tenantId;
    if (!expiry_date) {
      return res.status(400).json({ error: 'expiry_date is required' });
    }
    await pool.query('UPDATE tenants SET bis_licence_expiry = $1 WHERE id = $2', [expiry_date, tenantId]);
    res.json({ message: 'Expiry date updated successfully', expiry_date });
  } catch (err) {
    console.error('Failed to update expiry date:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const result = await pool.query(`
      SELECT 
        u.name as full_name, u.email, u.mobile,
        t.name as centre_name, t.bis_licence, t.address, t.gst_number, t.logo_url, t.bis_licence_expiry
      FROM users u
      JOIN tenants t ON u.tenant_id::varchar = t.id::varchar
      WHERE u.id = $1 AND t.id = $2
    `, [userId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User/Tenant not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const { full_name, email, mobile, centre_name, bis_licence, address, gst_number, logo_url } = req.body;

    await pool.query('BEGIN');

    await pool.query(`
      UPDATE users 
      SET name = $1, email = $2, mobile = $3 
      WHERE id = $4 AND tenant_id::varchar = $5::varchar
    `, [full_name, email, mobile, userId, tenantId]);

    await pool.query(`
      UPDATE tenants 
      SET name = $1, bis_licence = $2, address = $3, gst_number = $4, logo_url = $5
      WHERE id = $6
    `, [centre_name, bis_licence, address || '', gst_number || '', logo_url || '', tenantId]);

    await pool.query('COMMIT');
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
