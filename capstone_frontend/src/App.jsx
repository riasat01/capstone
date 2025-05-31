import { useCallback, useState } from "react";
import FileUpload from "./components/FileUpload";
import LoadingIndicator from "./components/LoadingIndicator";
import ResultsDisplay from "./components/ResultsDisplay";
import { XCircle } from 'lucide-react';
import SingleRowPrediction from "./components/SingleRowPrediction";

const App = () => {
  const [sourceFile, setSourceFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [columnsFile, setColumnsFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTimeEstimate, setProcessingTimeEstimate] = useState(null);
  const [error, setError] = useState(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [metricsData, setMetricsData] = useState(null); // New state for metrics
  const [predictionsCsvContent, setPredictionsCsvContent] = useState(null); // New state for CSV string

  const backendUrl = "http://127.0.0.1:8000"; // Your FastAPI backend URL

  const handleProcess = async () => {
    if (!sourceFile || !targetFile || !columnsFile) {
      setError("Please upload all three required CSV files.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setProcessingTimeEstimate("calculating...");
    setIsModelTrained(false); // Reset trained status
    setMetricsData(null); // Clear previous metrics
    setPredictionsCsvContent(null); // Clear previous CSV content

    try {
      const formData = new FormData();
      formData.append('source_file', sourceFile);
      formData.append('target_file', targetFile);
      formData.append('columns_file', columnsFile);

      const response = await fetch(`${backendUrl}/process-data`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Expect JSON response
      setMetricsData(data.metrics); // Store metrics
      setPredictionsCsvContent(data.csv); // Store CSV content as string
      
      setIsModelTrained(true); // Model is now trained
      setError(null); // Clear any previous error

    } catch (err) {
      console.error("Error during processing:", err);
      setError(`An error occurred during processing: ${err.message}. Please ensure the backend is running and accessible.`);
      setIsModelTrained(false); // Ensure model trained status is false on error
    } finally {
      setIsLoading(false);
      setProcessingTimeEstimate(null);
    }
  };

  // Function to download CSV from string content
  const downloadCsv = useCallback(() => {
    if (predictionsCsvContent) {
      const blob = new Blob([predictionsCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'predictions.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [predictionsCsvContent]);

  return (
    <div className="font-inter min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-6 sm:p-10 border border-gray-100">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          Unsupervised Domain Adaptation App
        </h1>

        <p className="text-lg text-gray-700 text-center mb-10">
          Upload your source, target, and useful columns CSV files to train the model and see performance metrics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <FileUpload
            id="source-file"
            label="Source Data"
            onFileChange={setSourceFile}
            file={sourceFile}
            required
          />
          <FileUpload
            id="target-file"
            label="Target Data"
            onFileChange={setTargetFile}
            file={targetFile}
            required
          />
          <FileUpload
            id="columns-file"
            label="Useful Columns"
            onFileChange={setColumnsFile}
            file={columnsFile}
            required
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-center">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleProcess}
            disabled={isLoading || !sourceFile || !targetFile || !columnsFile}
            className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl active:bg-blue-800'
              }
            `}
          >
            {isLoading ? 'Processing...' : 'Train Model & Get Metrics'}
          </button>
        </div>

        <LoadingIndicator isLoading={isLoading} timeEstimate={processingTimeEstimate} />
        
        {/* Display Results and Download CSV option */}
        {!isLoading && metricsData && (
          <ResultsDisplay metricsData={metricsData} onDownloadCsv={downloadCsv} />
        )}

        {/* Separator */}
        <div className="my-10 border-t-2 border-gray-200"></div>

        {/* Single Row Prediction Section */}
        <SingleRowPrediction backendUrl={backendUrl} isModelTrained={isModelTrained} />

      </div>

      {/* Tailwind CSS CDN and Font */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
    </div>
  );
};


export default App;