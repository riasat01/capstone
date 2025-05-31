import { Loader } from 'lucide-react';

const LoadingIndicator = ({ isLoading, timeEstimate }) => {
  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-md mt-8">
      <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <p className="text-lg font-semibold text-blue-700">Processing your data...</p>
      {timeEstimate && (
        <p className="text-sm text-blue-600 mt-2">
          Estimated time: {timeEstimate} seconds
        </p>
      )}
      <p className="text-xs text-gray-500 mt-4">
        (Data is being sent to the backend for processing.)
      </p>
    </div>
  );
};


export default LoadingIndicator;