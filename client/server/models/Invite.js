const mongoose = require("mongoose");

const inviteSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      inviteType: {
        type: String,
        required: true,

        enum: [
          "Guest",
          "Family Member",
          "Bridesmaid/Groomsman",
        ],
      },

      groupId: {
        type: String,
        required: true,
        index: true,
      },

      groupName: {
        type: String,
        required: true,
        trim: true,
      },

      rsvpStatus: {
        type: String,

        enum: [
          "Pending",
          "Going",
          "Not Going",
        ],

        default: "Pending",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Invite",
    inviteSchema
  );