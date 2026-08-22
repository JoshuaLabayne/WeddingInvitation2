import "./Venue.css";
import entourageBack from "../assets/entourage-back.png";
import BackButton from "./components/BackButton.jsx";

function Venue() {
  return (
    <main
      className="venue-page"
      style={{
        backgroundImage: `url(${entourageBack})`,
      }}
    >
      {/* BACK BUTTON */}
      <BackButton />

      <div className="venue-overlay"></div>

      <section className="venue-content">
        <h1 className="venue-heading">
          Venue
        </h1>

        <div className="venue-map-wrapper">
          <iframe
            className="venue-map"
            title="Sofia's Lake Resort Parking Lot"
            src="https://www.google.com/maps?q=14.2649116,121.5483302&z=16&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <div className="venue-details">
          <h2>
            Sofia&apos;s Lake, Cavinti, Laguna
          </h2>

          <p className="venue-description venue-light-italic">
            Kindly follow the designated time because
            <br />
            the boat ride is the only way to the island.
          </p>

          <p className="venue-description">
            Family members and selected entourage that will
            <br />
            come the day before, Oct 12, please be there at{" "}
            <strong>2PM</strong>
            <br />
            for the boat ride.
          </p>

          <p className="venue-description">
            For the guests that will come on the day itself, Oct 13,
            <br />
            please be there at{" "}
            <strong>12:30PM</strong> for the boat ride.
          </p>
        </div>

        <a
          className="go-to-map-btn"
          href="https://www.google.com/maps/place/Sofia%E2%80%99s+Lake+Resort+Parking+Lot/@14.2649114,121.5380519,15z/data=!3m1!4b1!4m6!3m5!1s0x3397ffaa8f35a167:0x5ea9672ccba106fd!8m2!3d14.2649116!4d121.5483302!16s%2Fg%2F11khdzwm3h"
          target="_blank"
          rel="noopener noreferrer"
        >
          GO TO MAP
        </a>
      </section>
    </main>
  );
}

export default Venue;