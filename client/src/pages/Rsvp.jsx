import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Rsvp.css";
import entourageBack from "../assets/entourage-back.png";
import BackButton from "./components/BackButton.jsx";

/* =========================
   BACKEND URL
========================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://were-getting-married-jayelandaimee.onrender.com"
    : "http://localhost:5000");

const API =
  `${API_BASE}/api/invites`;

function Rsvp() {
  const [search, setSearch] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [doneMessage, setDoneMessage] =
    useState("");

  const [draftStatuses, setDraftStatuses] =
    useState({});

  const [savingGroup, setSavingGroup] =
    useState(false);

  const [selectedGroupId, setSelectedGroupId] =
    useState(null);

  const [popupStep, setPopupStep] =
    useState(null);

  /* =========================
     SEARCH MONGODB INVITES
  ========================= */

  useEffect(() => {
    const searchText =
      search.trim();

    if (!searchText) {
      setResults([]);
      setMessage("");
      setLoading(false);
      setSelectedGroupId(null);
      return;
    }

    const controller =
      new AbortController();

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);
          setMessage("");

          const response =
            await fetch(
              `${API}/search?name=${encodeURIComponent(
                searchText
              )}`,
              {
                signal:
                  controller.signal,
              }
            );

          const responseText =
            await response.text();

          let data = [];

          if (responseText) {
            try {
              data =
                JSON.parse(
                  responseText
                );
            } catch {
              data = [];
            }
          }

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to search invitations."
            );
          }

          setResults(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (error) {
          if (
            error.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(error);

          setResults([]);

          setMessage(
            "Unable to search right now. Please try again."
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(false);
          }
        }
      },
      350
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  /* =========================
     GROUP SEARCH RESULTS
  ========================= */

  const groupedResults =
    useMemo(() => {
      const groups = {};

      results.forEach(
        (invite) => {
          const key =
            invite.groupId ||
            invite._id;

          if (!groups[key]) {
            groups[key] = {
              groupId: key,

              groupName:
                invite.groupName ||
                invite.name,

              members: [],
            };
          }

          groups[
            key
          ].members.push(invite);
        }
      );

      return Object.values(groups);
    }, [results]);

  /* =========================
     ONLY MATCHING NAMES IN SEARCH
  ========================= */

  const matchingNames =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      if (!searchText) {
        return [];
      }

      const completedGroupIds =
        new Set(
          groupedResults
            .filter(
              (group) =>
                group.members.length >
                  0 &&
                group.members.every(
                  (member) =>
                    member.rsvpStatus !==
                    "Pending"
                )
            )
            .map(
              (group) =>
                group.groupId
            )
        );

      return results.filter(
        (invite) => {
          const groupKey =
            invite.groupId ||
            invite._id;

          const matchesName =
            invite.name
              ?.toLowerCase()
              .includes(
                searchText
              );

          const groupIsComplete =
            completedGroupIds.has(
              groupKey
            );

          return (
            matchesName &&
            !groupIsComplete
          );
        }
      );
    }, [
      results,
      search,
      groupedResults,
    ]);

  /* =========================
     SELECTED GROUP
  ========================= */

  const selectedGroup =
    useMemo(() => {
      if (!selectedGroupId) {
        return null;
      }

      return (
        groupedResults.find(
          (group) =>
            group.groupId ===
            selectedGroupId
        ) || null
      );
    }, [
      groupedResults,
      selectedGroupId,
    ]);

  const getVisitorPopupStep = (
    inviteType
  ) => {
    const normalizedType =
      String(
        inviteType || ""
      )
        .trim()
        .toLowerCase();

    if (
      normalizedType ===
        "family member" ||
      normalizedType ===
        "family"
    ) {
      return "family";
    }

    if (
      normalizedType ===
        "bridesmaid/groomsman" ||
      normalizedType ===
        "bridesmaid/groomsmen" ||
      normalizedType ===
        "bridesmaid" ||
      normalizedType ===
        "groomsman" ||
      normalizedType ===
        "groomsmen"
    ) {
      return "wedding-party";
    }

    return "rsvp";
  };

  const openRsvpPopup = (
    invite
  ) => {
    setSelectedGroupId(
      invite.groupId ||
        invite._id
    );

    setPopupStep(
      getVisitorPopupStep(
        invite.inviteType
      )
    );

    setDraftStatuses({});
    setMessage("");
  };

  const closeRsvpPopup = () => {
    setSelectedGroupId(null);
    setPopupStep(null);
    setDraftStatuses({});
    setMessage("");
  };

  const continueToRsvp = () => {
    setPopupStep("rsvp");
    setMessage("");
  };

  const getDraftStatus = (
    member
  ) =>
    draftStatuses[
      member._id
    ] ??
    member.rsvpStatus ??
    "Pending";

  const selectedGroupIsComplete =
    selectedGroup
      ? selectedGroup.members.length >
          0 &&
        selectedGroup.members.every(
          (member) =>
            getDraftStatus(
              member
            ) !== "Pending"
        )
      : false;

  const finishRsvp =
    async () => {
      if (
        !selectedGroup ||
        !selectedGroupIsComplete
      ) {
        setMessage(
          "Please answer Going or Not Going for everyone in your group before pressing Done."
        );
        return;
      }

      if (savingGroup) {
        return;
      }

      const changes =
        selectedGroup.members
          .map((member) => {
            const nextStatus =
              getDraftStatus(
                member
              );

            if (
              nextStatus ===
              member.rsvpStatus
            ) {
              return null;
            }

            return {
              inviteId:
                member._id,
              rsvpStatus:
                nextStatus,
            };
          })
          .filter(Boolean);

      try {
        setSavingGroup(true);
        setMessage("");

        const savedMembers =
          await Promise.all(
            changes.map(
              async ({
                inviteId,
                rsvpStatus,
              }) => {
                const response =
                  await fetch(
                    `${API}/${inviteId}/rsvp`,
                    {
                      method:
                        "PATCH",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body:
                        JSON.stringify(
                          {
                            rsvpStatus,
                          }
                        ),
                    }
                  );

                const responseText =
                  await response.text();

                let data = {};

                if (
                  responseText
                ) {
                  try {
                    data =
                      JSON.parse(
                        responseText
                      );
                  } catch {
                    data = {};
                  }
                }

                if (
                  !response.ok
                ) {
                  throw new Error(
                    data.message ||
                      "Failed to save RSVP."
                  );
                }

                return {
                  inviteId,
                  rsvpStatus:
                    data.rsvpStatus ||
                    rsvpStatus,
                };
              }
            )
          );

        if (
          savedMembers.length >
          0
        ) {
          const savedMap =
            new Map(
              savedMembers.map(
                (item) => [
                  item.inviteId,
                  item.rsvpStatus,
                ]
              )
            );

          setResults(
            (previous) =>
              previous.map(
                (invite) =>
                  savedMap.has(
                    invite._id
                  )
                    ? {
                        ...invite,
                        rsvpStatus:
                          savedMap.get(
                            invite._id
                          ),
                      }
                    : invite
              )
          );
        }

        setSelectedGroupId(
          null
        );
        setPopupStep(null);
        setDraftStatuses({});
        setSearch("");
        setResults([]);
        setMessage("");
        setDoneMessage(
          "Thank you! Your RSVP has been saved."
        );
      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to save your RSVP. Please try again."
        );
      } finally {
        setSavingGroup(false);
      }
    };

  /* =========================
     TOGGLE RSVP ANSWER
     Answers stay local until Done.
     Click the selected answer again
     to remove it and return to Pending.
  ========================= */

  const toggleRsvpStatus = (
    member,
    selectedStatus
  ) => {
    if (savingGroup) {
      return;
    }

    const currentStatus =
      getDraftStatus(
        member
      );

    const nextStatus =
      currentStatus ===
      selectedStatus
        ? "Pending"
        : selectedStatus;

    setDraftStatuses(
      (previous) => ({
        ...previous,
        [member._id]:
          nextStatus,
      })
    );

    setMessage("");
  };

  /* =========================
     STATUS LABEL
  ========================= */

  const getStatusLabel = (
    status
  ) => {
    if (
      status === "Pending"
    ) {
      return "No Answer Yet";
    }

    return status;
  };

  return (
    <main
      className="rsvp-page"
      style={{
        backgroundImage: `url(${entourageBack})`,
      }}
    >
      {/* BACK BUTTON */}
      <BackButton />

      <div className="rsvp-overlay" />

      <section className="rsvp-content">
        <h1 className="rsvp-heading">
          Rsvp
        </h1>

        {/* =========================
            HOW TO RSVP
        ========================= */}

        <div className="rsvp-info-section">
          <h2>
            How to RSVP
          </h2>

          <div className="rsvp-instructions">
            <p>
              1. Search for your
              name (
              <strong>
                First Name, Last
                Name
              </strong>
              )
            </p>

            <p className="rsvp-example">
              e.g. Jay-el de Dios
            </p>

            <p>
              2. Select the group
              where your name is
              listed
            </p>

            <p>
              3. Select your name,
              then kindly choose
              <strong>
                {" "}
                “going”{" "}
              </strong>
              or
              <strong>
                {" "}
                “not going”
              </strong>
            </p>
          </div>
        </div>

        {/* =========================
            GENTLE NOTE
        ========================= */}

        <div className="rsvp-note-section">
          <h2>
            A Gentle Note
          </h2>

          <p className="rsvp-note-intro">
            To help us plan
            accordingly, we kindly
            ask
            <br />
            for your understanding
            of the following:
          </p>

          <div className="rsvp-note-list">
            <p>
              1. We regret that we
              are unable to
              accommodate plus ones.
            </p>

            <p>
              2. Kindly ensure that
              only confirmed guests
              attend.
            </p>

            <p>
              3. Carpooling is
              highly encouraged due
              to the limited parking
              spaces. 
                <br />Kindly reach
              out to the couple for
              carpooling
              arrangements.
            </p>

            <p className="important-note">
              4. Kindly come early
              because boatride is the
              only way to the
              island.
            </p>

            <p>
              5. Wear and bring
              insect repellent
              lotion.
            </p>
          </div>
        </div>

        {/* =========================
            SEARCH CARD
        ========================= */}

        <div className="rsvp-card">
          <div className="rsvp-card-decoration">
            <span />
            <span className="rsvp-flower">
              ❧
            </span>
            <span />
          </div>

          <p className="rsvp-card-text">
            Please enter the first
            and last name of one
            member
            <br />
            of your party below. If
            you&apos;re responding
            for you and
            <br />
            a guest (or your family),
            you&apos;ll be able to
            RSVP for
            <br />
            your entire group below.
          </p>

          <div className="rsvp-search-wrapper">
            <span className="rsvp-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                );
                setDoneMessage("");
              }}
              placeholder="Search your name"
              className="rsvp-search-input"
              autoComplete="off"
            />
          </div>

          {/* =========================
              LOADING
          ========================= */}

          {loading && (
            <p className="rsvp-search-message">
              Searching...
            </p>
          )}

          {/* =========================
              SEARCH RESULTS
              ONLY SHOW MATCHING NAMES
          ========================= */}

          {!loading &&
            search.trim() &&
            matchingNames.length >
              0 && (
              <div className="rsvp-results">
                {matchingNames.map(
                  (invite) => (
                    <button
                      type="button"
                      className="rsvp-result"
                      key={
                        invite._id
                      }
                      onClick={() =>
                        openRsvpPopup(
                          invite
                        )
                      }
                    >
                      {invite.name}
                    </button>
                  )
                )}
              </div>
            )}

          {/* =========================
              NO RESULT
          ========================= */}

          {!loading &&
            search.trim() &&
            matchingNames.length ===
              0 &&
            !message && (
              <p className="rsvp-no-result">
                No guest found or this group has already completed the RSVP.
              </p>
            )}

          {/* =========================
              MESSAGE
          ========================= */}

          {message && (
            <p className="rsvp-search-message">
              {message}
            </p>
          )}

          {doneMessage && (
            <p className="rsvp-done-success">
              {doneMessage}
            </p>
          )}
        </div>

        {/* =========================
            VISITOR TYPE / RSVP POPUP
        ========================= */}

        {selectedGroup &&
          popupStep && (
          <div
            className="rsvp-popup-backdrop"
            role="presentation"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeRsvpPopup();
              }
            }}
          >
            {/* =========================
                FAMILY MEMBER MESSAGE
            ========================= */}

            {popupStep ===
              "family" && (
              <div
                className="rsvp-popup rsvp-welcome-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="family-welcome-title"
              >
                <button
                  type="button"
                  className="rsvp-popup-close"
                  onClick={
                    closeRsvpPopup
                  }
                  aria-label="Close family member message"
                >
                  ×
                </button>

                <p className="rsvp-welcome-label">
                  For our family
                </p>

                <h2
                  id="family-welcome-title"
                  className="rsvp-welcome-title"
                >
                  A Special Gift for You
                </h2>

                <p className="rsvp-welcome-message">
                  We are honored to be
                  with you on our special
                  day! As our token of
                  appreciation for a
                  family member who made
                  time for us, we are
                  gifting you a two-day,
                  one-night stay (<strong>Oct 12-13</strong>) at the
                  Sofia&apos;s Lake Resort
                  so you can soak in the
                  serene vibe of the
                  island longer. Let&apos;s
                  slow down, unwind, and
                  revel in this
                  once-in-a-lifetime
                  moment together. See
                  you!
                </p>

                <button
                  type="button"
                  className="rsvp-popup-next"
                  onClick={
                    continueToRsvp
                  }
                >
                  Next
                </button>
              </div>
            )}

            {/* =========================
                BRIDESMAID / GROOMSMAN MESSAGE
            ========================= */}

            {popupStep ===
              "wedding-party" && (
              <div
                className="rsvp-popup rsvp-welcome-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wedding-party-welcome-title"
              >
                <button
                  type="button"
                  className="rsvp-popup-close"
                  onClick={
                    closeRsvpPopup
                  }
                  aria-label="Close wedding party message"
                >
                  ×
                </button>

                <p className="rsvp-welcome-label">
                  For Bridesmaid/Groomsmen
                </p>

                <h2
                  id="wedding-party-welcome-title"
                  className="rsvp-welcome-title"
                >
                  A Special Gift for You
                </h2>

                <p className="rsvp-welcome-message">
  I am honored to have
  you as my
  Groomsmen/Bridesmaid!
  As a token of
  appreciation, I&apos;m
  gifting you a two-day,
  one-night stay (
  <strong>Oct 12-13</strong>
  ) at the
  Sofia&apos;s Lake Resort
  so you can soak in the
  serene vibe of the
  island longer. Let&apos;s
  slow down, unwind, and
  revel in this
  once-in-a-lifetime
  moment together. See
  you!
</p>

                <button
                  type="button"
                  className="rsvp-popup-next"
                  onClick={
                    continueToRsvp
                  }
                >
                  Next
                </button>
              </div>
            )}

            {/* =========================
                RSVP ANSWER POPUP
            ========================= */}

            {popupStep ===
              "rsvp" && (
              <div
                className="rsvp-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rsvp-popup-title"
              >
                <button
                  type="button"
                  className="rsvp-popup-close"
                  onClick={
                    closeRsvpPopup
                  }
                  aria-label="Close RSVP popup"
                >
                  ×
                </button>

                <h2
                  id="rsvp-popup-title"
                  className="rsvp-popup-title"
                >
                  RSVP
                </h2>

                <p className="rsvp-popup-subtitle">
                  Please choose a response
                  for each invited guest.
                  Tap the selected answer
                  again to remove it.
                  Your answers are only
                  saved when you press Done.
                </p>

                <div className="rsvp-popup-members">
                  {selectedGroup.members.map(
                    (member) => (
                      <div
                        className="rsvp-popup-member"
                        key={
                          member._id
                        }
                      >
                        <div className="rsvp-popup-member-top">
                          <span className="rsvp-popup-member-name">
                            {
                              member.name
                            }
                          </span>

                          <span
                            className={`rsvp-popup-status ${
                              getDraftStatus(
                                member
                              ) ===
                              "Going"
                                ? "is-going"
                                : getDraftStatus(
                                    member
                                  ) ===
                                    "Not Going"
                                  ? "is-not-going"
                                  : "is-pending"
                            }`}
                          >
                            {getStatusLabel(
                              getDraftStatus(
                                member
                              )
                            )}
                          </span>
                        </div>

                        <div className="rsvp-popup-actions">
                          <button
                            type="button"
                            className={`rsvp-popup-choice going ${
                              getDraftStatus(
                                member
                              ) ===
                              "Going"
                                ? "selected"
                                : ""
                            }`}
                            disabled={
                              savingGroup
                            }
                            onClick={() =>
                              toggleRsvpStatus(
                                member,
                                "Going"
                              )
                            }
                          >
                            Going
                          </button>

                          <button
                            type="button"
                            className={`rsvp-popup-choice not-going ${
                              getDraftStatus(
                                member
                              ) ===
                              "Not Going"
                                ? "selected"
                                : ""
                            }`}
                            disabled={
                              savingGroup
                            }
                            onClick={() =>
                              toggleRsvpStatus(
                                member,
                                "Not Going"
                              )
                            }
                          >
                            Not Going
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {message && (
                  <p className="rsvp-popup-message">
                    {message}
                  </p>
                )}

                <button
                  type="button"
                  className={`rsvp-popup-done ${
                    selectedGroupIsComplete
                      ? "ready"
                      : ""
                  }`}
                  onClick={
                    finishRsvp
                  }
                  disabled={
                    savingGroup
                  }
                >
                  {savingGroup
                    ? "Saving..."
                    : "Done"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================
            POPUP CSS
            KEPT IN THIS RSVP FILE
        ========================= */}

        <style>{`
          .rsvp-results {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
          }

          .rsvp-result {
            width: 100%;
            min-height: 44px;
            padding: 9px 14px;
            border: 1px solid rgba(31, 71, 52, 0.28);
            border-radius: 5px;
            background: #fffdf8;
            color: #1f4734;
            font-family: "Adobe Jenson Pro", serif;
            font-size: 0.95rem;
            text-align: left;
            cursor: pointer;
          }

          .rsvp-result:hover {
            background: #f4f6f1;
          }

          .rsvp-result:focus-visible {
            outline: 2px solid #6f7800;
            outline-offset: 2px;
          }

          .rsvp-popup-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.48);
          }

          .rsvp-popup {
            position: relative;
            width: min(560px, 100%);
            max-height: 82vh;
            overflow-y: auto;
            padding: 30px;
            border-radius: 14px;
            background: #fffdf8;
            color: #1c2e24;
            font-family: "Adobe Jenson Pro", serif;
            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.2);
          }

          .rsvp-popup-close {
            position: absolute;
            top: 10px;
            right: 12px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: transparent;
            color: #1f4734;
            font-size: 1.7rem;
            line-height: 1;
            cursor: pointer;
          }

          .rsvp-popup-close:hover {
            background: rgba(31, 71, 52, 0.08);
          }

          .rsvp-popup-kicker {
            margin: 0 0 5px;
            color: #6f7800;
            font-size: 0.78rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .rsvp-popup-title {
            margin: 0;
            color: #1f4734;
            font-size: 1.65rem;
            font-weight: 600;
          }

          .rsvp-popup-subtitle {
            margin: 8px 0 22px;
            color: #66645f;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .rsvp-welcome-popup {
            text-align: center;
          }

          .rsvp-welcome-label {
            margin: 0 0 8px;

            color: #747400;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 0.78rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .rsvp-welcome-title {
            margin: 0 0 18px;

            color: #1f4734;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 1.55rem;
            font-weight: 600;
          }

          .rsvp-welcome-message {
            margin: 0;

            color: #575249;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 0.96rem;
            line-height: 1.55;
          }

          .rsvp-popup-next {
            width: 100%;
            min-height: 48px;

            margin-top: 24px;
            padding: 10px 16px;

            border: 2px solid #747400;
            border-radius: 7px;

            background: #747400;
            color: #ffffff;

            box-shadow:
              0 4px 0 #545400;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 1rem;
            font-weight: 600;

            cursor: pointer;

            transition:
              background 0.18s ease,
              color 0.18s ease,
              transform 0.12s ease,
              box-shadow 0.12s ease;
          }

          .rsvp-popup-next:hover {
            background: #666600;
          }

          .rsvp-popup-next:active {
            transform: translateY(3px);

            box-shadow:
              0 1px 0 #545400;
          }

          .rsvp-popup-members {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .rsvp-popup-member {
            padding: 14px;
            border: 1px solid #dedbd1;
            border-radius: 8px;
            background: #ffffff;
          }

          .rsvp-popup-member-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 11px;
          }

          .rsvp-popup-member-name {
            color: #1b1b1b;
            font-size: 1rem;
            font-weight: 600;
          }

          .rsvp-popup-status {
            flex-shrink: 0;
            font-size: 0.76rem;
          }

          .rsvp-popup-status.is-going {
            color: #747400;
          }

          .rsvp-popup-status.is-not-going {
            color: #bd001d;
          }

          .rsvp-popup-status.is-pending {
            color: #8b8779;
          }

          .rsvp-popup-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .rsvp-popup-choice {
            min-height: 40px;
            padding: 7px 10px;
            border: 1px solid #c9c7c0;
            border-radius: 5px;
            background: #ffffff;
            color: #222222;
            font-family: "Adobe Jenson Pro", serif;
            font-size: 0.88rem;
            cursor: pointer;
          }

          .rsvp-popup-choice.going:hover,
          .rsvp-popup-choice.going.selected {
            border-color: #747400;
            background: #747400;
            color: #ffffff;
          }

          .rsvp-popup-choice.not-going:hover,
          .rsvp-popup-choice.not-going.selected {
            border-color: #bd001d;
            background: #bd001d;
            color: #ffffff;
          }

          .rsvp-popup-choice.selected {
            box-shadow:
              inset 0 0 0 1px rgba(255, 255, 255, 0.45);
          }

          .rsvp-popup-choice:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .rsvp-popup-message {
            margin: 16px 0 0;
            color: #1f4734;
            font-size: 0.85rem;
            text-align: center;
          }

          .rsvp-done-success {
            position: relative;
            z-index: 4;

            width: 100%;
            max-width: 390px;

            margin: 18px auto 0;
            padding: 12px 14px;

            border: 1px solid #747400;
            border-radius: 5px;

            background: rgba(116, 116, 0, 0.08);
            color: #5f6300;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 0.95rem;
            font-weight: 600;
            line-height: 1.3;

            text-align: center;
          }

          .rsvp-popup-done {
            width: 100%;
            min-height: 48px;

            margin-top: 20px;
            padding: 10px 16px;

            border: 2px solid #747400;
            border-radius: 7px;

            color: #ffffff;
            background: #747400;

            box-shadow:
              0 4px 0 #545400;

            font-family: "Adobe Jenson Pro", serif;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.02em;

            cursor: pointer;

            transition:
              background 0.18s ease,
              color 0.18s ease,
              transform 0.12s ease,
              box-shadow 0.12s ease;
          }

          .rsvp-popup-done:hover {
            background: #f7f7e8;
            color: #545400;
          }

          .rsvp-popup-done:active {
            transform: translateY(3px);

            box-shadow:
              0 1px 0 #545400;
          }

          .rsvp-popup-done:disabled {
            opacity: 0.65;
            cursor: wait;
            transform: none;
          }

          .rsvp-popup-done.ready {
            background: #747400;
            color: #ffffff;
          }

          .rsvp-popup-done.ready:hover {
            background: #666600;
          }

          @media (max-width: 600px) {
            .rsvp-popup-backdrop {
              padding: 14px;
            }

            .rsvp-popup {
              width: 100%;
              max-height: 86vh;
              padding: 25px 18px 20px;
              border-radius: 10px;
            }

            .rsvp-popup-title {
              padding-right: 35px;
              font-size: 1.35rem;
            }

            .rsvp-welcome-title {
              padding: 0 28px;
              font-size: 1.25rem;
            }

            .rsvp-welcome-message {
              font-size: 0.82rem;
              line-height: 1.45;
            }

            .rsvp-popup-next {
              min-height: 44px;
              margin-top: 20px;
              font-size: 0.86rem;
            }

            .rsvp-popup-member {
              padding: 12px;
            }

            .rsvp-popup-member-top {
              align-items: flex-start;
            }

            .rsvp-popup-member-name {
              font-size: 0.9rem;
            }

            .rsvp-popup-status {
              font-size: 0.68rem;
            }

            .rsvp-popup-choice {
              min-height: 38px;
              font-size: 0.78rem;
            }

            .rsvp-popup-done {
              min-height: 42px;
              font-size: 0.85rem;
            }

            .rsvp-done-success {
              margin-top: 14px;
              padding: 10px 12px;
              font-size: 0.8rem;
            }
          }
        `}</style>
      </section>
    </main>
  );
}

export default Rsvp;
