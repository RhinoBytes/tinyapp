const { urlDatabase} = require('./database.js');
const getUserByEmail = (email, users) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

// Create random ID
const generateRandomString = function() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const characterLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characterLength));
  }
  return result;
};

const urlsForUser = function(id) {
  const userUrls = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls.push({ shortURL: url, longURL: urlDatabase[url].longURL });
    }
  }
  return userUrls;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };