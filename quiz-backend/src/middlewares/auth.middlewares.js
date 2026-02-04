import jwt from 'jsonwebtoken'
async function authMiddleware(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return (res.status(401).json({Error:"Unauthorized access"}));
    }
    const parts = authHeader.split(" ");
    if(parts.length!=2||parts[0]!="Bearer"){
        return (res.status(401).json({Error:"Unauthorized access"}));
    }
    try{
        const verifying=jwt.verify(parts[1],process.env.JWT_SECRET);
        req.user=verifying;
        next()
    }catch(err){
        return (res.status(401).json({Error:"Unauthorized access"}));
    }
}
export {authMiddleware};