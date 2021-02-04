"use strict";

const functions = require("firebase-functions");
const fs = require("fs");
const robinhood = require("robinhood");
const { authenticator } = require("otplib");

const tokenFile = "/tmp/token.json";

const generateMFAToken = (apiKey) => authenticator.generate(apiKey);

const login = (username, password, apiKey) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(tokenFile) && (Date.now() - fs.statSync(tokenFile).mtime.getTime()) / 1000 < 86400) {
      const cachedToken = require(tokenFile);
      const credentials = {
        token: cachedToken.token,
      };
      functions.logger.info("Found cached credentials");
      resolve(robinhood(credentials));
    } else {
      const credentials = {
        username: username,
        password: password,
      };
      const Robinhood = robinhood(credentials, (data) => {
        if (data && data.mfa_required) {
          Robinhood.set_mfa_code(generateMFAToken(apiKey), async () => {
            const credentialJSON = {
              token: Robinhood.auth_token(),
            };
            await fs.promises.writeFile(tokenFile, JSON.stringify(credentialJSON));
            functions.logger.info("Credentials not found, caching credentials");
            resolve(Robinhood);
          });
        }
      });
    }
  });
};

exports.create = async (username, password, apiKey) => {
  functions.logger.info("Logging to Robinhood");
  return await login(username, password, apiKey);
};
