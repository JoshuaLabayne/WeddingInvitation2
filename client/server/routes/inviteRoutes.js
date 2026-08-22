const express = require("express");
const crypto = require("crypto");

const Invite = require(
  "../models/Invite"
);

const requireAdmin = require(
  "../middleware/requireAdmin"
);

const router =
  express.Router();

/* =========================
   HELPERS
========================= */

const allowedTypes = [
  "Guest",
  "Family Member",
  "Bridesmaid/Groomsman",
];

const allowedStatuses = [
  "Pending",
  "Going",
  "Not Going",
];

const escapeRegex = (
  value
) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* =========================
   GET ALL INVITES
   ADMIN ONLY
========================= */

router.get(
  "/",
  requireAdmin,
  async (req, res) => {
    try {
      const invites =
        await Invite.find().sort({
          createdAt: -1,
        });

      res.json(invites);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to retrieve invites.",
      });
    }
  }
);

/* =========================
   STATS
   ADMIN ONLY
========================= */

router.get(
  "/stats",
  requireAdmin,
  async (req, res) => {
    try {
      const total =
        await Invite.countDocuments();

      const going =
        await Invite.countDocuments({
          rsvpStatus: "Going",
        });

      const notGoing =
        await Invite.countDocuments({
          rsvpStatus: "Not Going",
        });

      const pending =
        await Invite.countDocuments({
          rsvpStatus: "Pending",
        });

      const percentage = (
        value
      ) => {
        if (total === 0) {
          return 0;
        }

        return Number(
          (
            (value / total) *
            100
          ).toFixed(1)
        );
      };

      res.json({
        total,
        going,
        notGoing,
        pending,

        percentages: {
          going:
            percentage(
              going
            ),

          notGoing:
            percentage(
              notGoing
            ),

          pending:
            percentage(
              pending
            ),
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to retrieve statistics.",
      });
    }
  }
);

/* =========================
   SEARCH NAME
   PUBLIC
   RETURN WHOLE GROUP
========================= */

router.get(
  "/search",
  async (req, res) => {
    try {
      const search =
        req.query.name?.trim();

      if (!search) {
        return res.json([]);
      }

      const safeSearch =
        escapeRegex(search);

      const matched =
        await Invite.find({
          name: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        });

      if (
        matched.length === 0
      ) {
        return res.json([]);
      }

      const groupIds = [
        ...new Set(
          matched.map(
            (invite) =>
              invite.groupId
          )
        ),
      ];

      const groupMembers =
        await Invite.find({
          groupId: {
            $in: groupIds,
          },
        }).sort({
          groupName: 1,
          name: 1,
        });

      res.json(
        groupMembers
      );
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to search invites.",
      });
    }
  }
);

/* =========================
   CREATE GROUP
   ADMIN ONLY
========================= */

router.post(
  "/group",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        groupName,
        members,
      } = req.body;

      if (
        !groupName?.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Group name is required.",
          });
      }

      if (
        !Array.isArray(
          members
        ) ||
        members.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "At least one person is required.",
          });
      }

      for (
        const member of members
      ) {
        if (
          !member.name?.trim()
        ) {
          return res
            .status(400)
            .json({
              message:
                "Every person must have a name.",
            });
        }

        if (
          !allowedTypes.includes(
            member.inviteType
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid invite type.",
            });
        }

        const status =
          member.rsvpStatus ||
          "Pending";

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid RSVP status.",
            });
        }

        const safeName =
          escapeRegex(
            member.name.trim()
          );

        const existing =
          await Invite.findOne({
            name: {
              $regex:
                `^${safeName}$`,

              $options:
                "i",
            },
          });

        if (existing) {
          return res
            .status(409)
            .json({
              message:
                `${member.name} is already on the invite list.`,
            });
        }
      }

      const groupId =
        crypto.randomUUID();

      const newInvites =
        members.map(
          (member) => ({
            name:
              member.name.trim(),

            inviteType:
              member.inviteType,

            rsvpStatus:
              member.rsvpStatus ||
              "Pending",

            groupId,

            groupName:
              groupName.trim(),
          })
        );

      const created =
        await Invite.insertMany(
          newInvites
        );

      res.status(201).json({
        message:
          "Invite group created successfully.",

        groupId,

        groupName:
          groupName.trim(),

        members:
          created,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to create invite group.",
      });
    }
  }
);

