import React, { useState, useEffect } from 'react';
import { getFacilities, addFacility, updateFacility, deleteFacility, bulkUploadFacilities, getWards, ZONES } from '../lib/db';
import { Facility, Ward } from '../types';
import { Plus, Trash2, Edit2, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import { SkeletonCard } from '../components/SkeletonCard';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { FormSheet } from '../components/FormSheet';
import { useToast } from '../context/ToastContext';

export function AdminFacilities() {
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const initialFormState: Omit<Facility, 'id'> = {
    type: 'UPHC', name: '', wardId: '',
    medicalOfficerName: '', phone: '', email: '', whatsapp: '',
    latitude: 0, longitude: 0, address: '', parentUphcId: '',
  };
  const [formData, setFormData] = useState<Omit<Facility, 'id'>>(initialFormState);

  useEffect(() => { loadData(); }, []);

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
      if (dataToSave.type === 'UPHC') delete dataToSave.parentUphcId;

      if (editingFacility) {
        await updateFacility(editingFacility.id, dataToSave);
        showToast('Facility updated successfully!');
      } else {
        await addFacility(dataToSave);
        showToast('Facility added successfully!');
      }
      setShowForm(false);
      setEditingFacility(null);
      setFormData({ ...initialFormState, wardId: wards[0]?.id || '' });
      loadData();
    } catch (error) {
      console.error('Error saving facility', error);
      showToast('Failed to save facility.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteFacility(confirmDeleteId);
      showToast('Facility deleted.');
      loadData();
    } catch (error) {
      console.error('Error deleting facility', error);
      showToast('Failed to delete facility.', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const startEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData(facility);
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'UPHC' | 'HWC') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

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
            type, name: row['Facility Name'], wardId: ward.id, parentUphcId,
            medicalOfficerName: row['Medical Officer'], phone: row['Phone'],
            whatsapp: row['WhatsApp'], email: row['Email'],
            latitude: parseFloat(row['Latitude']), longitude: parseFloat(row['Longitude']),
            address: row['Address'] || '',
          });
        });

        if (errors.length > 0) {
          setUploadError(errors.join('\n'));
          return;
        }

        try {
          await bulkUploadFacilities(newFacilities);
          setUploadError(null);
          loadData();
          showToast(`${newFacilities.length} ${type}s uploaded successfully!`);
        } catch (error) {
          console.error(error);
          showToast('Failed to upload facilities to database.', 'error');
        }
      },
    });
  };

  const downloadTemplate = (type: 'UPHC' | 'HWC') => {
    const baseCols = 'Facility Name,Ward Name,Medical Officer,Phone,WhatsApp,Email,Latitude,Longitude,Address';
    const csvContent = type === 'UPHC'
      ? `data:text/csv;charset=utf-8,${baseCols}\nExample UPHC,Example Ward,Dr. Smith,1234567890,1234567890,smith@example.com,11.1085,77.3411,123 Main St`
      : `data:text/csv;charset=utf-8,${baseCols},Parent UPHC Name\nExample HWC,Example Ward,Dr. Jones,0987654321,0987654321,jones@example.com,11.1085,77.3411,456 Side St,Example UPHC`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${type.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uphcs = facilities.filter(f => f.type === 'UPHC');

  const inputClass = 'block w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
  const sectionHeader = (text: string) => (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider col-span-2 pt-2 border-t border-gray-100 mt-1">
      {text}
    </p>
  );

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionHeader('Basic Info')}

        <div>
          <label className={labelClass}>Facility Type</label>
          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as 'UPHC' | 'HWC' })}
            className={inputClass}
          >
            <option value="UPHC">UPHC – Urban Primary Health Centre</option>
            <option value="HWC">HWC – Health & Wellness Centre</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Facility Name</label>
          <input
            type="text" required value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className={inputClass} placeholder="e.g. Gandhipuram UPHC"
          />
        </div>

        <div>
          <label className={labelClass}>Ward</label>
          <select
            required value={formData.wardId}
            onChange={e => setFormData({ ...formData, wardId: e.target.value })}
            className={inputClass}
          >
            <option value="">Select Ward</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {formData.type === 'HWC' && (
          <div>
            <label className={labelClass}>Parent UPHC</label>
            <select
              required value={formData.parentUphcId || ''}
              onChange={e => setFormData({ ...formData, parentUphcId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select Parent UPHC</option>
              {uphcs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}

        {sectionHeader('Contact Details')}

        <div>
          <label className={labelClass}>Medical Officer Name</label>
          <input
            type="text" required value={formData.medicalOfficerName}
            onChange={e => setFormData({ ...formData, medicalOfficerName: e.target.value })}
            className={inputClass} placeholder="e.g. Dr. Rajesh Kumar"
          />
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <input
            type="tel" required value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass} placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label className={labelClass}>WhatsApp Number</label>
          <input
            type="tel" required value={formData.whatsapp}
            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
            className={inputClass} placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input
            type="email" required value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className={inputClass} placeholder="e.g. uphc@tiruppur.gov.in"
          />
        </div>

        {sectionHeader('Location')}

        <div>
          <label className={labelClass}>Latitude</label>
          <input
            type="number" step="any" required value={formData.latitude || ''}
            onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            className={inputClass} placeholder="e.g. 11.1085"
          />
          <p className="text-xs text-gray-400 mt-1">Get from Google Maps → right-click → coordinates</p>
        </div>

        <div>
          <label className={labelClass}>Longitude</label>
          <input
            type="number" step="any" required value={formData.longitude || ''}
            onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            className={inputClass} placeholder="e.g. 77.3411"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address <span className="text-gray-400 font-normal">(Optional)</span></label>
          <textarea
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className={inputClass} rows={2}
            placeholder="Street, locality, landmark..."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button" onClick={() => setShowForm(false)}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white active:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-blue-700"
        >
          {editingFacility ? 'Update Facility' : 'Add Facility'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {/* CSV Controls */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bulk Upload via CSV</p>
        {(['UPHC', 'HWC'] as const).map(type => (
          <div key={type} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
                type === 'UPHC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>{type}</span>
              <span className="text-sm text-gray-700 font-medium">
                {type === 'UPHC' ? 'Urban Primary Health Centres' : 'Health & Wellness Centres'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadTemplate(type)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={`Download ${type} template`}
              >
                <Download className="w-4 h-4" />
              </button>
              <label className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title={`Upload ${type} CSV`}>
                <Upload className="w-4 h-4" />
                <input type="file" accept=".csv" className="hidden" onChange={e => handleFileUpload(e, type)} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Add button */}
      <div className="hidden md:flex justify-end">
        <button
          onClick={() => { setEditingFacility(null); setFormData({ ...initialFormState, wardId: wards[0]?.id || '' }); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Facility
        </button>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl whitespace-pre-line text-sm overflow-auto max-h-48">
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
        title={editingFacility ? 'Edit Facility' : 'Add New Facility'}
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
            {facilities.map(facility => (
              <div key={facility.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{facility.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dr. {facility.medicalOfficerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {wards.find(w => w.id === facility.wardId)?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      facility.type === 'UPHC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {facility.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => startEdit(facility)} className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setConfirmDeleteId(facility.id)} className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {facilities.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-sm text-gray-500">
                No facilities found. Add one or upload a CSV.
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ward</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical Officer</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facilities.map(facility => (
                    <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{facility.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          facility.type === 'UPHC' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {facility.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {wards.find(w => w.id === facility.wardId)?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{facility.medicalOfficerName}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => startEdit(facility)} className="text-blue-600 hover:text-blue-800 mr-4">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(facility.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {facilities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No facilities found. Add one or upload a CSV.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditingFacility(null); setFormData({ ...initialFormState, wardId: wards[0]?.id || '' }); setShowForm(true); }}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete confirmation */}
      <ConfirmSheet
        isOpen={!!confirmDeleteId}
        title="Delete Facility"
        message="This will permanently remove the facility. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
