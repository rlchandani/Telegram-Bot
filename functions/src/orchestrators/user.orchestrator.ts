import { logger } from "firebase-functions";
import * as registeredUserDao from "../dao/registeredUser.dao";

const addUser = async (userId: any, userInfo: any, date: any) => {
  try {
    if (await registeredUserDao.add(userId, userInfo, date)) {
      logger.info(`User registered: ${userId}`);
    }
  } catch (err) {
    logger.error(`User failed to register for Id: ${userId}.`, err);
    throw err;
  }
};

const getAllUsers = async () => {
  const snapshot = await registeredUserDao.getAll();
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info("No user(s) found");
  return {};
};

const getUserById = async (userId: any) => {
  const snapshot = await registeredUserDao.get(userId);
  if (snapshot !== null && snapshot.enabled === true) {
    return snapshot;
  }
  logger.info(`No user found with id: ${userId}`);
  throw new Error(`No user found with id: ${userId}`);
};

const deRegisteredUser = async (userId: any) => {
  try {
    registeredUserDao.disable(userId);
    logger.log("User deregistered:", userId);
  } catch (err) {
    logger.error(`User failed to deregister for Id: ${userId}.`, err);
    throw err;
  }
};

const checkIfUserExist = async (userId: any) => {
  try {
    await getUserById(userId);
    return true;
  } catch (err) {
    return false;
  }
};

export { addUser, getAllUsers, getUserById, deRegisteredUser, checkIfUserExist };
