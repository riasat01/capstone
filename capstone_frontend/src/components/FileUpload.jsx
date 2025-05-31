import { UploadCloud, FileText } from 'lucide-react';

const FileUpload = ({ id, label, onFileChange, file, required = false }) => {
  const handleFileChange = (event) => {
    onFileChange(event.target.files[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors duration-200 w-full max-w-sm mx-auto bg-white shadow-sm">
      <label htmlFor={id} className="text-center cursor-pointer">
        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">{label} (CSV)</p>
        <input
          id={id}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          required={required}
        />
      </label>
      {file && (
        <div className="mt-3 flex items-center text-sm text-gray-700">
          <FileText className="w-4 h-4 mr-2 text-blue-500" />
          <span>{file.name}</span>
        </div>
      )}
    </div>
  );
};


export default FileUpload;