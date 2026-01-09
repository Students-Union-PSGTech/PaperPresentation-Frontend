import { FileText, Upload, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FileManager() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (files.length >= 3) {
        alert("Maximum 3 files allowed.");
        return;
      }
      setFiles([...files, e.target.files[0]]);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Cookies are sent automatically with axios.defaults.withCredentials = true
      // No need to manually add Authorization header
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        // Description must be alphanumeric and max 50 characters
        formData.append('description', 'research_paper_submission');
        formData.append('paperId', new URLSearchParams(window.location.search).get('paperId') || 'PRP01');

        const response = await axios.post(
          `${API_BASE_URL}/api/auth/user/upload-file`,
          formData
        );

        if (response.data.success) {
          console.log('Paper submitted successfully:', response.data);
        }
      }

      // Clear files after successful submission
      setFiles([]);
      alert('Papers submitted successfully!');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || err.message 
        : 'Failed to submit papers';
      setError(errorMessage);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-white p-6 border-l border-gray-200 flex flex-col">
      <h3 className="font-semibold text-gray-800 mb-6">Research Papers</h3>

      {/* Upload Zone */}
      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition mb-6">
        <Upload className="text-gray-400 mb-2" size={24} />
        <span className="text-sm text-gray-500">Click to upload PDF</span>
        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} />
      </label>

      {/* File List */}
      <div className="flex-1 space-y-3">
        {files.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-10">No files uploaded yet.</p>
        )}
        
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
            <div className="p-2 bg-blue-100 text-blue-600 rounded">
              <FileText size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-green-600">Ready to submit</p>
            </div>
            <button 
              onClick={() => setFiles(files.filter((_, i) => i !== index))}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button 
        onClick={handleSubmit}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={files.length === 0 || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Research'}
      </button>
    </div>
  );
}