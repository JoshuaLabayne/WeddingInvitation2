import {
  useState,
} from "react";

import "./App.css";

import mainBack from "./assets/main-back.png";
import mainEnvelop from "./assets/main-envelop.png";
import sandig from "./assets/sandig.MP3";

import {
  useNavigate,
} from "react-router-dom";

/* =========================
   BACKEND URL
========================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================
   BACKGROUND WEDDING MUSIC

   This Audio object lives outside App,
   so it keeps playing even when App
   unmounts after navigating to another route.
========================= */

const weddingMusic = new Audio(sandig);

weddingMusic.loop = true;
weddingMusic.volume = 0.5;
weddingMusic.preload = "auto";

const startWeddingMusic = () => {
  if (!weddingMusic.paused) {
    return;
  }

  weddingMusic.play().catch((error) => {
    console.log(
      "Music playback is waiting for user interaction:",
      error
    );
  });
};

function App() {
  const navigate = useNavigate();

  /* =========================
     ADMIN LOGIN STATES
  ========================= */

  const [
    showAdminLogin,
    setShowAdminLogin,
  ] = useState(false);

  const [
    adminPassword,
    setAdminPassword,
  ] = useState("");

  const [
    adminError,
    setAdminError,
  ] = useState("");

  const [
    adminLoading,
    setAdminLoading,
  ] = useState(false);

  /* =========================
     NAVIGATE + SCROLL TOP
  ========================= */

  const navigateToPage = (
    path
  ) => {
    navigate(path);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }, 0);
  };

  /* =========================
     OPEN ADMIN POPUP
  ========================= */

  const openAdminLogin = () => {
    setAdminPassword("");
    setAdminError("");
    setShowAdminLogin(true);
  };

  /* =========================
     CLOSE ADMIN POPUP
  ========================= */

  const closeAdminLogin = () => {
    if (adminLoading) {
      return;
    }

    setShowAdminLogin(false);
    setAdminPassword("");
    setAdminError("");
  };

  /* =========================
     ADMIN LOGIN
  ========================= */

  const handleAdminLogin =
    async (event) => {
      event.preventDefault();

      if (
        !adminPassword.trim()
      ) {
        setAdminError(
          "Please enter the admin password."
        );

        return;
      }

      try {
        setAdminLoading(true);
        setAdminError("");

        const response =
          await fetch(
            `${API_URL}/api/admin/login`,
            {
              method: "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  password:
                    adminPassword,
                }),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          setAdminError(
            data.message ||
              "Incorrect password."
          );

          return;
        }

        setShowAdminLogin(false);
        setAdminPassword("");
        setAdminError("");

        navigateToPage(
          "/admin"
        );
      } catch (error) {
        console.error(
          "Admin login error:",
          error
        );

        setAdminError(
          "Unable to connect to the server."
        );
      } finally {
        setAdminLoading(false);
      }
    };

  return (
    <>
      <main
        className="wedding-page"
        onPointerDownCapture={
          startWeddingMusic
        }
        onClickCapture={
          startWeddingMusic
        }
      >
        <section
          className="hero-section"
          style={{
            backgroundImage:
              `url(${mainBack})`,
          }}
        >
          <div className="overlay" />

          <div className="hero-content">
            {/* =========================
                COUPLE NAMES
            ========================= */}

            <div className="names-section">
              <h1 className="couple-name jayel-name">
                Jay-el de Dios
              </h1>

              {/* SECRET ADMIN ACCESS */}

              <p
                className="and-text"
                onClick={
                  openAdminLogin
                }
                role="button"
                tabIndex={0}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();

                    openAdminLogin();
                  }
                }}
              >
                AND
              </p>

              <h1 className="couple-name aimee-name">
                Aimee Avanceña
              </h1>
            </div>

            {/* =========================
                WEDDING INFO
            ========================= */}

            <div className="wedding-info">
              <p className="invite-text">
                Invite you to the
                ceremony and
                <br />
                celebration of their
                marriage on
              </p>

              <h2 className="wedding-date">
                10.13.2026
              </h2>

              <p className="venue-text">
                2PM at Sofia&apos;s
                Lake Resort, Cavinti,
                Laguna
              </p>

              <p className="boat-text">
                Be there at{" "}
                <span className="boat-time">
                  12:30
                </span>{" "}
                for the boat ride!
              </p>
            </div>

            {/* =========================
                ENVELOPE MENU
            ========================= */}

            <div className="envelope-menu-wrapper">
              <img
                src={
                  mainEnvelop
                }
                alt="Wedding menu envelope"
                className="envelope-menu-image"
              />

              <div className="envelope-buttons">
                <button
                  type="button"
                  onClick={() =>
                    navigateToPage(
                      "/venue"
                    )
                  }
                >
                  VENUE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigateToPage(
                      "/entourage"
                    )
                  }
                >
                  ENTOURAGE
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigateToPage(
                      "/attire"
                    )
                  }
                >
                  ATTIRE
                </button>

                <button
                  type="button"
                >
                  FAQS
                </button>

                <button
                  type="button"
                  className="rsvp-button"
                  onClick={() =>
                    navigateToPage(
                      "/rsvp"
                    )
                  }
                >
                  RSVP
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================
          ADMIN PASSWORD POPUP
      ========================= */}

      {showAdminLogin && (
        <div
          className="admin-login-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAdminLogin();
            }
          }}
        >
          <div
            className="admin-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
          >
            <button
              type="button"
              className="admin-login-close"
              onClick={
                closeAdminLogin
              }
              disabled={
                adminLoading
              }
              aria-label="Close"
            >
              ×
            </button>

           
            <h2
              id="admin-login-title"
              className="admin-login-title"
            >
              Admin
            </h2>

            <p className="admin-login-description">
              Please enter the
              administrator password
              to continue.
            </p>

            <form
              onSubmit={
                handleAdminLogin
              }
            >
              <div className="admin-password-wrapper">
                <input
                  type="password"
                  value={
                    adminPassword
                  }
                  onChange={(
                    event
                  ) => {
                    setAdminPassword(
                      event.target
                        .value
                    );

                    setAdminError(
                      ""
                    );
                  }}
                  className="admin-password-input"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  autoFocus
                  disabled={
                    adminLoading
                  }
                />
              </div>

              {adminError && (
                <p className="admin-login-error">
                  {adminError}
                </p>
              )}

              <button
                type="submit"
                className="admin-login-submit"
                disabled={
                  adminLoading
                }
              >
                {adminLoading
                  ? "Checking..."
                  : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
