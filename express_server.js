const express = require("express");
const cookieParser = require('cookie-parser');
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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  res.redirect(longURL);
})

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id ;
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
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
  const templateVars = { urlDatabase: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})


app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/login');
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(user => user.email === email && user.password === password);
  if (user) {
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
  users[userId] = { id: userId, email, password };
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
})

app.post(`/urls/:id/delete`, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
