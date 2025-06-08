import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  const { walletAddress } = req.query;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    if (req.method === "GET") {
      // Get profile by wallet address
      const { data: profile, error } = await mysql.getProfileByWalletAddress(
        walletAddress
      );

      if (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
          error: "Failed to fetch profile",
          details: error.message,
        });
      }

      if (!profile) {
        // Return default profile structure if none exists
        return res.status(200).json({
          wallet_address: walletAddress.toLowerCase(),
          full_name: "",
          email: "",
          phone_number: "",
          privacy_settings: {
            public_profile: true,
            show_certificates_publicly: true,
            receive_notifications: true,
          },
          exists: false,
        });
      }

      // Parse privacy settings JSON
      let privacy_settings = {};
      try {
        privacy_settings = profile.privacy_settings
          ? JSON.parse(profile.privacy_settings)
          : {};
      } catch (e) {
        privacy_settings = {
          public_profile: true,
          show_certificates_publicly: true,
          receive_notifications: true,
        };
      }

      return res.status(200).json({
        ...profile,
        privacy_settings,
        exists: true,
      });
    } else if (req.method === "PUT") {
      // Update profile
      const { full_name, email, phone_number, privacy_settings } = req.body;

      // Validate required fields
      if (!full_name) {
        return res.status(400).json({ error: "Full name is required" });
      }

      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate phone number format if provided (basic validation)
      if (phone_number && phone_number.length > 0) {
        // Remove all spaces, hyphens, and parentheses for validation
        const cleanedPhone = phone_number.replace(/[\s\-\(\)]/g, "");
        // Allow + followed by 7-15 digits, first digit can be 0-9
        if (!/^[\+]?[0-9]{7,15}$/.test(cleanedPhone)) {
          return res.status(400).json({ error: "Invalid phone number format" });
        }
      }

      const profileData = {
        wallet_address: walletAddress,
        full_name: full_name.trim(),
        email: email ? email.trim() : null,
        phone_number: phone_number ? phone_number.trim() : null,
        privacy_settings: privacy_settings || {
          public_profile: true,
          show_certificates_publicly: true,
          receive_notifications: true,
        },
      };

      const { data: updatedProfile, error } = await mysql.upsertProfile(
        profileData
      );

      if (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({
          error: "Failed to update profile",
          details: error.message,
        });
      }

      // Parse privacy settings for response
      let privacy_settings_parsed = {};
      try {
        privacy_settings_parsed = updatedProfile.privacy_settings
          ? JSON.parse(updatedProfile.privacy_settings)
          : {};
      } catch (e) {
        privacy_settings_parsed = profileData.privacy_settings;
      }

      return res.status(200).json({
        ...updatedProfile,
        privacy_settings: privacy_settings_parsed,
        message: "Profile updated successfully",
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
