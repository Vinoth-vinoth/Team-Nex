import jwt from 'jsonwebtoken';
export function auth(req,res,next){
 const h=req.headers.authorization;
 if(!h?.startsWith('Bearer ')) return res.status(401).json({message:'Login required'});
 try{req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET);next();}
 catch{return res.status(401).json({message:'Session expired'});}
}
export function roles(...allowed){return (req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({message:'Permission denied'});}
