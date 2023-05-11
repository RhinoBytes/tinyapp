const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers.js");
const { urlDatabase, users } = require("./database.js");
const express = require("express");
const cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



app.use(express.urlencoded({extended: true }));

app.get("/", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
    return;
  }
});

app.get("/register", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("register", { user });
  }
});

app.get("/login", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("login", { user });
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(404).render("error", { message: "This shortened URL does not exist." });
  } else {
    res.redirect(longURL);
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});


app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId]
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  if (!user) {
    res.redirect("/login");
  } else {
    const userUrls = urlsForUser(userId);
    const templateVars = { urls: userUrls, user, urlDatabase };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})


app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

  const user = getUserByEmail(email, users);

  // Check if account is invalid
  if (!user) {
    return res.status(403).send("Invalid email");
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    return res.status(403).send("Invalid password");
  }

  req.session.userId = user.id;
  res.redirect("/urls");
});


app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }
  const user = getUserByEmail(email, users);

  if (user) {
    res.status(400).send("Email already exists");
    return;
  }

  const newUserID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[newUserID] = { id: newUserID, email, password: hashedPassword };
  req.session.userId = newUserID;
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(404).render("error", { message: "This shortened URL does not exist." });
  }

  if (!user) {
    return res.status(401).render("error", { message: "You need to be logged in to do that." });
  }

  if (url.userID !== userId) {
    return res.status(403).render("error", { message: "You do not own this URL." });
  }

  const newLongURL = req.body.longURL;
  urlDatabase[req.params.id].longURL = newLongURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  if (!user) {
    res.status(401).send("You must be logged in to delete a URL.");
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send("URL not found.");
  } else if (urlDatabase[req.params.id].userID !== userId) {
    res.status(403).send("You are not authorized to delete this URL.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  if (!user) {
    return res.status(401).send("You must be logged in to create a URL.");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: userId
  };
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
