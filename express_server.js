let express = require("express");
let app = express();
let PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

function generateRandomString() {
  let resultStr = '';
  let possibleOutcomes = "iSaidAHipHopHippyHippyToTheHipHipHopYouDontStopTheRockWithTheBangBangBoogieSaidUpJumpTheBoogieToTheRythmnOfTheBoogieTheBeat";
  for (let i = 0; i < 6; i++) {
    resultStr += possibleOutcomes.charAt(Math.floor(Math.random() * possibleOutcomes.length));
  }
  return resultStr;
};

const loggedIn = (loggedUser) => {
  for (let user in users) {
    if (user === loggedUser) {
      return true;
    }
  }
  return false;
};

function filterURL(user) {
  let temp = {};
  for(const shortURL in urlDatabase ) {
    if (urlDatabase[shortURL].ownerID === user) {
      temp[shortURL] = urlDatabase[shortURL];
    }
  }
  return temp;
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
  name: 'session',
  keys: ['cookiesession1'],
  maxAge: 24 * 60 * 60 * 1000,
})
);

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "userRandomID"
  },

  "9sm5xK": { 
    longURL: "http://www.google.com",
    ownerID: "userRandomID",
}
};

let users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$7Z84PH4TS1118XOoJD2NNe3nlfwexJqP5Yp1GXH5PnU94AGY.TlKC"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "password2"
  }
};


app.get("/", (req, res) => {
  res.redirect('/urls');
});


app.get("/urls", (req, res) => {
  let filter = filterURL(req.session.user_id);
  let templateVars = {
    urls: filter, 
    user: users[req.session.user_id] 
  }
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id] 
  }
  res.render("urls_new", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  let templateVars = {
    user: userId
  }
  if (userId) {
    res.redirect('/urls');
  } else {
    res.render("login", templateVars); 
  }
});


app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});


app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      ownerID: req.session.user_id
    }
    res.redirect(`/urls/${shortURL}`);
});


app.get("/register", (req, res) => {
  let cookieSesh = req.session.user_id;
  if(loggedIn(cookieSesh)){
    res.redirect('/');
  } else {
    res.render("registration");
  };
});


app.post("/register", (req, res) => {
  // check for users already regisered
  if(req.body.email && req.body.password){
    let isEmailTaken = false;
    for (let user in users) {
      isEmailTaken = req.body.email === users[user].email;
    }
    if (isEmailTaken) {
      return res.status(400).send("Error!");
    }
    // store new user with hashed password
    let genRandom = generateRandomString();
        users[genRandom] = {
          id: genRandom,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, saltRounds)
        }
    
    req.session.user_id = genRandom;
    console.log('register: ', req.session);
    res.redirect("/urls");  
  } else {
    res.status(400).send("Error!");
  }
});


app.post("/login", (req, res) => {
  // use cookies to check if already registered
  let foundUser;
  let cookieSesh = req.session.user_id;
  for(let user in users) {
    let hash = bcrypt.compareSync(req.body.password, users[user].password);
    if(users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
      foundUser = users[user]
    }
  }
  // if pword and username match, login
  if(foundUser) {
    req.session.user_id = foundUser.id;
    res.redirect("/urls");
    // else send error message
  } else {
    res.status(403).send("incorrect login details");
  }
});


app.get("/urls/:id", (req, res) => {
  let templateVars = {
      user: req.session.user_id,
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
    }
  res.render("urls_show", templateVars);
});


app.post("/urls/:id", (req, res) => {
  let cookieSesh = req.session.user_id
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("Error!");
    return;
  } if (cookieSesh === undefined) {
    res.status(401).send("Error!");
    return;
  } if(urlDatabase[req.params.id].ownerID !== cookieSesh) {
    res.status(403).send("Error!");
    return;
  } if (loggedIn(cookieSesh)) {
    urlDatabase[req.params.id] = {
      longURL: req.body.longURL,
      ownerID: req.session.user_id
    }
    res.redirect("/urls/" + req.params.id);
  }
});


// delete url
app.post("/urls/:id/delete", (req, res) => {
  let cookieSesh = req.session.user_id
  if (loggedIn(cookieSesh)) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");  
  } else {
    res.status(403).send("Error!");
  }
});


// edit url
app.post("/urls:id/edit", (req, res) => {
  // console.log("READ THIS: ", user_id)
  let cookieSesh = req.session.user_id
  if (loggedIn(cookieSesh)) {
    res.redirect("/urls/:id");
  } else {
    res.status(403).send("Error!");
  }
});


// enable redirect to longURL site
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
