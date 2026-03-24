import React, { useState, useEffect } from 'react';
import { getFacilities, addFacility, updateFacility, deleteFacility, bulkUploadFacilities, getWards, ZONES } from '../lib/db';
import { Facility, Ward } from '../types';
import { Plus, Trash2, Edit2, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';

export function AdminFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initialFormState: Omit<Facility, 'id'> = {
    type: 'UPHC',
    name: '',
    wardId: '',
    medicalOfficerName: '',
    phone: '',
    email: '',
    whatsapp: '',
    latitude: 0,
    longitude: 0,
    address: '',
    parentUphcId: ''
  };
  const [formData, setFormData] = useState<Omit<Facility, 'id'>>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [fData, wData] = await Promise.all([getFacilities(), getWards()]);
      setFacilities(fData);
      setWards(wData);
      if (wData.length > 0 && !formData.wardId) {
        setFormData(prev => ({ ...prev, wardId: wData[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      if (dataToSave.type === 'UPHC') {
        delete dataToSave.parentUphcId;
      }
      
      if (editingFacility) {
        await updateFacility(editingFacility.id, dataToSave);
      } else {
        await addFacility(dataToSave);
      }
      setShowForm(false);
      setEditingFacility(null);
      setFormData({ ...initialFormState, wardId: wards[0]?.id || '' });
      loadData();
    } catch (error) {
      console.error("Error saving facility", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        await deleteFacility(id);
        loadData();
      } catch (error) {
        console.error("Error deleting facility", error);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'UPHC' | 'HWC') => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newFacilities: Omit<Facility, 'id'>[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index) => {
          const ward = wards.find(w => w.name.toLowerCase() === row['Ward Name']?.toLowerCase());
          if (!ward) {
            errors.push(`Row ${index + 1}: Invalid Ward Name "${row['Ward Name']}"`);
            return;
          }

          let parentUphcId = undefined;
          if (type === 'HWC') {
            const parent = facilities.find(f => f.type === 'UPHC' && f.name.toLowerCase() === row['Parent UPHC Name']?.toLowerCase());
            if (!parent) {
              errors.push(`Row ${index + 1}: Invalid Parent UPHC Name "${row['Parent UPHC Name']}"`);
              return;
            }
            parentUphcId = parent.id;
          }

          newFacilities.push({
            type,
            name: row['Facility Name'],
            wardId: ward.id,
            parentUphcId,
            medicalOfficerName: row['Medical Officer'],
            phone: row['Phone'],
            whatsapp: row['WhatsApp'],
            email: row['Email'],
            latitude: parseFloat(row['Latitude']),
            longitude: parseFloat(row['Longitude']),
            address: row['Address'] || ''
          });
        });

        if (errors.length > 0) {
          setUploadError(errors.join('\n'));
          return;
        }

        if (window.confirm(`Ready to import ${newFacilities.length} ${type}s. Continue?`)) {
          try {
            await bulkUploadFacilities(newFacilities);
            setUploadError(null);
            loadData();
            alert('Upload successful');
          } catch (error) {
            console.error(error);
            setUploadError('Failed to upload facilities to database.');
          }
        }
      }
    });
  };

  const downloadTemplate = (type: 'UPHC' | 'HWC') => {
    const baseCols = "Facility Name,Ward Name,Medical Officer,Phone,WhatsApp,Email,Latitude,Longitude,Address";
    const csvContent = type === 'UPHC' 
      ? `data:text/csv;charset=utf-8,${baseCols}\nExample UPHC,Example Ward,Dr. Smith,1234567890,1234567890,smith@example.com,11.1085,77.3411,123 Main St`
      : `data:text/csv;charset=utf-8,${baseCols},Parent UPHC Name\nExample HWC,Example Ward,Dr. Jones,0987654321,0987654321,jones@example.com,11.1085,77.3411,456 Side St,Example UPHC`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading facilities...</div>;

  const uphcs = facilities.filter(f => f.type === 'UPHC');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manage Facilities</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-2 py-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">UPHC CSV</span>
            <button onClick={() => downloadTemplate('UPHC')} className="p-1 text-gray-500 hover:text-blue-600"><Download className="w-4 h-4" /></button>
            <label className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'UPHC')} />
            </label>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-2 py-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">HWC CSV</span>
            <button onClick={() => downloadTemplate('HWC')} className="p-1 text-gray-500 hover:text-blue-600"><Download className="w-4 h-4" /></button>
            <label className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'HWC')} />
            </label>
          </div>
          <button
            onClick={() => {
              setEditingFacility(null);
              setFormData({ ...initialFormState, wardId: wards[0]?.id || '' });
              setShowForm(true);
            }}
            className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Facility
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => {
          setEditingFacility(null);
          setFormData({ ...initialFormState, wardId: wards[0]?.id || '' });
          setShowForm(true);
        }}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md whitespace-pre-line overflow-auto max-h-64">
          <h4 className="font-bold mb-2">Upload Errors:</h4>
          {uploadError}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingFacility ? 'Edit Facility' : 'Add New Facility'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'UPHC' | 'HWC' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value="UPHC">UPHC</option>
                <option value="HWC">HWC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Facility Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ward</label>
              <select
                required
                value={formData.wardId}
                onChange={(e) => setFormData({ ...formData, wardId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                {wards.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            {formData.type === 'HWC' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent UPHC</label>
                <select
                  required
                  value={formData.parentUphcId || ''}
                  onChange={(e) => setFormData({ ...formData, parentUphcId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">Select Parent UPHC</option>
                  {uphcs.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical Officer Name</label>
              <input
                type="text"
                required
                value={formData.medicalOfficerName}
                onChange={(e) => setFormData({ ...formData, medicalOfficerName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email ID</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Officer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facility.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${facility.type === 'UPHC' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {facility.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {wards.find(w => w.id === facility.wardId)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facility.medicalOfficerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingFacility(facility);
                        setFormData(facility);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {facilities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No facilities found. Add one or upload a CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
