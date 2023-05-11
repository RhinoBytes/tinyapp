const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function urlsForUser(id) {
  const userUrls = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls.push({ shortURL: url, longURL: urlDatabase[url].longURL });
    }
  }
  return userUrls;
}

function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const characterLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characterLength));
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

app.use(express.urlencoded({extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
})

app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("register", { user });
  }
});

app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id ;
  const user = users[userId];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});


app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId]
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
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
  res.clearCookie('user_id');
  res.redirect('/login');
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(user => user.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send("Email or password is incorrect.");
  }
});


app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password fields are required.");
  }
  const userExists = Object.values(users).some(user => user.email === email);
  if (userExists) {
    return res.status(400).send("Email is already registered.");
  }
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10)
  console.log(hashedPassword);
  users[userId] = { id: userId, email, password: hashedPassword };
  console.log(users);
  res.cookie('user_id', userId);
  res.redirect('/urls');
});


app.post("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id;
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
