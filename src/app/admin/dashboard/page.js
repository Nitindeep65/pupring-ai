'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      console.log('Fetched clients data:', data.clients);
      // Log the first client to see its structure
      if (data.clients && data.clients.length > 0) {
        console.log('First client structure:', data.clients[0]);
        console.log('Pet images:', data.clients[0].petImages);
        console.log('Composite pendant:', data.clients[0].compositePendantPreview);
      }
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/admin/login');
  };

  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      // Refresh the client list
      await fetchClients();
      setSelectedClient(null);
    } catch (err) {
      alert('Error deleting client: ' + err.message);
    }
  };

  const downloadImage = async (url, filename) => {
    try {
      // Fetch the image
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  };

  const downloadAllImagesAsZip = async (client) => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();
      const folderName = `${client.clientName}_${client.clientId}`;
      const folder = zip.folder(folderName);
      
      console.log('Creating zip for client:', client.clientName);
      
      // Helper function to fetch and add image to zip
      const addImageToZip = async (url, filename) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          folder.file(filename, blob);
          console.log('Added to zip:', filename);
        } catch (error) {
          console.error(`Failed to add ${filename} to zip:`, error);
        }
      };
      
      // Add pet images for multi-pet pendants
      if (client.petImages && client.petImages.length > 0) {
        for (let i = 0; i < client.petImages.length; i++) {
          const pet = client.petImages[i];
          const petName = pet.petName || `pet${i+1}`;
          
          if (pet.originalImage?.url) {
            await addImageToZip(pet.originalImage.url, `${petName}_original.jpg`);
          }
          if (pet.processedImage?.url) {
            await addImageToZip(pet.processedImage.url, `${petName}_processed.png`);
          }
          if (pet.engravingImage?.url) {
            await addImageToZip(pet.engravingImage.url, `${petName}_engraved.png`);
          }
        }
      }
      
      // Add composite pendant preview
      if (client.compositePendantPreview?.url) {
        await addImageToZip(client.compositePendantPreview.url, `${client.pendantType}_pendant_composite.jpg`);
      }
      
      // Add single pendant images (backward compatibility)
      if (client.originalImage?.url) {
        await addImageToZip(client.originalImage.url, 'original.jpg');
      }
      if (client.processedImage?.url && !client.petImages?.length) {
        await addImageToZip(client.processedImage.url, 'processed.png');
      }
      if (client.engravingImage?.url && !client.petImages?.length) {
        await addImageToZip(client.engravingImage.url, 'engraved.png');
      }
      if (client.locketPreview?.url && !client.compositePendantPreview?.url) {
        await addImageToZip(client.locketPreview.url, 'locket_preview.jpg');
      }
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);
      
      console.log('Zip file created and downloaded successfully');
      
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try downloading images individually.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage client orders and images</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Total Clients: {clients.length}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by client name, ID, or pet name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchClients}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Completed</p>
              <p className="text-2xl font-bold">
                {clients.filter(c => c.processingStatus === 'completed').length}
              </p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Processing</p>
              <p className="text-2xl font-bold">
                {clients.filter(c => c.processingStatus === 'processing').length}
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Today&apos;s Orders</p>
              <p className="text-2xl font-bold">
                {clients.filter(c => 
                  new Date(c.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Client ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Client Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Pendant Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Processed Images</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                        {client.clientId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {client.clientName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
                        {client.pendantType || 'single'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(client.processingStatus)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {client.engravingImage?.url && (
                          <div className="relative group">
                            <img 
                              src={client.engravingImage.url} 
                              alt="Engraving" 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => window.open(client.engravingImage.url, '_blank')}
                            />
                            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Standard Engraving
                            </span>
                          </div>
                        )}
                        {client.locketPreview?.url && (
                          <div className="relative group">
                            <img 
                              src={client.locketPreview.url} 
                              alt="Locket" 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => window.open(client.locketPreview.url, '_blank')}
                            />
                            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Locket Preview
                            </span>
                          </div>
                        )}
                        {!client.engravingImage?.url && !client.locketPreview?.url && client.processedImage?.url && (
                          <div className="relative group">
                            <img 
                              src={client.processedImage.url} 
                              alt="Processed" 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => window.open(client.processedImage.url, '_blank')}
                            />
                            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Processed
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          console.log('Selected client:', client);
                          console.log('Client petImages:', client.petImages);
                          console.log('Client compositePendantPreview:', client.compositePendantPreview);
                          setSelectedClient(client);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No clients found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Client Details</h2>
                  <p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {selectedClient.clientName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Client Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">ID:</span> {selectedClient.clientId}</p>
                    <p><span className="font-medium">Name:</span> {selectedClient.clientName}</p>
                    <p><span className="font-medium">Pendant Type:</span> <span className="capitalize">{selectedClient.pendantType || 'single'}</span></p>
                    <p><span className="font-medium">Pet Name:</span> {selectedClient.petName || 'Not specified'}</p>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedClient.processingStatus)}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(selectedClient.createdAt)}</p>
                    <p><span className="font-medium">Updated:</span> {formatDate(selectedClient.updatedAt)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Images</h3>
                  
                  {/* Display pet images for multi-pet pendants */}
                  {selectedClient.petImages && selectedClient.petImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Individual Pet Images:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedClient.petImages.map((pet, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                              {pet.petName || `Pet ${index + 1}`}
                            </p>
                            <div className="space-y-2">
                              {pet.engravingImage?.url && (
                                <div className="relative group">
                                  <img
                                    src={pet.engravingImage.url}
                                    alt={`${pet.petName} Engraving`}
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(pet.engravingImage.url, '_blank')}
                                  />
                                  <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1 rounded">Engraved</span>
                                </div>
                              )}
                              {pet.processedImage?.url && (
                                <div className="relative group">
                                  <img
                                    src={pet.processedImage.url}
                                    alt={`${pet.petName} Processed`}
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(pet.processedImage.url, '_blank')}
                                  />
                                  <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1 rounded">Processed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Display composite pendant preview for multi-pet pendants */}
                  {selectedClient.compositePendantPreview?.url && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Composite Pendant Preview:</p>
                      <div className="relative group">
                        <img
                          src={selectedClient.compositePendantPreview.url}
                          alt="Composite Pendant Preview"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(selectedClient.compositePendantPreview.url, '_blank')}
                        />
                        <button
                          onClick={() => downloadImage(selectedClient.compositePendantPreview.url, `${selectedClient.clientId}-composite-pendant.jpg`)}
                          className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Display single pendant images (backward compatibility) */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedClient.engravingImage?.url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Standard Engraving</p>
                        <div className="relative group">
                          <img
                            src={selectedClient.engravingImage.url}
                            alt="Standard Engraving"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                            onClick={() => window.open(selectedClient.engravingImage.url, '_blank')}
                          />
                          <button
                            onClick={() => downloadImage(selectedClient.engravingImage.url, `${selectedClient.clientId}-engraving.png`)}
                            className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedClient.locketPreview?.url && !selectedClient.compositePendantPreview?.url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Locket Preview</p>
                        <div className="relative group">
                          <img
                            src={selectedClient.locketPreview.url}
                            alt="Locket Preview"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                            onClick={() => window.open(selectedClient.locketPreview.url, '_blank')}
                          />
                          <button
                            onClick={() => downloadImage(selectedClient.locketPreview.url, `${selectedClient.clientId}-locket.png`)}
                            className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {!selectedClient.engravingImage?.url && !selectedClient.locketPreview?.url && selectedClient.processedImage?.url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Processed</p>
                        <div className="relative group">
                          <img
                            src={selectedClient.processedImage.url}
                            alt="Processed"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                            onClick={() => window.open(selectedClient.processedImage.url, '_blank')}
                          />
                          <button
                            onClick={() => downloadImage(selectedClient.processedImage.url, `${selectedClient.clientId}-processed.png`)}
                            className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedClient.originalImage?.url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original</p>
                        <div className="relative group">
                          <img
                            src={selectedClient.originalImage.url}
                            alt="Original"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90"
                            onClick={() => window.open(selectedClient.originalImage.url, '_blank')}
                          />
                          <button
                            onClick={() => downloadImage(selectedClient.originalImage.url, `${selectedClient.clientId}-original.png`)}
                            className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={() => downloadAllImagesAsZip(selectedClient)}
                  disabled={downloadingZip}
                  className={`px-4 py-2 ${downloadingZip ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors flex items-center gap-2`}
                >
                  {downloadingZip ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating ZIP...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Download All Images (ZIP)
                    </>
                  )}
                </button>
                
                {selectedClient.processingStatus === 'completed' && (
                  <button
                    onClick={() => handleDeleteClient(selectedClient._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete Client
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}