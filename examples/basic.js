import {open} from "lmdb";
import {defineSchema,get,patch,put,remove,select,withExtensions} from "../index.js";

class Person {
    constructor(config={}) {
        Object.assign(this,config);
    }
}
const db = withExtensions(open("test"),{defineSchema,get,patch,put,remove,select});
db.clearSync();
db.defineSchema(Person);
const id = await db.put(null,new Person({name:"bill",age:21}));
if(id) {
    const person = await db.get(id);
    if(person && person instanceof Person) {
        console.log(person)
    }
}
console.log([...db.select().from([Person]).where({Person:{name:"bill"}})]);
console.log([...db.select({Person:{name:(value,{root})=>{ root.name=value; }}}).from([Person]).where({Person:{name:"bill"}})]);