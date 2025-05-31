const MetricCard = ({ label, value, isTime = false }) => (
  <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 text-center">
    <p className="text-sm font-medium text-blue-700">{label}</p>
    <p className="text-3xl font-bold text-blue-900 mt-1">
      {isTime ? `${value.toFixed(2)}s` : `${(value * 100).toFixed(2)}%`}
    </p>
  </div>
);


export default MetricCard;