/* =========================
   EDIT WHOLE GROUP
   ADMIN ONLY
========================= */

router.patch(
  "/group/:groupId",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        groupName,
        members,
      } = req.body;

      const groupId =
        req.params.groupId;

      if (
        !groupName?.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Group name is required.",
          });
      }

      if (
        !Array.isArray(
          members
        ) ||
        members.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "A group must contain at least one person.",
          });
      }

      const existingMembers =
        await Invite.find({
          groupId,
        });

      if (
        existingMembers.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Invite group not found.",
          });
      }

      const existingIds =
        new Set(
          existingMembers.map(
            (member) =>
              member._id.toString()
          )
        );

      for (
        const member of members
      ) {
        if (
          !member._id ||
          !existingIds.has(
            member._id
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid group member.",
            });
        }

        if (
          !member.name?.trim()
        ) {
          return res
            .status(400)
            .json({
              message:
                "Every person must have a name.",
            });
        }

        if (
          !allowedStatuses.includes(
            member.rsvpStatus
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid RSVP status.",
            });
        }

        if (
          !allowedTypes.includes(
            member.inviteType
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid invite type.",
            });
        }

        const safeName =
          escapeRegex(
            member.name.trim()
          );

        const duplicate =
          await Invite.findOne({
            _id: {
              $ne:
                member._id,
            },

            name: {
              $regex:
                `^${safeName}$`,

              $options:
                "i",
            },
          });

        if (duplicate) {
          return res
            .status(409)
            .json({
              message:
                `${member.name} is already on the invite list.`,
            });
        }
      }

      /* Delete removed members */

      const submittedIds =
        members.map(
          (member) =>
            member._id
        );

      await Invite.deleteMany({
        groupId,

        _id: {
          $nin:
            submittedIds,
        },
      });

      /* Update remaining members */

      for (
        const member of members
      ) {
        await Invite.findByIdAndUpdate(
          member._id,
          {
            name:
              member.name.trim(),

            groupName:
              groupName.trim(),

            inviteType:
              member.inviteType,

            rsvpStatus:
              member.rsvpStatus,
          },
          {
            runValidators: true,
          }
        );
      }

      const updatedGroup =
        await Invite.find({
          groupId,
        }).sort({
          name: 1,
        });

      res.json({
        message:
          "Invite group updated successfully.",

        groupId,

        groupName:
          groupName.trim(),

        members:
          updatedGroup,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update invite group.",
      });
    }
  }
);

/* =========================
   UPDATE RSVP ONLY
   PUBLIC
========================= */

router.patch(
  "/:id/rsvp",
  async (req, res) => {
    try {
      const {
        rsvpStatus,
      } = req.body;

      if (
        !allowedStatuses.includes(
          rsvpStatus
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid RSVP status.",
          });
      }

      const invite =
        await Invite.findByIdAndUpdate(
          req.params.id,

          {
            rsvpStatus,
          },

          {
            new: true,
            runValidators: true,
          }
        );

      if (!invite) {
        return res
          .status(404)
          .json({
            message:
              "Invite not found.",
          });
      }

      res.json(invite);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update RSVP.",
      });
    }
  }
);

/* =========================
   DELETE PERSON
   ADMIN ONLY
========================= */

router.delete(
  "/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const invite =
        await Invite.findByIdAndDelete(
          req.params.id
        );

      if (!invite) {
        return res
          .status(404)
          .json({
            message:
              "Invite not found.",
          });
      }

      res.json({
        message:
          "Invite deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to delete invite.",
      });
    }
  }
);

module.exports = router;    