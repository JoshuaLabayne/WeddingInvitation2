// src/pages/Home.jsx

import React from "react";
import "./Home.css";

import venueImage from "../assets/venue.jpg";
import flowersLeft from "../assets/flowers-left.png";
import flowersRight from "../assets/flowers-right.png";
import envelope from "../assets/envelope.png";

function Home() {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="wedding-page">
      <section
        className="hero-section"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(20, 40, 30, 0.15),
              rgba(20, 40, 30, 0.35)
            ),
            url(${venueImage})
          `,
        }}
      >
        <div className="lace-border">
          <div className="hero-content">
            <div className="names-section">
              <h1 className="bride-groom-name">
                Tayrel de Dios
              </h1>

              <p className="and-text">AND</p>

              <h1 className="bride-groom-name">
                Aimee Avanceña
              </h1>
            </div>

            <div className="wedding-info">
              <p className="invite-text">
                Invite you to the ceremony and
                <br />
                celebration of their marriage on
              </p>

              <h2 className="wedding-date">
                10.13.2026
              </h2>

              <p className="venue-text">
                2pm at Sofia's Lake Resort,
                Cavinti, Laguna
              </p>

              <p className="boat-text">
                Be there at 12:30 for the boat ride!
              </p>
            </div>

            <div className="menu-wrapper">
              <img
                src={flowersLeft}
                alt=""
                className="flowers flowers-left"
              />

              <img
                src={flowersRight}
                alt=""
                className="flowers flowers-right"
              />

              <div className="envelope-wrapper">
                <img
                  src={envelope}
                  alt=""
                  className="envelope-image"
                />

                <div className="invitation-card">
                  <button
                    onClick={() => scrollToSection("venue")}
                  >
                    VENUE
                  </button>

                  <button
                    onClick={() =>
                      scrollToSection("entourage")
                    }
                  >
                    ENTOURAGE
                  </button>

                  <button
                    onClick={() => scrollToSection("attire")}
                  >
                    ATTIRE
                  </button>

                  <button
                    onClick={() => scrollToSection("faqs")}
                  >
                    FAQS
                  </button>

                  <button
                    className="rsvp-button"
                    onClick={() => scrollToSection("rsvp")}
                  >
                    RSVP
                  </button>
                </div>
              </div>
            </div>

            <div className="scroll-indicator">
              ↓
            </div>
          </div>
        </div>
      </section>

      <section id="venue" className="content-section">
        <h2>Venue</h2>

        <p>
          Sofia's Lake Resort, Cavinti, Laguna
        </p>
      </section>

      <section
        id="entourage"
        className="content-section alternate"
      >
        <h2>Entourage</h2>

        <p>
          Wedding entourage information will go here.
        </p>
      </section>

      <section id="attire" className="content-section">
        <h2>Attire</h2>

        <p>
          Dress code and wedding color palette will
          go here.
        </p>
      </section>

      <section
        id="faqs"
        className="content-section alternate"
      >
        <h2>FAQs</h2>

        <p>
          Frequently asked questions will go here.
        </p>
      </section>

      <section id="rsvp" className="content-section">
        <h2>RSVP</h2>

        <p>
          RSVP form will be connected to MongoDB later.
        </p>
      </section>
    </main>
  );
}

export default Home;