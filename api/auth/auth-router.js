const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const Users=require('./../users/users-model')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')

router.post("/register", validateRoleName, (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
    const { username, password, role_name }=req.body
    const hash=bcrypt.hashSync(password,8)
    
    Users.add({ username, password:hash, role_name })
         .then(user=>{
          res.status(201).json(user)
         })
         .catch(next)
    

  
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
  const {username,password}=req.body
  Users.findBy({ username })
       .then(user=>{
        if(user && bcrypt.compareSync(password,user.password)){
          const token=generateToken(user)
          res.status(200).json({message:`${username} is back`,token})
        }else{
          res.status(401).json({message:'Invalid Credentials'})
        }
       })
       .catch(next)

});

function generateToken(user){
  const payload={
    subject:user.user_id,
    username:user.username,
    role_name:user.role_name
  }
  const options={expiresIn:'1d'}
  return jwt.sign(payload, JWT_SECRET,options)

}

module.exports = router;
