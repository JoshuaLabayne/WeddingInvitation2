import "./LoadingSpinner.css";

function LoadingSpinner() {
  return (
    <div className="page-loader">
      <div className="spinner"></div>

      <p>Loading...</p>
    </div>
  );
}

export default LoadingSpinner;