// packages
import express from "express";
import path from "path";
import fs from "fs";
import axios from "axios";
import cors from "cors";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import { UserJWT } from "./index";

const prisma = new PrismaClient();

// helper functions
async function asyncJWTsign(payload: any, secret: string) {
  return new Promise<string | undefined>((resolve, reject) => {
    jwt.sign(payload, secret, (err: any, token: string | undefined) => {
      if (err) return reject(err);
      resolve(token);
    });
  });
}

async function asyncJWTverify(payload: string, secret: string) {
  return new Promise<string | jwt.JwtPayload | undefined>((resolve, reject) => {
    jwt.verify(payload, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

async function downloadPFP(userId: number, imageURL: string) {
  const pathToImage = path.resolve(__dirname, "avatars", `${userId}.jpg`);
  const writer = fs.createWriteStream(pathToImage);

  const response = await axios({
    url: imageURL,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function getScoreForComment(id: number) {
  let score = 0;
  const ratings = await prisma.ratings.findMany({
    select: {
      user_id: true,
      button: true,
    },
    where: {
      comment_id: id,
    },
  });

  for (const rating of ratings) {
    if (rating.button === 1) score += 1;
    if (rating.button === -1) score -= 1;
  }
  return score;
}

// auth middleware
async function isLoggedIn(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!req.headers.authorization) return res.sendStatus(401);
  const token = req.headers.authorization.split("Bearer ")[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = await asyncJWTverify(
      token,
      process.env.JWT_SECRET as string
    );
    next();
  } catch (error) {
    console.error("Auth middleware error!", error);
    return res.sendStatus(403);
  }
}

async function getUserToken(req: express.Request) {
  const decoded = await asyncJWTverify(
    (req.headers.authorization as string).split("Bearer ")[1],
    process.env.JWT_SECRET as string
  );
  return decoded as UserJWT;
}

// express config
const app = express();
const router = express.Router();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(process.env.PATH_TO_REACT_APP as string));
app.use("/avatars", express.static(path.join(__dirname, "avatars")));

router.get("/", (req, res) => {
  res.send("Hello World!");
});

// Log into router or register new acoount
router.post("/login", async (req, res) => {
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
  const user = await prisma.users.findFirst({
    where: {
      email: req.body.email,
    },
  });

  let userObject: UserJWT = {
    email: req.body.email,
    username: req.body.name,
    pfp_url: req.body.picture,
    user_id: 0,
  };

  // check if user is already registered in DB
  if (!user) {
    console.log("User not found, creating account");

    const newUser = await prisma.users.create({
      data: {
        email: req.body.email,
        username: req.body.name,
        pfp_url: req.body.picture,
      },
    });

    await downloadPFP(newUser.id, req.body.picture);
    userObject.user_id = newUser.id;
  } else {
    userObject.user_id = user.id;
    userObject.pfp_url = `${process.env.BACKEND_URL}/${user.id}`;
    console.log("User found!", user);
  }

  // compute JWT auth token and add it as an HTTP-only response cookie
  const token = await asyncJWTsign(
    userObject,
    process.env.JWT_SECRET as string
  );
  res.status(200).send(token);
});

// Fetch currently logged in user
router.get("/user", isLoggedIn, async (req, res) => {
  const user = (await getUserToken(req)) as jwt.JwtPayload;
  res.json(user);
});

// Fetch all users
router.get("/users", async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
    },
  });
  res.json({ users: users });
});

// Fetch all comments
router.get("/comments", async (req, res) => {
  const commentsData = await prisma.comments.findMany({
    select: {
      id: true,
      content: true,
      created_at: true,
      parent_id: true,
      replying_to: true,
      users: true,
    },
  });

  // God tier concurrency right here:
  const fetchScores = commentsData.map(async (data) => {
    const score = await getScoreForComment(data.id);
    const comment = {
      comment_id: data?.id,
      content: data?.content,
      createdAt: data?.created_at,
      parent_id: data?.parent_id,
      replying_to: data.replying_to,
      username: data?.users.username,
      user_id: data?.users.id,
      score: score,
    };
    return comment;
  });

  const full_comments = await Promise.all(fetchScores);

  res.json({ comments: full_comments });
});

// Fetch a single comment by ID
router.get("/comments/:id", async (req, res) => {
  const data = await prisma.comments.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      users: true,
    },
  });

  if (data === null) return res.sendStatus(404);

  const comment = {
    comment_id: data?.id,
    content: data?.content,
    createdAt: data?.created_at,
    parent_id: data?.parent_id,
    replying_to: null,
    username: data?.users.username,
    user_id: data?.users.id,
  };

  res.json({ comment: comment });
});

