import jwt from 'jsonwebtoken';
import { pool, tenantStorage } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify session/device limit
    const deviceCheck = await pool.query(
      'SELECT device_token FROM devices WHERE user_id = $1',
      [decoded.userId]
    );

    if (deviceCheck.rows.length > 0) {
      if (deviceCheck.rows[0].device_token !== decoded.deviceToken) {
        return res.status(403).json({ 
          error: 'Session expired. You logged in on another device.',
          code: 'MULTIPLE_DEVICES'
        });
      }
    }

    // Pass user info to request
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      name: decoded.name,
      tenant_name: decoded.tenant_name,
      bis_licence: decoded.bis_licence,
      bis_licence_expiry: decoded.bis_licence_expiry
    };
    
    tenantStorage.run(decoded.tenantId, () => {
      next();
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
