class AD  {constructor() { AD.prototype.__init.call(this); }
  __init() {this.a = '1';}
}

let b = new AD();

let a = ()=>{
  console.log(b.a);
};

export default a;
export { AD };
