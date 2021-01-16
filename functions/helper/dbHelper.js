"use strict";

const admin = require("firebase-admin");

/**
 * Inializing Firebase
 */
admin.initializeApp();
exports.firebaseRegisteredGroupsRef = admin.database().ref("/registeredGroup/");
