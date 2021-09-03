const functions = require("firebase-functions");

const { firebasePollsRef } = require("../helper/dbHelper");

exports.add = async (groupId, pollInfo, requestedBy, date) => {
  const newPollRef = await firebasePollsRef.push();
  await newPollRef.set({
    groupId: groupId,
    question: pollInfo.question,
    options: pollInfo.options,
    enabled: true,
    requested_by: requestedBy,
    created_at: date,
    updated_at: date,
  });
  functions.logger.log(await newPollRef.key);
};

exports.getAll = async (groupId) => {
  return firebasePollsRef.orderByChild("groupId").equalTo(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};
