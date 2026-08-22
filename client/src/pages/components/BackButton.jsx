import { useNavigate } from "react-router-dom";
import backButton from "../../assets/back-button.png";
import "./BackButton.css";

function BackButton() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/");

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  };

  return (
    <button
      type="button"
      className="back-image-button"
      onClick={goBack}
      aria-label="Back to home"
    >
      <img src={backButton} alt="Back" />
    </button>
  );
}

export default BackButton;