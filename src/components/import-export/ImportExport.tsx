import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

export const ImportExport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importType, setImportType] = useState<'vms' | 'customers' | 'contracts'>('vms');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      showToast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(value => value !== ''));

        setPreviewData(data);
        showToast.success(`Loaded ${data.length} rows for preview`);
      } catch (error) {
        showToast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      showToast.warning('No data to import');
      return;
    }

    try {
      setImporting(true);
      
      // Mock import process - in production, this would validate and insert data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast.success(`Successfully imported ${previewData.length} ${importType}`);
      setPreviewData([]);
    } catch (error) {
      showToast.error('Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  const exportTemplate = (type: string) => {
    const templates = {
      vms: 'vm_name,cpu,ram,storage,services,cost,status,public_ip,management_ip,remarks',
      customers: 'department_name,contact_name,contact_email,contact_number',
      contracts: 'contract_number,contract_name,service_start_date,service_end_date,value'
    };

    const content = templates[type as keyof typeof templates];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success(`${type} template downloaded`);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-gray-900">Import & Export Data</h2>

      {/* Export Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" onClick={() => exportTemplate('vms')}>
            <Download className="w-4 h-4 mr-2" />
            Export VMs Template
          </Button>
          <Button variant="outline" onClick={() => exportTemplate('customers')}>
            <Download className="w-4 h-4 mr-2" />
            Export Customers Template
          </Button>
          <Button variant="outline" onClick={() => exportTemplate('contracts')}>
            <Download className="w-4 h-4 mr-2" />
            Export Contracts Template
          </Button>
        </div>
      </Card>

      {/* Import Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vms">VMs</option>
              <option value="customers">Customers</option>
              <option value="contracts">Contracts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload CSV file or drag and drop</p>
              </label>
            </div>
          </div>

          {/* Preview Data */}
          {previewData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Preview Data ({previewData.length} rows)</h4>
                <Button 
                  onClick={handleImport}
                  loading={importing}
                  variant="success"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      {Object.keys(previewData[0] || {}).map(header => (
                        <th key={header} className="text-left p-2 font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="p-2 text-gray-600">
                            {String(value).substring(0, 20)}
                            {String(value).length > 20 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <p className="text-center text-gray-500 mt-2">
                    ... and {previewData.length - 5} more rows
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Guidelines */}
      <Card className="p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Import Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download the template first to ensure correct format</li>
              <li>• CSV files should use comma separators</li>
              <li>• Required fields must not be empty</li>
              <li>• Date fields should be in YYYY-MM-DD format</li>
              <li>• Preview your data before importing</li>
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};