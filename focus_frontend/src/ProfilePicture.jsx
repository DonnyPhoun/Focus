import React from 'react';
import styles from './ProfilePicture.module.css';

const ProfilePicture = ({ src, alt = 'Profile' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={styles.profilePic}
    />
  );
};

export default ProfilePicture;
