const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const characterLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characterLength));
  }
  return result;
}

const users = {
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({extended: true }));

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(403).send("Invalid email or password");
  }
  res.cookie('userId', user.id);
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send("Please enter a value.");
  }
  if (Object.values(users).find(user => user.email === email)) {
    return res.status(400).send("Email already exists");
  }
  const userId = generateRandomString();
  const newUser = { id: userId, email, password };
  users[userId] = newUser;
  res.cookie('userId', userId);
  res.redirect('/urls');
  console.log(newUser);
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
});


app.post(`/urls/:id/delete`, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
})

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  if (!user) {
    return res.redirect('/login');
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});




app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  const templateVars = { user, id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});


app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { user };
  res.render("register", templateVars);
});


app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
