
interface ABC {
  a: string;
}

export class AD implements ABC {
  a: string = '1';
}

let b = new AD();

let a = ()=>{
  console.log(b.a)
};
export default a;
