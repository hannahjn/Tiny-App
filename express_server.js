var express = require("express");
    // employ the express library
var app = express();
var PORT = 8080; // default port 8080
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
  for (var user in users) {
    if (user === loggedUser) {
      return true;
    }
  }
  return false;
};

function filterURL(user) {
  var temp = {};
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


var urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "userRandomID"
  },

  "9sm5xK": { 
    longURL: "http://www.google.com",
    ownerID: "userRandomID",
}
};

// console.log(bcrypt.hashSync('purple', 10));
var users = {
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
  var filter = filterURL(req.session.user_id);
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

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/login", (req, res) => {
  var userId = req.session.user_id;
  var templateVars = {
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
    var shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      ownerID: req.session.user_id
    }
    res.redirect(`/urls/${shortURL}`);
});


app.get("/register", (req, res) => {
  var cookieSesh = req.session.user_id;
  if(loggedIn(cookieSesh)){
    res.redirect('/');
  } else {
    res.render("registration");
  };
});


app.post("/register", (req, res) => {
  if(req.body.email && req.body.password){
    var isEmailTaken = false;

    for (var user in users) {
      isEmailTaken = req.body.email === users[user].email;
    }
    
    if (isEmailTaken) {
      return res.status(400).send("Error!");
    }
    
    var genRandom = generateRandomString();
        users[genRandom] = {
          id: genRandom,
          email: req.body.email,
          password: req.body.password
        }
    
    // console.log('register', req.body, hashedPassword, salt)
    req.session.user_id = genRandom;
    console.log('register: ', req.session);
    res.redirect("/urls");  
  } else {
    res.status(400).send("Error!");
  }
});

app.post("/login", (req, res) => {
  // console.log('login', bcrypt.compareSync(req.body.password, salt), req.body, salt)
  var foundUser;
  var cookieSesh = req.session.user_id;
  for(var user in users) {   
    var hash = bcrypt.compareSync(req.body.password, salt);
    if(users[user].email === req.body.email && users[user].password === req.body.password){
      foundUser = users[user]
    }
  }
  if(foundUser) {
    req.session.user_id = foundUser.id;
    console.log('found user: ', foundUser.id);
    res.render("/urls");
  } else {
    res.status(403).send("incorrect login details");
  }
});

app.get("/urls/:id", (req, res) => {
    var templateVars = {
      user: req.session.user_id,
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
    }
  // console.log(req.params);
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  var cookieSesh = req.session.user_id
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


app.post("/urls/:id/delete", (req, res) => {
  var cookieSesh = req.session.user_id
  if (loggedIn(cookieSesh)) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");  
  } else {
    res.status(403).send("Error!");
  }
});


app.post("/urls:id/edit", (req, res) => {
  // console.log("READ THIS: ", user_id)
  var cookieSesh = req.session.user_id
  if (loggedIn(cookieSesh)) {
    res.redirect("/urls/:id");
  } else {
    res.status(403).send("Error!");
  }
});

app.get("/u/:id", (req, res) => {
  var shortURL = req.params.id;
  var longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
