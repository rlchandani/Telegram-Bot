"use strict";

const admin = require("firebase-admin");

/**
 * Inializing Firebase
 */
admin.initializeApp();
exports.firebaseRegisteredGroupsRef = admin.database().ref("/registeredGroup/");
exports.firebasePollsRef = admin.database().ref("/poll/");
