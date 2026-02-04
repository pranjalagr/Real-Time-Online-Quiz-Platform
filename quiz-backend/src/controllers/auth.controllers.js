import {createuser,authenticateuser} from '../services/auth.services.js'
async function register(request, response){
    // take input (request) (read data from request body and stores it in variable)
    // validate input or request (i dont know how to validate it, i can validate using if else statements but i vaguely remember other methods such as zod)
    // asks service to make a user(call a function in service giving username and password and take response)
    // send success or error response (send response in return)
    console.log("controller");
    let email=request.body.email;
    let password=request.body.password;
    if(!email||!password){return response.status(400).json({error:"Please fill all the fields."})}
    if(password.length<10){return response.status(400).json({error:"The password length must be greater than 9"})}
    try{
        await createuser(email,password);
        return (response.status(200).json({notification:"User registered, Please login"}));
    } catch(error){
        // console.error(error);
        return response.status(400).json({error:"User already exists."})
    }
}
async function login(request, response){
    // take input (read data from request body and stores it in variable)
    // validate input (same as register)
    // asks service to check the user (call a function in service giving email and password and take token)
    // recieve token if valid (send token in response)
    // send token if valid or error response (send error if no user found)
    let email=request.body.email;
    let password=request.body.password;
    if(!email||!password){return response.status(400).json({error:"Please fill all the fields."})}
    if(password.length<10){return response.status(400).json({error:"The password length must be greater than 9"})}
    try{
        const res=await authenticateuser(email,password);
        return (response.status(200).json(res));
    } catch(err){
        // console.log(error);
        return response.status(400).json({error:"User not exists."});
    }
}
export {register,login};