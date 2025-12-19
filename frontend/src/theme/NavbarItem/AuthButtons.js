/**
 * Custom navbar item for authentication buttons
 */
import React from 'react';
import AuthNavbarItem from '@site/src/theme/AuthNavbarItem';

export default function AuthButtonsNavbarItem(props) {
  return <AuthNavbarItem mobile={false} {...props} />;
}