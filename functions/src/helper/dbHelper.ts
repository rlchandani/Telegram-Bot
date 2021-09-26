import admin from "firebase-admin";

/**
 * Inializing Firebase
 */
admin.initializeApp();
const firebaseRegisteredGroupsRef = admin.database().ref("/registeredGroup/");
const firebaseRegisteredUsersRef = admin.database().ref("/registeredUser/");
const firebasePollsRef = admin.database().ref("/poll/");
const firebaseMessageRef = admin.database().ref("/message/");
const firebaseExpiringMessageRef = admin.database().ref("/expiringMessage/");
const firebasePinnedMessageRef = admin.database().ref("/pinnedMessage/");
const firebaseMentionedTickerRef = admin.database().ref("/mentionedTicker/");
const firebaseMentionedTickerNormalizedDailyRef = admin.database().ref("/mentionedTickerNormalizedDaily/");
const firebaseMentionedTickerNormalizedWeeklyRef = admin.database().ref("/mentionedTickerNormalizedWeekly/");
const firebaseWatchlistRef = admin.database().ref("/watchlist/");
const firebasePaperTradeRef = admin.database().ref("/paperTrade/");

export {
  firebaseRegisteredGroupsRef,
  firebaseRegisteredUsersRef,
  firebasePollsRef,
  firebaseMessageRef,
  firebaseExpiringMessageRef,
  firebasePinnedMessageRef,
  firebaseMentionedTickerRef,
  firebaseMentionedTickerNormalizedDailyRef,
  firebaseMentionedTickerNormalizedWeeklyRef,
  firebaseWatchlistRef,
  firebasePaperTradeRef
};
