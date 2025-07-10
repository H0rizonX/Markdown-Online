const randomName = ():string =>{
    return 'user' + Math.floor(1000 + Math.random() * 9000);
}
export default randomName