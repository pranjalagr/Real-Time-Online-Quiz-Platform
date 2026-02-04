import bcrypt from 'bcrypt'
import pool from '../db/index.js'
import jwt from 'jsonwebtoken'
async function createuser(email,password){
    // received username and password.
    // check if same username exists in db , if exists return user exists
    // hash password
    // add username and hash pass in db
    // return successfull 
    console.log("service");
    const res=await pool.query('SELECT id FROM users WHERE email=$1',[email])
    if(res.rowCount>0){
        throw new Error("User Already Exists");
    }
    const passhash=await bcrypt.hash(password,10);
    await pool.query('INSERT INTO users (email,password_hash) VALUES($1,$2)',[email,passhash])
}
async function authenticateuser(email,password){
    // received username and password.
    // checks username and password from db
    // if success , make a token and return 
    // otherwise return error
    const res=await pool.query('SELECT password_hash,id FROM users WHERE email=$1',[email]);
    if(res.rowCount==0){
        throw new Error("User NOT Exists");
    }
    const cmp=await bcrypt.compare(password,res.rows[0].password_hash);
    if(!cmp){throw new Error("Wrong password");}
    const id=res.rows[0].id;
    const token=jwt.sign(
        { id: id, email: email },
        process.env.JWT_SECRET,
        {expiresIn:'1d'}
    );
    return token;
}
export {createuser,authenticateuser};