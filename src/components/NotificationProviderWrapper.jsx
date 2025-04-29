"use client";
import React from 'react';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationBar from '@/components/ui/NotificationBar';

const NotificationProviderWrapper = ({ children }) => {
  return (
    <NotificationProvider>
      <NotificationBar />
      {children}
    </NotificationProvider>
  );
};

export default NotificationProviderWrapper;
