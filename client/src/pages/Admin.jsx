import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Admin.css";

import editIcon from "../assets/edit.png";

/* =========================
   BACKEND URL
========================= */

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://were-getting-married-jayelandaimee.onrender.com";

const API =
  `${API_BASE}/api/invites`;

const ADMIN_API =
  `${API_BASE}/api/admin`;

/* =========================
   ADMIN TOKEN HELPERS
========================= */

const getAdminToken = () =>
  sessionStorage.getItem("adminToken");

const getAdminHeaders = (
  extraHeaders = {}
) => {
  const token = getAdminToken();

  return {
    ...extraHeaders,

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };
};

const clearAdminToken = () => {
  sessionStorage.removeItem(
    "adminToken"
  );
};

/* =========================
   EMPTY MEMBER
========================= */

const createEmptyMember = () => ({
  id: crypto.randomUUID(),
  name: "",
  rsvpStatus: "Pending",
  inviteType: "Guest",
});

function Admin() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [authError, setAuthError] =
    useState("");

  const [invites, setInvites] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    going: 0,
    notGoing: 0,
    pending: 0,

    percentages: {
      going: 0,
      notGoing: 0,
      pending: 0,
    },
  });

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [showFilters, setShowFilters] =
    useState(false);

  /* =========================
     VIEW MODE
  ========================= */

  const [viewMode, setViewMode] =
    useState("normal");

  /* =========================
     ADD INVITE STATES
  ========================= */

  const [groupName, setGroupName] =
    useState("");

  const [groupMembers, setGroupMembers] =
    useState([
      createEmptyMember(),
    ]);

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =========================
     EDIT STATES
  ========================= */

  const [editingGroupId, setEditingGroupId] =
    useState(null);

  const [editGroupName, setEditGroupName] =
    useState("");

  const [editMembers, setEditMembers] =
    useState([]);

  const [editMessage, setEditMessage] =
    useState("");

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [deletingGroup, setDeletingGroup] =
    useState(false);

  /* =========================
     CHECK ADMIN SESSION
  ========================= */

  const checkAdminSession =
    useCallback(async () => {
      try {
        const token =
          getAdminToken();

        console.log(
          "Admin token exists:",
          Boolean(token)
        );

        if (!token) {
          setAuthError(
            "No admin token was found. Please return to the home page and log in again."
          );

          return false;
        }

        const response =
          await fetch(
            `${ADMIN_API}/check`,
            {
              method: "GET",

              headers:
                getAdminHeaders({
                  Accept:
                    "application/json",
                }),
            }
          );

        const responseText =
          await response.text();

        let data = {};

        if (responseText) {
          try {
            data =
              JSON.parse(
                responseText
              );
          } catch {
            data = {
              message:
                responseText,
            };
          }
        }

        console.log(
          "/api/admin/check:",
          response.status,
          data
        );

        if (!response.ok) {
          /*
           * IMPORTANT:
           * Do not immediately navigate back to "/".
           * Keeping the user on /admin makes it possible
           * to see the real authentication error instead
           * of flashing back to App.jsx.
           */
          setAuthError(
            data.message ||
              `Admin authentication failed (${response.status}). The backend rejected the Bearer token.`
          );

          return false;
        }

        setAuthError("");

        console.log(
          "✅ Admin authenticated"
        );

        return true;
      } catch (error) {
        console.error(
          "Admin session check failed:",
          error
        );

        setAuthError(
          "Unable to verify admin access. Please check the backend deployment and try again."
        );

        return false;
      }
    }, []);

  /* =========================
     FETCH INVITES
  ========================= */

  const fetchInvites =
    useCallback(async () => {
      try {
        const response =
          await fetch(API, {
            headers:
              getAdminHeaders(),
          });

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setAuthError(
            "The backend rejected the admin token while loading invitations."
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to retrieve invites."
          );
        }

        const data =
          await response.json();

        setInvites(data);
      } catch (error) {
        console.error(error);
      }
    }, [navigate]);

  /* =========================
     FETCH STATS
  ========================= */

  const fetchStats =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            `${API}/stats`,
            {
              headers:
                getAdminHeaders(),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setAuthError(
            "The backend rejected the admin token while loading statistics."
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to retrieve statistics."
          );
        }

        const data =
          await response.json();

        setStats(data);
      } catch (error) {
        console.error(error);
      }
    }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadAdmin = async () => {
      const authenticated =
        await checkAdminSession();

      if (
        !authenticated ||
        !active
      ) {
        if (active) {
          setCheckingAuth(false);
        }

        return;
      }

      await Promise.all([
        fetchInvites(),
        fetchStats(),
      ]);

      if (active) {
        setCheckingAuth(false);
      }
    };

    loadAdmin();

    return () => {
      active = false;
    };
  }, [
    checkAdminSession,
    fetchInvites,
    fetchStats,
  ]);

  /* =========================
     RETRY ADMIN AUTH
  ========================= */

  const retryAdminAuthentication =
    async () => {
      setCheckingAuth(true);
      setAuthError("");

      const authenticated =
        await checkAdminSession();

      if (authenticated) {
        await Promise.all([
          fetchInvites(),
          fetchStats(),
        ]);
      }

      setCheckingAuth(false);
    };

  /* =========================
     ADD MEMBER ROW
  ========================= */

  const addMemberRow = () => {
    setGroupMembers(
      (previous) => [
        ...previous,
        createEmptyMember(),
      ]
    );

    setMessage("");
  };

  /* =========================
     UPDATE ADD MEMBER
  ========================= */

  const updateMember = (
    id,
    field,
    value
  ) => {
    setGroupMembers(
      (previous) =>
        previous.map(
          (member) =>
            member.id === id
              ? {
                  ...member,
                  [field]:
                    value,
                }
              : member
        )
    );
  };

  /* =========================
     REMOVE ADD MEMBER
  ========================= */

  const removeMemberRow = (id) => {
    if (
      groupMembers.length === 1
    ) {
      return;
    }

    setGroupMembers(
      (previous) =>
        previous.filter(
          (member) =>
            member.id !== id
        )
    );
  };

  /* =========================
     RESET ADD FORM
  ========================= */

  const resetAddForm = () => {
    setGroupName("");

    setGroupMembers([
      createEmptyMember(),
    ]);

    setMessage("");
  };

  /* =========================
     SAVE INVITE GROUP
  ========================= */

  const saveInviteGroup =
    async (e) => {
      e.preventDefault();

      const cleanedMembers =
        groupMembers.map(
          (member) => ({
            name:
              member.name.trim(),

            rsvpStatus:
              member.rsvpStatus,

            inviteType:
              member.inviteType,
          })
        );

      if (
        cleanedMembers.length ===
        0
      ) {
        setMessage(
          "Please enter at least one name."
        );

        return;
      }

      const hasEmptyRows =
        cleanedMembers.some(
          (member) =>
            !member.name
        );

      if (hasEmptyRows) {
        setMessage(
          "Please fill in every name or remove the empty row."
        );

        return;
      }

      const duplicateNames =
        cleanedMembers.some(
          (
            member,
            index
          ) =>
            cleanedMembers.findIndex(
              (other) =>
                other.name.toLowerCase() ===
                member.name.toLowerCase()
            ) !== index
        );

      if (duplicateNames) {
        setMessage(
          "The same person cannot be added twice."
        );

        return;
      }

      let finalGroupName =
        groupName.trim();

      if (!finalGroupName) {
        const firstPersonName =
          cleanedMembers[0].name.split(
            /\s+/
          );

        const lastName =
          firstPersonName[
            firstPersonName.length -
              1
          ];

        if (
          cleanedMembers.length >
          1
        ) {
          finalGroupName =
            `${lastName} Family`;
        } else {
          finalGroupName =
            cleanedMembers[0].name;
        }
      }

      try {
        setSaving(true);
        setMessage("");

        const response =
          await fetch(
            `${API}/group`,
            {
              method: "POST",

              headers:
                getAdminHeaders({
                  "Content-Type":
                    "application/json",
                }),

              body:
                JSON.stringify({
                  groupName:
                    finalGroupName,

                  members:
                    cleanedMembers,
                }),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setAuthError(
            "The backend rejected the admin token while saving an invitation."
          );

          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          setMessage(
            data.message ||
              "Failed to save invite."
          );

          return;
        }

        resetAddForm();

        setMessage(
          "Invite saved successfully."
        );

        await fetchInvites();
        await fetchStats();

        setTimeout(() => {
          setShowAddForm(
            false
          );

          setMessage("");
        }, 800);
      } catch (error) {
        console.error(error);

        setMessage(
          "Failed to connect to server."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================
     OPEN EDIT GROUP
  ========================= */

  const startEditingGroup = (
    group
  ) => {
    setShowAddForm(false);
    setShowFilters(false);

    const fullGroupMembers =
      invites.filter(
        (invite) =>
          (invite.groupId ||
            invite._id) ===
          group.groupId
      );

    const membersToEdit =
      fullGroupMembers.length > 0
        ? fullGroupMembers
        : group.members || [];

    setEditingGroupId(
      group.groupId
    );

    setEditGroupName(
      group.groupName
    );

    setEditMembers(
      membersToEdit.map(
        (member) => ({
          _id:
            member._id,

          name:
            member.name,

          rsvpStatus:
            member.rsvpStatus,

          inviteType:
            member.inviteType,
        })
      )
    );

    setEditMessage("");
  };

  /* =========================
     UPDATE EDIT MEMBER
  ========================= */

  const updateEditMember = (
    id,
    field,
    value
  ) => {
    setEditMembers(
      (previous) =>
        previous.map(
          (member) =>
            member._id === id
              ? {
                  ...member,
                  [field]:
                    value,
                }
              : member
        )
    );
  };

  /* =========================
     REMOVE EDIT MEMBER
  ========================= */

  const removeEditMember = (
    id
  ) => {
    if (
      editMembers.length === 1
    ) {
      setEditMessage(
        "A group must contain at least one person."
      );

      return;
    }

    setEditMembers(
      (previous) =>
        previous.filter(
          (member) =>
            member._id !== id
        )
    );

    setEditMessage("");
  };

  /* =========================
     CANCEL EDIT
  ========================= */

  const cancelEdit = () => {
    setEditingGroupId(null);
    setEditGroupName("");
    setEditMembers([]);
    setEditMessage("");
  };

  /* =========================
     SAVE EDITED GROUP
  ========================= */

  const saveEditedGroup = async (e) => {
    e.preventDefault();

    if (!editingGroupId) {
      setEditMessage("No group is selected for editing.");
      return;
    }

    if (editMembers.length === 0) {
      setEditMessage(
        "The group must contain at least one person."
      );
      return;
    }

    const cleanedMembers = editMembers.map(
      (member) => ({
        _id: member._id,
        name: member.name.trim(),
        rsvpStatus: member.rsvpStatus,
        inviteType: member.inviteType,
      })
    );

    const hasEmptyName = cleanedMembers.some(
      (member) => !member.name
    );

    if (hasEmptyName) {
      setEditMessage(
        "Every person must have a name."
      );
      return;
    }

    const duplicateNames =
      cleanedMembers.some(
        (member, index) =>
          cleanedMembers.findIndex(
            (other) =>
              other.name.toLowerCase() ===
              member.name.toLowerCase()
          ) !== index
      );

    if (duplicateNames) {
      setEditMessage(
        "The same person cannot appear twice."
      );
      return;
    }

    if (!editGroupName.trim()) {
      setEditMessage(
        "Please enter a group name."
      );
      return;
    }

    try {
      setSavingEdit(true);
      setEditMessage("");

      const response = await fetch(
        `${API}/group/${encodeURIComponent(
          editingGroupId
        )}`,
        {
          method: "PATCH",

          headers:
            getAdminHeaders({
              "Content-Type":
                "application/json",
            }),
          body: JSON.stringify({
            groupName:
              editGroupName.trim(),
            members: cleanedMembers,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setAuthError(
          "The backend rejected the admin token while editing a group."
        );

        return;
      }

      /*
        Do not call response.json() directly.
        Express may return plain text/HTML when a
        route is missing, which would otherwise
        hide the real error behind a JSON parse error.
      */
      const responseText =
        await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch {
          data = {
            message:
              responseText,
          };
        }
      }

      if (!response.ok) {
        console.error(
          "Edit group failed:",
          response.status,
          data
        );

        setEditMessage(
          data.message ||
            `Failed to update group (${response.status}).`
        );
        return;
      }

      await Promise.all([
        fetchInvites(),
        fetchStats(),
      ]);

      cancelEdit();
    } catch (error) {
      console.error(
        "Edit group request error:",
        error
      );

      setEditMessage(
        "Could not save changes. Please check the backend connection and try again."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /* =========================
     DELETE WHOLE GROUP
  ========================= */

  const deleteWholeGroup = async () => {
    if (!editingGroupId || deletingGroup) {
      return;
    }

    /*
       Always rebuild the complete group from
       the original invite list. This prevents
       staged member removals in the edit form
       from leaving people behind.
    */
    const fullGroupMembers =
      invites.filter(
        (invite) =>
          (invite.groupId ||
            invite._id) ===
          editingGroupId
      );

    if (fullGroupMembers.length === 0) {
      setEditMessage(
        "No members were found for this group."
      );
      return;
    }

    const groupLabel =
      editGroupName.trim() ||
      fullGroupMembers[0]?.groupName ||
      "this group";

    const confirmed =
      window.confirm(
        `Delete the entire "${groupLabel}" group and all ${fullGroupMembers.length} ${
          fullGroupMembers.length === 1
            ? "person"
            : "people"
        }? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingGroup(true);
      setEditMessage("");

      const responses =
        await Promise.all(
          fullGroupMembers.map(
            (member) =>
              fetch(
                `${API}/${member._id}`,
                {
                  method: "DELETE",

                  headers:
                    getAdminHeaders(),
                }
              )
          )
        );

      const unauthorized =
        responses.some(
          (response) =>
            response.status === 401 ||
            response.status === 403
        );

      if (unauthorized) {
        setAuthError(
          "The backend rejected the admin token while deleting a group."
        );

        return;
      }

      const failed =
        responses.find(
          (response) =>
            !response.ok
        );

      if (failed) {
        throw new Error(
          `Failed to delete group (${failed.status}).`
        );
      }

      cancelEdit();

      await Promise.all([
        fetchInvites(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error(
        "Delete group error:",
        error
      );

      setEditMessage(
        "Could not delete the group. Please try again."
      );
    } finally {
      setDeletingGroup(false);
    }
  };

  /* =========================
     DELETE ONE PERSON
  ========================= */

  const deleteInvite =
    async (id) => {
      const confirmed =
        window.confirm(
          "Remove this person from the invite list?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/${id}`,
            {
              method:
                "DELETE",

              headers:
                getAdminHeaders(),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setAuthError(
            "The backend rejected the admin token while deleting an invitation."
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to delete invite."
          );
        }

        await fetchInvites();
        await fetchStats();
      } catch (error) {
        console.error(error);
      }
    };

  /* =========================
     SEARCH + FILTER
  ========================= */

  const filteredInvites =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      const matchingGroupIds =
        new Set();

      invites.forEach(
        (invite) => {
          const nameMatches =
            invite.name
              ?.toLowerCase()
              .includes(
                searchText
              );

          const groupMatches =
            invite.groupName
              ?.toLowerCase()
              .includes(
                searchText
              );

          if (
            !searchText ||
            nameMatches ||
            groupMatches
          ) {
            matchingGroupIds.add(
              invite.groupId ||
                invite._id
            );
          }
        }
      );

      return invites.filter(
        (invite) => {
          const groupKey =
            invite.groupId ||
            invite._id;

          const matchesSearch =
            !searchText ||
            matchingGroupIds.has(
              groupKey
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            invite.rsvpStatus ===
              statusFilter;

          const matchesType =
            typeFilter ===
              "All" ||
            invite.inviteType ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      invites,
      search,
      statusFilter,
      typeFilter,
    ]);

  /* =========================
     GROUP INVITES
  ========================= */

  const groupedInvites =
    useMemo(() => {
      const groups = {};

      filteredInvites.forEach(
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
          ].members.push(
            invite
          );
        }
      );

      return Object.values(
        groups
      );
    }, [filteredInvites]);

  /* =========================
     TYPE COLOR
  ========================= */

  const getInviteTypeClass = (
    type
  ) => {
    if (type === "Guest") {
      return "type-guest";
    }

    if (
      type ===
      "Family Member"
    ) {
      return "type-family";
    }

    return "type-entourage";
  };

  /* =========================
     STATUS COLOR
  ========================= */

  const getStatusClass = (
    status
  ) => {
    if (
      status === "Going"
    ) {
      return "status-going";
    }

    if (
      status ===
      "Not Going"
    ) {
      return "status-not-going";
    }

    return "status-pending";
  };

  /* =========================
     STATUS DISPLAY
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

  /* =========================
     RESET FILTERS
  ========================= */

  const resetFilters = () => {
    setStatusFilter("All");
    setTypeFilter("All");
  };

  /* =========================
     TOGGLE NORMAL / TABLE VIEW
  ========================= */

  const toggleViewMode = () => {
    cancelEdit();
    setShowAddForm(false);
    setShowFilters(false);

    setViewMode(
      (previous) =>
        previous === "normal"
          ? "table"
          : "normal"
    );
  };

  const openTableRowEdit = (
    invite
  ) => {
    const groupId =
      invite.groupId ||
      invite._id;

    setViewMode("normal");

    startEditingGroup({
      groupId,
      groupName:
        invite.groupName ||
        invite.name,
      members: [],
    });
  };

  /* =========================
     ADMIN LOGOUT
     Clicking RSVP Dashboard logs out.
  ========================= */

  const handleLogout = async () => {
    try {
      const token =
        getAdminToken();

      if (token) {
        await fetch(
          `${ADMIN_API}/logout`,
          {
            method: "POST",

            headers:
              getAdminHeaders(),
          }
        );
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      clearAdminToken();

      navigate("/", {
        replace: true,
      });

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  };

  /* =========================
     DONUT CHART
  ========================= */

  const pendingEnd =
    stats.percentages.pending;

  const goingEnd =
    stats.percentages.pending +
    stats.percentages.going;

  if (checkingAuth) {
    return (
      <main className="admin-page">
        <div className="admin-dashboard">
          <p className="admin-message">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="admin-page">
        <div className="admin-dashboard">
          <h1 className="admin-title">
            Admin Access
          </h1>

          <p className="admin-message">
            {authError}
          </p>

          <p className="admin-message">
            Your login token is still saved.
            If this says 401, the backend
            /api/admin/check route is rejecting
            the Bearer token.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent:
                "center",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
            <button
              type="button"
              className="save-invite-button"
              onClick={
                retryAdminAuthentication
              }
            >
              Retry
            </button>

            <button
              type="button"
              className="edit-cancel-button"
              onClick={() => {
                clearAdminToken();

                navigate("/", {
                  replace: true,
                });
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-dashboard">

        {/* =====================
            TITLE
        ===================== */}

        <h1
          className="admin-title admin-title-logout"
          onClick={handleLogout}
          role="button"
          tabIndex={0}
          title="Click to logout"
          aria-label="Logout from admin dashboard"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              handleLogout();
            }
          }}
        >
          RSVP Dashboard
        </h1>

        {/* =====================
            CHART
        ===================== */}

        <section className="dashboard-chart-card">
          <div
            className="dashboard-donut"
            style={{
              background:
                stats.total === 0
                  ? "#eeeeee"
                  : `conic-gradient(
                      #ffed4a 0% ${pendingEnd}%,
                      #747400 ${pendingEnd}% ${goingEnd}%,
                      #bd001d ${goingEnd}% 100%
                    )`,
            }}
          >
            <div className="dashboard-donut-hole" />
          </div>

          <div className="dashboard-chart-info">
            <div className="chart-legend-row">
              <span className="legend-dot legend-pending" />

              <span>
                Not Yet Answered
              </span>
            </div>

            <div className="chart-legend-row">
              <span className="legend-dot legend-going" />

              <span>
                Going
              </span>
            </div>

            <div className="chart-legend-row">
              <span className="legend-dot legend-not-going" />

              <span>
                Not Going
              </span>
            </div>

            <p className="chart-total">
              Total: {stats.total}
            </p>
          </div>
        </section>

        {/* =====================
            SEARCH
        ===================== */}

        <div className="admin-search">
          <span className="admin-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search invite"
          />
        </div>

        {/* =====================
            TOOLBAR
        ===================== */}

        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <button
              type="button"
              className="admin-icon-button add-icon-button"
              onClick={() => {
                if (
                  !showAddForm
                ) {
                  resetAddForm();
                }

                cancelEdit();

                setShowAddForm(
                  !showAddForm
                );

                setShowFilters(
                  false
                );
              }}
              title="Add invite"
            >
              +
            </button>

            <button
              type="button"
              className="admin-icon-button filter-icon-button"
              onClick={() => {
                cancelEdit();

                setShowFilters(
                  !showFilters
                );

                setShowAddForm(
                  false
                );
              }}
              title="Filter invites"
            >
              <span className="filter-lines">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          <button
            type="button"
            className={`admin-list-button ${
              viewMode === "table"
                ? "active"
                : ""
            }`}
            title={
              viewMode === "normal"
                ? "Switch to table view"
                : "Switch to normal view"
            }
            aria-label={
              viewMode === "normal"
                ? "Switch to table view"
                : "Switch to normal view"
            }
            aria-pressed={
              viewMode === "table"
            }
            onClick={
              toggleViewMode
            }
          >
            <span
              className="view-toggle-symbol"
              aria-hidden="true"
            >
              {viewMode === "normal"
                ? "☷"
                : "▦"}
            </span>
          </button>
        </div>

        {/* =====================
            ADD INVITE
        ===================== */}

        {showAddForm && (
          <section className="admin-add-popup">
            <h2>
              Add Invite
            </h2>

            <form
              onSubmit={
                saveInviteGroup
              }
            >
              {/* HEADERS */}

              <div className="admin-member-header admin-member-header-three">
                <span>
                  Name
                </span>

                <span>
                  Status
                </span>

                <span>
                  Type
                </span>
              </div>

              {/* ROWS */}

              <div className="admin-member-rows">
                {groupMembers.map(
                  (
                    member,
                    index
                  ) => (
                    <div
                      className="admin-member-input-row admin-member-input-row-three"
                      key={
                        member.id
                      }
                    >
                      <input
                        type="text"
                        value={
                          member.name
                        }
                        onChange={(
                          e
                        ) =>
                          updateMember(
                            member.id,
                            "name",
                            e.target
                              .value
                          )
                        }
                        placeholder="First name and last name"
                        autoFocus={
                          index ===
                          0
                        }
                      />

                      <select
                        value={
                          member.rsvpStatus
                        }
                        onChange={(
                          e
                        ) =>
                          updateMember(
                            member.id,
                            "rsvpStatus",
                            e.target
                              .value
                          )
                        }
                      >
                        <option value="Pending">
                          No Answer Yet
                        </option>

                        <option value="Going">
                          Going
                        </option>

                        <option value="Not Going">
                          Not Going
                        </option>
                      </select>

                      <select
                        value={
                          member.inviteType
                        }
                        onChange={(
                          e
                        ) =>
                          updateMember(
                            member.id,
                            "inviteType",
                            e.target
                              .value
                          )
                        }
                      >
                        <option value="Guest">
                          Guest
                        </option>

                        <option value="Family Member">
                          Family Member
                        </option>

                        <option value="Bridesmaid/Groomsman">
                          Bridesmaid/Groomsman
                        </option>
                      </select>

                      {groupMembers.length >
                        1 && (
                        <button
                          type="button"
                          className="remove-member-row"
                          onClick={() =>
                            removeMemberRow(
                              member.id
                            )
                          }
                          title="Remove this row"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                className="add-member-plus"
                onClick={
                  addMemberRow
                }
                title="Add another person"
              >
                +
              </button>

              {/* GROUP NAME */}

              <div className="admin-group-name-section">
                <label htmlFor="groupName">
                  Group Name
                </label>

                <input
                  id="groupName"
                  type="text"
                  value={
                    groupName
                  }
                  onChange={(e) =>
                    setGroupName(
                      e.target.value
                    )
                  }
                  placeholder="Optional, e.g. Labayne Family"
                />

                <small>
                  Leave blank to
                  create the group
                  name automatically.
                </small>
              </div>

              {message && (
                <p className="admin-message">
                  {message}
                </p>
              )}

              <div className="admin-save-wrapper">
                <button
                  type="submit"
                  className="save-invite-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Add Invite"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =====================
            FILTER
        ===================== */}

        {showFilters && (
          <section className="admin-filter-panel">

            <div className="filter-section">
              <h2>
                Status
              </h2>

              <div className="filter-button-grid">
                <button
                  type="button"
                  className={`filter-box status-all ${
                    statusFilter ===
                    "All"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(
                      "All"
                    )
                  }
                >
                  All Invites
                </button>

                <button
                  type="button"
                  className={`filter-box status-option ${
                    statusFilter ===
                    "Going"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(
                      "Going"
                    )
                  }
                >
                  Going
                </button>

                <button
                  type="button"
                  className={`filter-box status-option ${
                    statusFilter ===
                    "Not Going"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(
                      "Not Going"
                    )
                  }
                >
                  Not Going
                </button>

                <button
                  type="button"
                  className={`filter-box status-option ${
                    statusFilter ===
                    "Pending"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(
                      "Pending"
                    )
                  }
                >
                  Not yet Answered
                </button>
              </div>
            </div>

            <div className="filter-section">
              <h2>
                Type
              </h2>

              <div className="filter-button-grid">
                <button
                  type="button"
                  className={`filter-box type-all ${
                    typeFilter ===
                    "All"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTypeFilter(
                      "All"
                    )
                  }
                >
                  All Invites
                </button>

                <button
                  type="button"
                  className={`filter-box type-option ${
                    typeFilter ===
                    "Guest"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTypeFilter(
                      "Guest"
                    )
                  }
                >
                  Guest
                </button>

                <button
                  type="button"
                  className={`filter-box type-option ${
                    typeFilter ===
                    "Family Member"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTypeFilter(
                      "Family Member"
                    )
                  }
                >
                  Family
                </button>

                <button
                  type="button"
                  className={`filter-box type-option ${
                    typeFilter ===
                    "Bridesmaid/Groomsman"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTypeFilter(
                      "Bridesmaid/Groomsman"
                    )
                  }
                >
                  Bridesmaid/
                  <br />
                  Groomsman
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =====================
            INVITE VIEW
        ===================== */}

        {viewMode === "normal" ? (
        <section className="family-list">
          {groupedInvites.map(
            (group) => (
              <article
                className="family-card"
                key={
                  group.groupId
                }
              >

                {/* NORMAL CARD */}

                {editingGroupId !==
                group.groupId ? (
                  <>
                    <div className="family-card-header">
                      <h2>
                        {
                          group.groupName
                        }
                      </h2>

                      <button
                        type="button"
                        className="family-edit-button"
                        title="Edit group"
                        onClick={() =>
                          startEditingGroup(
                            group
                          )
                        }
                      >
                        <img
                          src={
                            editIcon
                          }
                          alt="Edit"
                          className="family-edit-icon"
                        />
                      </button>
                    </div>

                    <div className="family-members">
                      {group.members.map(
                        (
                          invite
                        ) => (
                          <div
                            className="family-member"
                            key={
                              invite._id
                            }
                          >
                            <span className="member-name">
                              {
                                invite.name
                              }
                            </span>

                            <span
                              className={`member-type ${getInviteTypeClass(
                                invite.inviteType
                              )}`}
                            >
                              {
                                invite.inviteType
                              }
                            </span>

                            <span
                              className={`member-status ${getStatusClass(
                                invite.rsvpStatus
                              )}`}
                            >
                              {getStatusLabel(
                                invite.rsvpStatus
                              )}
                            </span>

                            <button
                              type="button"
                              className="member-delete"
                              onClick={() =>
                                deleteInvite(
                                  invite._id
                                )
                              }
                              title="Delete invite"
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  /* =====================
                     EDIT CARD
                  ===================== */

                  <form
                    className="edit-group-form"
                    onSubmit={
                      saveEditedGroup
                    }
                  >
                    <div className="edit-group-top">
                      <div className="edit-group-name-field">
                        <label>
                          Group Name
                        </label>

                        <input
                          type="text"
                          value={
                            editGroupName
                          }
                          onChange={(
                            e
                          ) =>
                            setEditGroupName(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="edit-member-header">
                      <span>
                        Name
                      </span>

                      <span>
                        Status
                      </span>

                      <span>
                        Type
                      </span>

                      <span />
                    </div>

                    <div className="edit-member-list">
                      {editMembers.map(
                        (
                          member
                        ) => (
                          <div
                            className="edit-member-row"
                            key={
                              member._id
                            }
                          >
                            <input
                              type="text"
                              value={
                                member.name
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditMember(
                                  member._id,
                                  "name",
                                  e
                                    .target
                                    .value
                                )
                              }
                            />

                            <select
                              value={
                                member.rsvpStatus
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditMember(
                                  member._id,
                                  "rsvpStatus",
                                  e
                                    .target
                                    .value
                                )
                              }
                            >
                              <option value="Pending">
                                No Answer Yet
                              </option>

                              <option value="Going">
                                Going
                              </option>

                              <option value="Not Going">
                                Not Going
                              </option>
                            </select>

                            <select
                              value={
                                member.inviteType
                              }
                              onChange={(
                                e
                              ) =>
                                updateEditMember(
                                  member._id,
                                  "inviteType",
                                  e
                                    .target
                                    .value
                                )
                              }
                            >
                              <option value="Guest">
                                Guest
                              </option>

                              <option value="Family Member">
                                Family Member
                              </option>

                              <option value="Bridesmaid/Groomsman">
                                Bridesmaid/Groomsman
                              </option>
                            </select>

                            <button
                              type="button"
                              className="edit-remove-member"
                              onClick={() =>
                                removeEditMember(
                                  member._id
                                )
                              }
                              title="Remove person"
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {editMessage && (
                      <p className="edit-group-message">
                        {
                          editMessage
                        }
                      </p>
                    )}

                    <div className="edit-group-actions">
                      <button
                        type="button"
                        className="edit-cancel-button"
                        onClick={
                          cancelEdit
                        }
                        disabled={
                          savingEdit ||
                          deletingGroup
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="edit-delete-group-button"
                        onClick={
                          deleteWholeGroup
                        }
                        disabled={
                          savingEdit ||
                          deletingGroup
                        }
                        style={{
                          border:
                            "1px solid #bd001d",
                          background:
                            "#bd001d",
                          color:
                            "#ffffff",
                          borderRadius:
                            "6px",
                          padding:
                            "9px 14px",
                          fontFamily:
                            '"Adobe Jenson Pro", serif',
                          fontWeight:
                            600,
                          cursor:
                            deletingGroup
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {deletingGroup
                          ? "Deleting..."
                          : "Delete Group"}
                      </button>

                      <button
                        type="submit"
                        className="edit-save-button"
                        disabled={
                          savingEdit ||
                          deletingGroup
                        }
                      >
                        {savingEdit
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            )
          )}

          {groupedInvites.length ===
            0 && (
            <div className="admin-no-results">
              No invitations found.
            </div>
          )}
        </section>
        ) : (
          <section className="admin-table-view">
            <div className="admin-table-heading">
              <h2>
                Invite List
              </h2>

              <span>
                {filteredInvites.length}
                {" "}
                {filteredInvites.length === 1
                  ? "name"
                  : "names"}
              </span>
            </div>

            {filteredInvites.length > 0 ? (
              <div className="admin-table-wrapper">
                <table className="admin-invite-table">
                  <thead>
                    <tr>
                      <th>
                        Name
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Status
                      </th>

                      <th
                        className="table-action-heading"
                        aria-label="Actions"
                      />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvites.map(
                      (invite) => (
                        <tr
                          key={
                            invite._id
                          }
                        >
                          <td className="table-name-cell">
                            {
                              invite.name
                            }
                          </td>

                          <td>
                            <span
                              className={`table-type ${getInviteTypeClass(
                                invite.inviteType
                              )}`}
                            >
                              {
                                invite.inviteType
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`table-status ${getStatusClass(
                                invite.rsvpStatus
                              )}`}
                            >
                              {getStatusLabel(
                                invite.rsvpStatus
                              )}
                            </span>
                          </td>

                          <td className="table-action-cell">
                            <button
                              type="button"
                              className="table-edit-button"
                              onClick={() =>
                                openTableRowEdit(
                                  invite
                                )
                              }
                              title={`Edit ${
                                invite.groupName ||
                                invite.name
                              }`}
                              aria-label={`Edit ${
                                invite.groupName ||
                                invite.name
                              }`}
                            >
                              <img
                                src={
                                  editIcon
                                }
                                alt=""
                                className="table-edit-icon"
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-no-results">
                No invitations found.
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

export default Admin;
