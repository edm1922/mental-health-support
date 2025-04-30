"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/utils/useUser";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FixRelationshipsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [foreignKeys, setForeignKeys] = useState([]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/admin/check-role", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  };

  const fetchForeignKeys = async () => {
    try {
      const response = await fetch("/api/db/foreign-keys", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.foreignKeys) {
          setForeignKeys(data.foreignKeys);
        }
      }
    } catch (err) {
      console.error("Error fetching foreign keys:", err);
    }
  };

  useEffect(() => {
    if (user && !userLoading) {
      checkAdminStatus();
      fetchForeignKeys();
    }
  }, [user, userLoading]);

  const fixDatabaseRelationships = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch("/api/db/fix-relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        if (data.foreignKeys) {
          setForeignKeys(data.foreignKeys);
        }
      } else {
        setError(data.error || "Failed to fix database relationships");
      }
    } catch (err) {
      console.error("Error fixing database relationships:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
            <Link href="/account/signin">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h1>
            <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
            <Link href="/">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Fix Database Relationships</h1>
          <p className="text-gray-600 mb-6">
            This page allows you to fix the relationships between tables in the database.
            This is useful if you're seeing errors like "Could not find a relationship between tables".
          </p>

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-800 mb-3">
                Current Foreign Key Relationships
              </h2>
              
              {foreignKeys.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">Constraint Name</th>
                        <th className="py-2 px-4 border-b text-left">Table Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foreignKeys.map((fk, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-2 px-4 border-b">{fk.constraint_name}</td>
                          <td className="py-2 px-4 border-b">{fk.table_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No foreign key relationships found.</p>
              )}
              
              <div className="mt-4">
                <motion.button
                  onClick={fixDatabaseRelationships}
                  disabled={loading}
                  className={`${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white font-medium py-2 px-4 rounded-md transition-colors duration-200`}
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Fix Database Relationships"
                  )}
                </motion.button>
              </div>

              {result && (
                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 mr-2 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">Success!</span>
                  </div>
                  <p className="mt-1 ml-7 text-sm">{result.message}</p>
                  
                  {result.foreignKeys && result.foreignKeys.length > 0 && (
                    <div className="mt-2 ml-7">
                      <p className="text-sm font-medium">Foreign Keys:</p>
                      <ul className="list-disc list-inside text-xs mt-1">
                        {result.foreignKeys.map((fk, index) => (
                          <li key={index}>
                            {fk.constraint_name} ({fk.table_name})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 mr-2 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">Error!</span>
                  </div>
                  <p className="mt-1 ml-7 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Link href="/admin">
            <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
              Back to Admin
            </button>
          </Link>
          
          <Link href="/counseling/sessions">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
              View Sessions
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
