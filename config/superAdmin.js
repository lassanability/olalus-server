const bcrypt = require('bcrypt');
const AdminUser = require('../models/adminUser');

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'chicken@12345';

async function initSuperAdmin() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.warn('[SuperAdmin] ADMIN_EMAIL not set — skipping super admin creation');
    return;
  }

  try {
    const existing = await AdminUser.findOne({ email });
    if (existing) {
      // Ensure it's still marked as super admin (can't be stripped)
      if (!existing.isSuperAdmin) {
        await AdminUser.updateOne({ email }, { isSuperAdmin: true });
        console.log('[SuperAdmin] Restored super admin flag for:', email);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await AdminUser.create({
      email,
      password: hashedPassword,
      name: 'Super Admin',
      isSuperAdmin: true,
      roles: AdminUser.schema.statics.ALL_ROLES || [],
      isActive: true,
      passwordChangedFromDefault: false,
    });

    console.log(`[SuperAdmin] Created super admin: ${email}`);
    console.log(`[SuperAdmin] Default password: ${DEFAULT_PASSWORD} — PLEASE CHANGE IT`);
  } catch (err) {
    console.error('[SuperAdmin] Failed to initialize super admin:', err.message);
  }
}

module.exports = { initSuperAdmin };
