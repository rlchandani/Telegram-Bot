"use strict";

const admin = require("firebase-admin");

/**
 * Inializing Firebase
 */
admin.initializeApp();
exports.firebaseRegisteredGroupsRef = admin.database().ref("/registeredGroup/");
exports.firebaseRegisteredUsersRef = admin.database().ref("/registeredUser/");
exports.firebasePollsRef = admin.database().ref("/poll/");
exports.firebaseExpiringMessageRef = admin.database().ref("/expiringMessage/");
exports.firebaseMentionedTickerRef = admin.database().ref("/mentionedTicker/");
exports.firebasePaperTradeRef = admin.database().ref("/paperTrade/");
