"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the notification context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = uuidv4();
    const newNotification = {
      id,
      message,
      type,
      duration,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss notification after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // Dismiss a notification by ID
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Shorthand methods for different notification types
  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const showError = useCallback((message, duration) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  // Value to be provided by the context
  const value = {
    notifications,
    addNotification,
    dismissNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
