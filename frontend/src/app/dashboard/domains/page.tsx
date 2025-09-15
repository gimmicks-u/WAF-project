'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import domainsService, { Domain, CreateDomainDto } from '@/services/domains';
import { 
  Plus, 
  Globe, 
  Server, 
  CheckCircle, 
  Clock, 
  XCircle,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';

export default function DomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<CreateDomainDto>({
    domain: '',
    origin_ip: ''
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const data = await domainsService.getDomains();
      setDomains(data);
    } catch (error: any) {
      console.error('Failed to fetch domains:', error);
      if (error.response?.status === 401) {
        router.push('/');
      } else {
        setError('Failed to load domains');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await domainsService.createDomain(formData);
      setSuccess('Domain added successfully!');
      setShowAddModal(false);
      setFormData({ domain: '', origin_ip: '' });
      fetchDomains();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add domain');
    }
  };

  const handleDeleteDomain = async () => {
    if (!selectedDomain) return;
    
    try {
      await domainsService.deleteDomain(selectedDomain.id);
      setSuccess('Domain deleted successfully!');
      setShowDeleteModal(false);
      setSelectedDomain(null);
      fetchDomains();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete domain');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enabled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enabled
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Disabled
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Management</h1>
        <p className="text-gray-600">Manage your protected domains and their configurations</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Domain Button (hidden when a domain already exists) */}
      {domains.length === 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </button>
        </div>
      )}

      {/* Domains List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No domains</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new domain.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {domains.map((domain) => (
              <li key={domain.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-blue-600 truncate">
                          {domain.domain}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Server className="h-4 w-4 mr-1" />
                          Origin: {domain.origin_ip}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between sm:mt-0 sm:ml-6">
                      <div className="mr-6">
                        {getStatusBadge(domain.status)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/domains/${domain.id}`)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDomain(domain);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add New Domain
                  </h3>
                  <form onSubmit={handleAddDomain} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="example.com"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="origin_ip" className="block text-sm font-medium text-gray-700">
                        Origin Server IP
                      </label>
                      <input
                        type="text"
                        id="origin_ip"
                        value={formData.origin_ip}
                        onChange={(e) => setFormData({ ...formData, origin_ip: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="192.168.1.1"
                        required
                      />
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Add Domain
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDomain && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Domain
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the domain <strong>{selectedDomain.domain}</strong>? 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteDomain}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDomain(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
