import jwt from 'jsonwebtoken';

// Middleware for protecting routes
export const requireAuth = (req, res, next) => {
    const token = req.headers['x-access-token'];
    console.log(token);
    
    if(token){
        jwt.verify(token, 'My little secret', (err, decodedToken) => {
            if(err){
                console.log(err.message);
                res.redirect('/login');
            } else{
                console.log(decodedToken);
                next();
            }
        })
    }

    res.redirect('/login');

}

