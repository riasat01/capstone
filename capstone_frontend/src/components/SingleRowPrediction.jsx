import { Lightbulb, XCircle } from "lucide-react";
import { useState } from "react";
import FileUpload from "./FileUpload";

const SingleRowPrediction = ({ backendUrl, isModelTrained }) => {
  const [singleRowFile, setSingleRowFile] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  const handleSingleRowPredict = async () => {
    if (!singleRowFile) {
      setPredictError("Please upload a single row CSV file.");
      return;
    }
    if (!isModelTrained) {
        setPredictError("Model has not been trained yet. Please process the main data first.");
        return;
    }

    setPredictError(null);
    setPredictionResult(null);
    setIsPredicting(true);

    try {
      const formData = new FormData();
      formData.append('single_file', singleRowFile);

      const response = await fetch(`${backendUrl}/predict-single`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPredictionResult(data.prediction);

    } catch (err) {
      console.error("Error predicting single row:", err);
      setPredictError(`Prediction error: ${err.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
        <Lightbulb className="w-7 h-7 mr-3 text-yellow-500" /> Predict Single Row
      </h2>
      <p className="text-gray-700 text-center mb-6">
        Upload a CSV file containing a single row of features (without 'Label') to get a prediction.
      </p>
      <div className="flex justify-center mb-6">
        <FileUpload
          id="single-row-file"
          label="Single Row Data"
          onFileChange={setSingleRowFile}
          file={singleRowFile}
        />
      </div>

      {predictError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 flex items-center justify-center">
          <XCircle className="w-5 h-5 mr-2" />
          <span className="block sm:inline">{predictError}</span>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleSingleRowPredict}
          disabled={isPredicting || !singleRowFile || !isModelTrained}
          className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out
            ${isPredicting || !singleRowFile || !isModelTrained
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:shadow-xl active:bg-indigo-800'
            }
          `}
        >
          {isPredicting ? 'Predicting...' : 'Predict Label'}
        </button>
      </div>

      {predictionResult !== null && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-lg font-semibold text-green-800">Predicted Label:</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{predictionResult}</p>
        </div>
      )}
    </div>
  );
};


export default SingleRowPrediction;