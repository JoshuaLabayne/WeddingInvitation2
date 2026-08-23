import {
  StrictMode,
  Suspense,
  lazy,
  useEffect,
  useState,
} from "react";

import { createRoot } from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import LoadingSpinner from "./pages/components/LoadingSpinner.jsx";

/* =========================
   LAZY LOAD PAGES
========================= */

const App = lazy(() =>
  import("./App.jsx")
);

const Venue = lazy(() =>
  import("./pages/Venue.jsx")
);

const Entourage = lazy(() =>
  import("./pages/Entourage.jsx")
);

const Attire = lazy(() =>
  import("./pages/Attire.jsx")
);

const Faqs = lazy(() =>
  import("./pages/Faqs.jsx")
);

const Rsvp = lazy(() =>
  import("./pages/Rsvp.jsx")
);

const Admin = lazy(() =>
  import("./pages/Admin.jsx")
);

/* =========================
   DELAYED LOADING SPINNER

   Prevents quick spinner flashes
   when pages load very fast.
========================= */

function DelayedLoadingSpinner({
  delay = 195,
}) {
  const [
    showSpinner,
    setShowSpinner,
  ] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  if (!showSpinner) {
    return null;
  }

  return <LoadingSpinner />;
}

/* =========================
   PAGE IMAGE LOADER
   NO WRAPPER DIV
========================= */

function PageWithLoader({
  children,
}) {
  const location = useLocation();

  const [
    imagesLoaded,
    setImagesLoaded,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setImagesLoaded(false);

    /* =========================
       SCROLL TO TOP
    ========================= */

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const waitForImages =
      async () => {
        /*
          Wait until React has rendered
          the current page into the DOM.
        */

        await new Promise(
          (resolve) =>
            requestAnimationFrame(
              resolve
            )
        );

        await new Promise(
          (resolve) =>
            requestAnimationFrame(
              resolve
            )
        );

        if (cancelled) {
          return;
        }

        const imageUrls =
          new Set();

        /* =========================
           NORMAL <img> ELEMENTS
        ========================= */

        const images =
          document.querySelectorAll(
            "img"
          );

        images.forEach((img) => {
          const src =
            img.currentSrc ||
            img.src;

          if (src) {
            imageUrls.add(src);
          }
        });

        /* =========================
           CSS BACKGROUND IMAGES
        ========================= */

        const elements =
          document.querySelectorAll(
            "*"
          );

        elements.forEach(
          (element) => {
            const style =
              window.getComputedStyle(
                element
              );

            const background =
              style.backgroundImage;

            if (
              !background ||
              background === "none"
            ) {
              return;
            }

            const matches = [
              ...background.matchAll(
                /url\(["']?(.*?)["']?\)/g
              ),
            ];

            matches.forEach(
              (match) => {
                if (match[1]) {
                  imageUrls.add(
                    match[1]
                  );
                }
              }
            );
          }
        );

        /* =========================
           PRELOAD ALL IMAGES
        ========================= */

        const promises = [
          ...imageUrls,
        ].map((url) => {
          return new Promise(
            (resolve) => {
              const image =
                new Image();

              image.onload =
                resolve;

              image.onerror =
                resolve;

              image.src = url;

              if (
                image.complete
              ) {
                resolve();
              }
            }
          );
        });

        await Promise.allSettled(
          promises
        );

        if (!cancelled) {
          setImagesLoaded(true);
        }
      };

    waitForImages();

    /* =========================
       SAFETY FALLBACK
    ========================= */

    const safetyTimer =
      setTimeout(() => {
        if (!cancelled) {
          setImagesLoaded(true);
        }
      }, 15000);

    return () => {
      cancelled = true;

      clearTimeout(
        safetyTimer
      );
    };
  }, [location.pathname]);

  return (
    <>
      {!imagesLoaded && (
        <DelayedLoadingSpinner
          delay={195}
        />
      )}

      {children}
    </>
  );
}

/* =========================
   ROUTES
========================= */

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageWithLoader>
            <App />
          </PageWithLoader>
        }
      />

      <Route
        path="/venue"
        element={
          <PageWithLoader>
            <Venue />
          </PageWithLoader>
        }
      />

      <Route
        path="/entourage"
        element={
          <PageWithLoader>
            <Entourage />
          </PageWithLoader>
        }
      />

      <Route
        path="/attire"
        element={
          <PageWithLoader>
            <Attire />
          </PageWithLoader>
        }
      />

      <Route
        path="/faqs"
        element={
          <PageWithLoader>
            <Faqs />
          </PageWithLoader>
        }
      />

      <Route
        path="/rsvp"
        element={
          <PageWithLoader>
            <Rsvp />
          </PageWithLoader>
        }
      />

      <Route
        path="/admin"
        element={
          <PageWithLoader>
            <Admin />
          </PageWithLoader>
        }
      />
    </Routes>
  );
}

/* =========================
   START APP
========================= */

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense
        fallback={
          <DelayedLoadingSpinner
            delay={195}
          />
        }
      >
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
