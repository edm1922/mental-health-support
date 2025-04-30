"use client";
import { useEffect } from "react";

export default function DatabaseSchemaCheck() {
  // Check database schema on component mount
  useEffect(() => {
    const checkDatabaseSchema = async () => {
      try {
        // Only run in production or if explicitly enabled
        if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SCHEMA_CHECK === 'true') {
          console.log('Checking database schema on startup...');
          
          const response = await fetch('/api/system/check-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ runMigration: false })
          });
          
          const data = await response.json();
          
          if (data.schemaStatus?.criticalIssuesFound) {
            console.warn('Critical database schema issues found! Please run the database migration.');
          } else {
            console.log('Database schema check passed.');
          }
        }
      } catch (error) {
        console.error('Error checking database schema:', error);
      }
    };
    
    checkDatabaseSchema();
  }, []);
  
  // This component doesn't render anything
  return null;
}
