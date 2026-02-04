const usersocket = new Map();
// userid->socketid

function addsocket(userid,socketid){
    if(!usersocket.get(userid)){
        usersocket.set(userid,new Set());
    }
    usersocket.get(userid).add(socketid);
}

function removesocket(userid,socketid){
    if(!usersocket.get(userid)||!usersocket.get(userid).has(socketid)){return;}
    usersocket.get(userid).delete(userid);
}

export {addsocket,removesocket};