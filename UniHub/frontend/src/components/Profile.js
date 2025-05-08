import React, { useState, useRef } from 'react';
import apiRequest from '../services/apiRequest';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    bio: '',
    profile_picture: null
  });
  const fileInputRef = useRef(null);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await apiRequest(
        `/profile/${profile.account_ID}/upload-picture/`,
        'PUT',
        formData,
        true // isFormData
      );
      
      if (response.profile_picture) {
        setProfile(prev => ({
          ...prev,
          profile_picture: response.profile_picture
        }));
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
    }
  };

  const handleEditClick = () => {
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      phone_number: profile.phone_number || '',
      address: profile.address || '',
      bio: profile.bio || '',
      profile_picture: null
    });
    setEditMode(true);
  };

  return (
    <div className="profile-container">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : profile ? (
        <div className="profile-content">
          <div className="profile-header">
            <div className="profile-picture-container">
              {profile.profile_picture ? (
                <img 
                  src={profile.profile_picture} 
                  alt="Profile" 
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
              )}
              {editMode && (
                <div className="profile-picture-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Picture
                  </button>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>{profile.first_name} {profile.last_name}</h1>
              <p className="email">{profile.email}</p>
            </div>
          </div>
          {/* ... rest of the existing JSX ... */}
        </div>
      ) : (
        <div className="error">Profile not found</div>
      )}
    </div>
  );
};

export default Profile; 