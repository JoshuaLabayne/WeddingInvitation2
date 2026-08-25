import "./Attire.css";
import entourageBack from "../assets/entourage-back.png";

import sponsorsAttire from "../assets/sponsors-attire.png";
import guestsAttire from "../assets/guests-attire.png";
import paletteImage from "../assets/palette.png";

import BackButton from "./components/BackButton.jsx";

function Attire() {
  return (
    <main
      className="attire-page"
      style={{
        backgroundImage: `url(${entourageBack})`,
      }}
    >
      {/* =========================
          BACK BUTTON
      ========================= */}

      <BackButton />

      {/* =========================
          OVERLAY
      ========================= */}

      <div className="attire-overlay"></div>

      {/* =========================
          CONTENT
      ========================= */}

      <div className="attire-content">
        <h1 className="attire-heading">
          Attire
        </h1>

        {/* =========================
            PRINCIPAL SPONSORS
        ========================= */}

        <div className="attire-section">
          <h2>
            Principal Sponsors
          </h2>

          <div className="attire-block">
            <h3>Ninong</h3>

            <p>
              Barong, Black Slacks,
              Black Shoes
            </p>
          </div>

          <div className="attire-block">
            <h3>Ninang</h3>

            <p>
              Modern Filipiniana/Barong
              Blouse, Flats
            </p>

            <p className="attire-note">
              (Recommended, for easier
              walking around the island)
            </p>
          </div>

          <img
            src={sponsorsAttire}
            alt="Principal sponsors attire"
            className="attire-illustration attire-illustration-top"
          />
        </div>

        {/* =========================
            GUESTS
        ========================= */}

        <div className="attire-section">
          <h2>
            Guests
          </h2>

          <div className="attire-block">
            <h3>Gentlemen</h3>

            <p>
              Long Sleeves, Black
              Slacks, Black Shoes
            </p>
          </div>

          <div className="attire-block">
            <h3>Ladies</h3>

            <p>
              Long Satin Dress, Flats
            </p>

            <p className="attire-note">
              (Recommended, for easier
              walking around the island)
            </p>
          </div>

          {/* =========================
              COLOR PALETTE
          ========================= */}

          <div className="attire-palette">
            <img
              src={paletteImage}
              alt="Wedding color palette"
              className="attire-palette-image"
            />
          </div>

          {/* =========================
              GUEST ATTIRE IMAGE
          ========================= */}

          <img
            src={guestsAttire}
            alt="Guest attire"
            className="attire-illustration attire-illustration-bottom"
          />
        </div>
      </div>
    </main>
  );
}

export default Attire;
