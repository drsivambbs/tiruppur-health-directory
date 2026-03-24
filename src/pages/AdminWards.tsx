import React, { useState, useEffect } from 'react';
import { getWards, addWard, updateWard, deleteWard, bulkUploadWards, ZONES } from '../lib/db';
import { Ward } from '../types';
import { Plus, Trash2, Edit2, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import { SkeletonCard } from '../components/SkeletonCard';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { FormSheet } from '../components/FormSheet';
import { useToast } from '../context/ToastContext';

export function AdminWards() {
  const { showToast } = useToast();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState({ name: '', zoneId: ZONES[0].id });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => { loadWards(); }, []);

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
        showToast('Ward updated successfully!');
      } else {
        await addWard(formData);
        showToast('Ward added successfully!');
      }
      setShowForm(false);
      setEditingWard(null);
      setFormData({ name: '', zoneId: ZONES[0].id });
      loadWards();
    } catch (error) {
      console.error('Error saving ward', error);
      showToast('Failed to save ward.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteWard(confirmDeleteId);
      showToast('Ward deleted.');
      loadWards();
    } catch (error) {
      console.error('Error deleting ward', error);
      showToast('Failed to delete ward.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const startEdit = (ward: Ward) => {
    setEditingWard(ward);
    setFormData({ name: ward.name, zoneId: ward.zoneId });
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

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
          newWards.push({ name: row['Ward Name'], zoneId: zone.id });
        });

        if (errors.length > 0) {
          setUploadError(errors.join('\n'));
          return;
        }

        try {
          await bulkUploadWards(newWards);
          setUploadError(null);
          loadWards();
          showToast(`${newWards.length} wards uploaded successfully!`);
        } catch (error) {
          console.error(error);
          showToast('Failed to upload wards to database.', 'error');
        }
      },
    });
  };

  const downloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Ward Name,Zone Name\nExample Ward,North';
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'wards_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ward Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="block w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
          placeholder="e.g. Gandhipuram Ward"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone</label>
        <select
          value={formData.zoneId}
          onChange={e => setFormData({ ...formData, zoneId: e.target.value })}
          className="block w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
        >
          {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white active:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-blue-700"
        >
          {editingWard ? 'Update Ward' : 'Add Ward'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Template</span>
        </button>
        <label className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload CSV</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
        <button
          onClick={() => { setEditingWard(null); setFormData({ name: '', zoneId: ZONES[0].id }); setShowForm(true); }}
          className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Ward
        </button>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl whitespace-pre-line text-sm">
          <p className="font-semibold mb-1">Upload Errors:</p>
          {uploadError}
          <button onClick={() => setUploadError(null)} className="mt-2 text-xs underline text-red-500 block">
            Dismiss
          </button>
        </div>
      )}

      {/* Form Sheet */}
      <FormSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingWard ? 'Edit Ward' : 'Add New Ward'}
      >
        {formContent}
      </FormSheet>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {wards.map(ward => (
              <div key={ward.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{ward.name}</p>
                  <span className="inline-block mt-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                    {ZONES.find(z => z.id === ward.zoneId)?.name} Zone
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => startEdit(ward)} className="text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDeleteId(ward.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {wards.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-sm text-gray-500">
                No wards found. Add one or upload a CSV.
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ward Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {wards.map(ward => (
                  <tr key={ward.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{ward.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        {ZONES.find(z => z.id === ward.zoneId)?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEdit(ward)} className="text-blue-600 hover:text-blue-800 mr-4">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(ward.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {wards.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      No wards found. Add one or upload a CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditingWard(null); setFormData({ name: '', zoneId: ZONES[0].id }); setShowForm(true); }}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete confirmation */}
      <ConfirmSheet
        isOpen={!!confirmDeleteId}
        title="Delete Ward"
        message="This will permanently remove the ward. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
