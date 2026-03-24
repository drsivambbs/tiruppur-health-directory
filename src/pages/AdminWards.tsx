import React, { useState, useEffect } from 'react';
import { getWards, addWard, updateWard, deleteWard, bulkUploadWards, ZONES } from '../lib/db';
import { Ward } from '../types';
import { Plus, Trash2, Edit2, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';

export function AdminWards() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState({ name: '', zoneId: ZONES[0].id });
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadWards();
  }, []);

  async function loadWards() {
    setLoading(true);
    try {
      const data = await getWards();
      setWards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWard) {
        await updateWard(editingWard.id, formData);
      } else {
        await addWard(formData);
      }
      setShowForm(false);
      setEditingWard(null);
      setFormData({ name: '', zoneId: ZONES[0].id });
      loadWards();
    } catch (error) {
      console.error("Error saving ward", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ward?')) {
      try {
        await deleteWard(id);
        loadWards();
      } catch (error) {
        console.error("Error deleting ward", error);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newWards: Omit<Ward, 'id'>[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index) => {
          const zone = ZONES.find(z => z.name.toLowerCase() === row['Zone Name']?.toLowerCase());
          if (!zone) {
            errors.push(`Row ${index + 1}: Invalid Zone Name "${row['Zone Name']}"`);
            return;
          }
          if (!row['Ward Name']) {
            errors.push(`Row ${index + 1}: Missing Ward Name`);
            return;
          }
          newWards.push({
            name: row['Ward Name'],
            zoneId: zone.id
          });
        });

        if (errors.length > 0) {
          setUploadError(errors.join('\n'));
          return;
        }

        if (window.confirm(`Ready to import ${newWards.length} wards. Continue?`)) {
          try {
            await bulkUploadWards(newWards);
            setUploadError(null);
            loadWards();
            alert('Upload successful');
          } catch (error) {
            console.error(error);
            setUploadError('Failed to upload wards to database.');
          }
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Ward Name,Zone Name\nExample Ward,North";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wards_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading wards...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Wards</h2>
        <div className="flex space-x-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </button>
          <label className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={() => {
              setEditingWard(null);
              setFormData({ name: '', zoneId: ZONES[0].id });
              setShowForm(true);
            }}
            className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ward
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => {
          setEditingWard(null);
          setFormData({ name: '', zoneId: ZONES[0].id });
          setShowForm(true);
        }}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md whitespace-pre-line">
          <h4 className="font-bold mb-2">Upload Errors:</h4>
          {uploadError}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingWard ? 'Edit Ward' : 'Add New Ward'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ward Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zone</label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                {ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {wards.map((ward) => (
              <tr key={ward.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ward.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ZONES.find(z => z.id === ward.zoneId)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingWard(ward);
                      setFormData({ name: ward.name, zoneId: ward.zoneId });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ward.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {wards.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No wards found. Add one or upload a CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
