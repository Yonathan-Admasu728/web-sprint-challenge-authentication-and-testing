const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")
const {jwtSecret} = require("../../config/secrets")
const router = require('express').Router();

const Users = require('../users/users-model');
const checkInputType = require('../middleware/checkInputType')

const checkPayload = (req,res,next)=>{
  if(!req.body.username || !req.body.password){
      res.status(401).json("username and password required")
  }else{
      next()
  }
}

const checkUserInDB = async (req,res,next)=>{
  try{
      const rows = await Users.findBy({username:req.body.username})
      if(!rows.length){
          next()
      }else{
          res.status(401).json("username taken")
      }
  }catch(e){
      res.status(500).json(`Server error: ${e.message}`)
  }
}

const checkUserExists = async (req,res,next)=>{
  try{
      const rows = await Users.findBy({username:req.body.username})
      if(rows.length){
          req.userData = rows[0]
          next()
      }else{
          res.status(401).json("invalid credentials")
      }
  }catch(e){
      res.status(500).json(`Server error: ${e.message}`)
  }
}

router.post('/register',checkPayload,checkInputType, checkUserInDB, async (req, res) => {
      try {
        const hash = bcrypt.hashSync(req.body.password,8)
        const newUser = await Users.add({username:req.body.username, password: hash})
        res.status(201).json(newUser)
      } catch (e) {
        res.status(500).json({message:e.message})
      }

           /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */

});


router.post('/login',checkPayload, checkUserExists, (req, res, next) => {
  let { username, password } = req.body;

  Users.findBy({ username }) // it would be nice to have middleware do this(maybe later)
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = makeToken(user)
        res.status(200).json({
          message: `Welcome, ${user.username}!`,
          token
        });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(next);
    /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
});

function makeToken(user){
  const payload = {
    subject:user.id,
    username:user.username
  }
  const options = {
    expiresIn: "500s"
  }
  return jwt.sign(payload,jwtSecret,options)
}
  


module.exports = router;

