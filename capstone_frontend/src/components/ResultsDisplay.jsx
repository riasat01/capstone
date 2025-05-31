import { BarChart2, Download } from "lucide-react";
import MetricCard from "./MetricCard";

const ResultsDisplay = ({ metricsData, onDownloadCsv }) => {
  if (!metricsData) return null;

  const overallMetrics = [
    { label: "Accuracy", value: metricsData.accuracy },
    { label: "F1-Score (Weighted)", value: metricsData.f1_score },
    { label: "Precision (Weighted)", value: metricsData.precision },
    { label: "Recall (Weighted)", value: metricsData.recall },
  ];

  const classWiseMetrics = Object.entries(metricsData.class_wise || {})
    .filter(([key]) => key !== 'accuracy' && key !== 'macro avg' && key !== 'weighted avg'); // Filter out overall averages

  const macroAvg = metricsData.class_wise['macro avg'];
  const weightedAvg = metricsData.class_wise['weighted avg'];

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
        <BarChart2 className="w-7 h-7 mr-3 text-green-500" /> Model Performance Metrics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overallMetrics.map((metric, index) => (
          <MetricCard key={index} label={metric.label} value={metric.value} />
        ))}
        <MetricCard label="Processing Time" value={metricsData.processing_time} isTime={true} />
      </div>

      {(macroAvg || weightedAvg) && (
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200 mb-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">Average Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {macroAvg && (
                    <div>
                        <p className="text-md font-medium text-purple-700">Macro Average:</p>
                        <p className="text-sm text-purple-900">Precision: {(macroAvg.precision * 100).toFixed(2)}%</p>
                        <p className="text-sm text-purple-900">Recall: {(macroAvg.recall * 100).toFixed(2)}%</p>
                        <p className="text-sm text-purple-900">F1-Score: {(macroAvg['f1-score'] * 100).toFixed(2)}%</p>
                    </div>
                )}
                {weightedAvg && (
                    <div>
                        <p className="text-md font-medium text-purple-700">Weighted Average:</p>
                        <p className="text-sm text-purple-900">Precision: {(weightedAvg.precision * 100).toFixed(2)}%</p>
                        <p className="text-sm text-purple-900">Recall: {(weightedAvg.recall * 100).toFixed(2)}%</p>
                        <p className="text-sm text-purple-900">F1-Score: {(weightedAvg['f1-score'] * 100).toFixed(2)}%</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {classWiseMetrics.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Class-wise Metrics:</h3>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Class</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Precision</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Recall</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">F1-Score</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classWiseMetrics.map(([label, metrics]) => (
                  <tr key={label} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{label}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{(metrics.precision * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{(metrics.recall * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{(metrics['f1-score'] * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metrics.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {onDownloadCsv && (
        <div className="text-center mt-6">
          <button
            onClick={onDownloadCsv}
            className="px-6 py-2 rounded-full text-lg font-semibold bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center mx-auto"
          >
            <Download className="w-5 h-5 mr-2" /> Download Predictions CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;