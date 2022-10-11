// packages
const express = require("express");
const path = require('path');
const fs = require('fs');
const axios = require('axios')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('better-sqlite3')('comments.db');

// helper functions
async function asyncJWTsign(payload, secret) {
  return new Promise ((resolve, reject) => {
    jwt.sign(payload, secret, (err, token) => {
      if (err) return reject(err);
      resolve(token);
    });
  })  
}

async function asyncJWTverify(payload, secret) {
  return new Promise ((resolve, reject) => {
    jwt.verify(payload, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  })  
}

async function downloadPFP(userId, imageURL) {
  const pathToImage = path.resolve(__dirname, 'avatars', `${userId}.jpg`)
  const writer = fs.createWriteStream(pathToImage)

  const response = await axios({
    url: imageURL,
    method: 'GET',
    responseType: 'stream'
  })

  return new Promise((resolve, reject) => {
    response.data.pipe(writer)
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

function getScoreForComment(id) {
  let score = 0;
  const ratings = db.prepare('SELECT ratings.user_id, ratings.button from comments LEFT JOIN ratings ON comments.id = ratings.comment_id WHERE comments.id = ?').all(id);
  for (const rating of ratings) {
    if (rating.button === 1) score += 1;
    if (rating.button === -1) score -= 1;
  }
  return score;
}

// auth middleware
async function isLoggedIn(req, res, next) {
  if (!req.headers.authorization) return next();
  const token = req.headers.authorization.split('Bearer ')[1];
  if (!token) return next();
  try {
    const decoded = await asyncJWTverify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error!', error);
    next();
  }
  
}


// express config
const app = express();
const router = express.Router();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/avatars', express.static(path.join(__dirname, 'avatars')))

router.get("/", (req, res) => {
  res.send("Hello World!");
});

// Log into router or register new acoount
router.post('/login', async (req, res) => {
  console.log(req.body);

  // {
  //   iss: 'https://accounts.google.com',
  //   nbf: 1665334797,
  //   aud: '994169675178-u8tbg94a4midpvv5j0loi83vm843mjr2.routers.googleusercontent.com',
  //   sub: '103615500697380649858',
  //   email: 'omnichrome2@gmail.com',
  //   email_verified: true,
  //   azp: '994169675178-u8tbg94a4midpvv5j0loi83vm843mjr2.routers.googleusercontent.com',
  //   name: 'Lucca Rodrigues',
  //   picture: 'https://lh3.googleusercontent.com/a/ALm5wu3JS9---a37fJq1ZM5G4XUF3FUGqMQDoyqZPWexpA=s96-c',
  //   given_name: 'Lucca',
  //   family_name: 'Rodrigues',
  //   iat: 1665335097,
  //   exp: 1665338697,
  //   jti: '03e0583a02948639f0171b208075d71e2fa7dd80'
  // }

  
  // fetch this user from DB
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);

  let userObject = {
    email: req.body.email,
    username: req.body.name,
    pfp_url: req.body.picture
  }  

  // check user isn't registered in DB 
  if (!user) {
    console.log('User not found, creating account');
    const stmt = db.prepare("INSERT INTO users (email, username, pfp_url) VALUES(?, ?, ?)");
    const info = stmt.run(req.body.email, req.body.name, req.body.picture);
    await downloadPFP(info.lastInsertRowid, req.body.picture);
    userObject.user_id = info.lastInsertRowid;
  } else {
    userObject.user_id = user.id;
    userObject.pfp_url = `${process.env.BACKEND_URL}/${user.id}`;
    console.log('User found!', user);
  }

  // compute JWT auth token and add it as an HTTP-only response cookie
  const token = await asyncJWTsign(userObject, process.env.JWT_SECRET);
  res.status(200).end(token);
})

// Fetch currently logged in user
router.get('/user', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);
  res.json(req.user);
})

// Fetch all users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json({users: users});
})

// Fetch all comments
router.get('/comments', (req, res) => {    
  const comments = db.prepare('SELECT comments.id as comment_id, comments.content, comments.created_at, comments.parent_id, comments.replying_to, users.username, users.pfp_url, users.id as user_id FROM comments LEFT JOIN users ON comments.user_id = users.id').all();    

  const full_comments = comments.map(comment => {
    return { ...comment, score: getScoreForComment(comment.comment_id) };
  })

  res.json({comments: full_comments});
})

// Fetch a single comment by ID
router.get('/comments/:id', (req, res) => {
  const comment = db.prepare('SELECT comments.id as comment_id, comments.content, comments.created_at, comments.parent_id, users.username, users.pfp_url, users.id as user_id FROM comments LEFT JOIN users ON comments.user_id = users.id WHERE comments.id = ?').get(req.params.id);  
  res.json({comment: comment});
})

// Create a new comment
router.post('/comments', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);
  
  // add new comment to DB
  const stmt = db.prepare('INSERT INTO comments(user_id, content, created_at, parent_id, replying_to) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.user_id, req.body.content, Date.now().toString(), req.body.parent_id, req.body.replying_to);
  console.log(info);

  // send new comment ID and creation date to client
  res.status(200).json({comment_id: info.lastInsertRowid.toString(), created_at: Date.now().toString()});
})

// Delete a comment
router.delete('/comments/:id', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);

  // check if user matches author
  const author = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(req.params.id);
  if (author.user_id !== req.user.user_id) return res.sendStatus(403);

  // remove comment from DB
  const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
  const info = stmt.run(req.params.id);
  console.log(info);

  res.sendStatus(200);
})

// Fetch a single user's ratings
router.get('/rate/', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);
  console.log(req.user.user_id);
  const data = db.prepare('SELECT comment_id, button FROM ratings WHERE user_id = ?').all(req.user.user_id);
  console.log(data);
  return res.json(data)
})


// Rate comment
router.put('/rate/:id', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);

  // Check if user has already rated this comment
  const data = db.prepare('SELECT id as rating_id, button, user_id FROM ratings WHERE comment_id = ?').all(req.params.id);
  const users = data.map(entry => entry.user_id);

  if (users.includes(req.user.user_id)) {

    const rating_entry = data.find(entry => entry.user_id === req.user.user_id);

    if (rating_entry.button === req.body.button) {
      // remove rating from DB
      const stmt = db.prepare('DELETE FROM ratings WHERE id = ?');
      const info = stmt.run(rating_entry.rating_id);
      const score = getScoreForComment(req.params.id);
      return res.send(score.toString());
      
    } else {
      // update rating in DB
      const stmt = db.prepare('UPDATE ratings SET button = ? WHERE id = ?');
      const info = stmt.run(req.body.button, rating_entry.rating_id);
      const score = getScoreForComment(req.params.id);
      return res.send(score.toString());
    }
    
  } else {
    // add new rating to DB
    const stmt = db.prepare('INSERT INTO ratings(user_id, comment_id, button) VALUES (?, ?, ?)');
    const info = stmt.run(req.user.user_id, req.params.id, req.body.button);
    const score = getScoreForComment(req.params.id);
    return res.send(score.toString());
  }
})

// Edit a comment
router.put('/comments/:id', isLoggedIn, (req, res) => {
  if (!req.user) return res.sendStatus(401);

  // check if user matches author
  const author = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(req.params.id);
  if (author.user_id !== req.user.user_id) return res.sendStatus(403);

  // update comment's content in DB
  const stmt = db.prepare('UPDATE comments SET content = ? WHERE id = ?');
  const info = stmt.run(req.body.content, req.params.id);
  console.log(info);

  res.sendStatus(200);
})

app.use('/api', router)

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://${process.env.URL}:${process.env.PORT}`);
});