// Create a new comment
router.post("/comments", isLoggedIn, async (req, res) => {
  const user = await getUserToken(req);

  const comment = await prisma.comments.create({
    data: {
      user_id: user.user_id,
      content: req.body.content,
      created_at: Date.now().toString(),
      parent_id: req.body.parent_id,
      replying_to: req.body.replying_to,
    },
  });

  // send new comment ID and creation date to client
  res.status(200).json({
    comment_id: comment.id,
    created_at: comment.created_at,
  });
});

// Delete a comment
router.delete("/comments/:id", isLoggedIn, async (req, res) => {
  const user: UserJWT = await getUserToken(req);

  // check if user matches author
  const author = await prisma.comments.findUnique({
    where: {
      id: Number(req.params.id),
    },
    select: {
      user_id: true,
    },
  });

  // if comment doesn't exist, send a 404 (Not Found)
  if (author === null) return res.sendStatus(404);

  // if author and user don't match, send a 403 (Forbidden)
  if (author?.user_id !== (user.user_id as Number)) return res.sendStatus(403);

  // delete this comment and all children comments from DB, send 200 (OK)
  const deletedParentComment = await prisma.comments.delete({
    where: { id: Number(req.params.id) },
  });

  const deletedChildComments = await prisma.comments.deleteMany({
    where: { parent_id: Number(req.params.id) },
  });

  res.sendStatus(200);
});

// Fetch a single user's ratings
router.get("/rate/", isLoggedIn, async (req, res) => {
  const user = await getUserToken(req);
  const data = await prisma.ratings.findMany({
    where: {
      user_id: user.user_id,
    },
    select: {
      comment_id: true,
      button: true,
    },
  });

  return res.json(data);
});

// Rate comment
router.put("/rate/:id", isLoggedIn, async (req, res) => {
  const user = await getUserToken(req);

  // const data = db
  //   .prepare(
  //     "SELECT id as rating_id, button, user_id FROM ratings WHERE comment_id = ?"
  //   )
  //   .all(req.params.id);

  // Fetch all ratings for this commment
  const ratings = await prisma.ratings.findMany({
    where: {
      comment_id: Number(req.params.id),
    },
    select: {
      id: true,
      button: true,
      user_id: true,
    },
  });

  // if comment doesn't exist, send a 404 (Not Found)
  if (ratings === null) return res.sendStatus(404);

  // Get the IDs of all users that rated this comment
  const userIds = ratings.map((rating) => rating.user_id);

  // Check if user has already rated this comment
  if (userIds.includes(user.user_id)) {
    const rating_entry = ratings.find(
      (rating) => rating.user_id === user.user_id
    );

    if (rating_entry?.button === req.body.button) {
      // remove rating from DB
      await prisma.ratings.delete({
        where: { id: rating_entry?.id },
      });

      // send new score down the wire
      const score = await getScoreForComment(Number(req.params.id));
      return res.send(score.toString());
    } else {
      // update rating in DB
      await prisma.ratings.update({
        where: { id: rating_entry?.id },
        data: { button: Number(req.body.button) },
      });

      // send new score down the wire
      const score = await getScoreForComment(Number(req.params.id));
      return res.send(score.toString());
    }
  } else {
    // add new rating to DB
    await prisma.ratings.create({
      data: {
        user_id: user.user_id,
        comment_id: Number(req.params.id),
        button: Number(req.body.button),
      },
    });

    // send new score down the wire
    const score = await getScoreForComment(Number(req.params.id));
    return res.send(score.toString());
  }
});

// Edit a comment
router.put("/comments/:id", isLoggedIn, async (req, res) => {
  const user = await getUserToken(req);

  // check if user matches author
  const author = await prisma.comments.findUnique({
    where: {
      id: Number(req.params.id),
    },
    select: {
      user_id: true,
    },
  });

  // if comment doesn't exist, send a 404 (Not Found)
  if (author === null) return res.sendStatus(404);

  // if author and user don't match, send a 403 (Forbidden)
  if (author?.user_id !== (user.user_id as Number)) return res.sendStatus(403);

  // update comment's content in DB
  const updatedComment = await prisma.comments.update({
    data: {
      content: req.body.content.toString(),
    },
    where: {
      id: Number(req.params.id),
    },
  });

  res.sendStatus(200);
});

app.use("/api", router);

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on http://${process.env.URL}:${process.env.PORT}`
  );
});
