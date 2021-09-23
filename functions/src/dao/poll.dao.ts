import { logger } from "firebase-functions";
import { firebasePollsRef } from "../helper/dbHelper";

const add = async (groupId: any, pollInfo: any, requestedBy: any, date: any) => {
  const newPollRef = await firebasePollsRef.push();
  await newPollRef.set({
    groupId: groupId,
    question: pollInfo.question,
    options: pollInfo.options,
    enabled: true,
    requested_by: requestedBy,
    created_at: date,
    updated_at: date
  });
  logger.log(newPollRef.key);
};

const getAll = async (groupId: any) => {
  return firebasePollsRef.orderByChild("groupId").equalTo(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

export { add, getAll };
