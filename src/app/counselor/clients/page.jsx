'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import CounselorNavbar from '@/components/ui/CounselorNavbar';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CounselorClients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'recent-asc', 'recent-desc'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchClients();
  }, [sortBy, filter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Get current counselor ID
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }
      
      const counselorId = session.user.id;
      
      // Fetch clients assigned to this counselor
      const { data: clientsData, error } = await supabase
        .from('counselor_client_relationships')
        .select(`
          id,
          status,
          created_at,
          last_interaction,
          client_id,
          client:client_id (
            id,
            display_name,
            image_url,
            last_active,
            created_at
          )
        `)
        .eq('counselor_id', counselorId);
      
      if (error) {
        throw error;
      }
      
      // Apply sorting
      let sortedClients = [...clientsData];
      
      if (sortBy === 'name-asc') {
        sortedClients.sort((a, b) => a.client.display_name.localeCompare(b.client.display_name));
      } else if (sortBy === 'name-desc') {
        sortedClients.sort((a, b) => b.client.display_name.localeCompare(a.client.display_name));
      } else if (sortBy === 'recent-desc') {
        sortedClients.sort((a, b) => new Date(b.last_interaction || b.created_at) - new Date(a.last_interaction || a.created_at));
      } else if (sortBy === 'recent-asc') {
        sortedClients.sort((a, b) => new Date(a.last_interaction || a.created_at) - new Date(b.last_interaction || b.created_at));
      }
      
      // Apply filter
      if (filter === 'active') {
        sortedClients = sortedClients.filter(client => client.status === 'active');
      } else if (filter === 'inactive') {
        sortedClients = sortedClients.filter(client => client.status === 'inactive');
      }
      
      setClients(sortedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.client.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CounselorNavbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Your Clients</h1>
            
            <Link 
              href="/counselor/clients/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Client
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Clients
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="sm:w-48">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="recent-desc">Most Recent</option>
                <option value="recent-asc">Least Recent</option>
              </select>
            </div>
            
            <div className="sm:w-48">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No clients found.</p>
              {searchTerm && (
                <p className="mt-2 text-gray-500">Try adjusting your search or filters.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((clientRelationship) => {
                const client = clientRelationship.client;
                return (
                  <Link 
                    href={`/counselor/clients/${client.id}`} 
                    key={clientRelationship.id}
                    className="block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-semibold mr-4">
                          {client.image_url ? (
                            <img src={client.image_url} alt={client.display_name} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            client.display_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{client.display_name}</h3>
                          <p className="text-sm text-gray-500">
                            Client since {format(new Date(client.created_at), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          clientRelationship.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {clientRelationship.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        
                        <span className="text-sm text-gray-500">
                          {client.last_active ? (
                            `Last active: ${format(new Date(client.last_active), 'MMM d, yyyy')}`
                          ) : (
                            'Never active'
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
