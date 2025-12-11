import { User } from '../models/User';
import { config } from './'
/**
 * Initialize the database with a super admin user
 */
export const initializeData = async (): Promise<void> => {
  try {
    const superAdminEmail = config.ADMIN_EMAIL;
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Create super admin user
    // Password will be automatically hashed by the User model's pre-save hook
    await User.create({
      username: 'super_admin',
      email: superAdminEmail,
      password: config.ADMIN_PWD,
      role: 'super_admin',
    });

    console.log('Super admin created successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
};
