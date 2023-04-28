import {open} from "lmdb";
import {withExtensions} from "./index.js";

class Person {
    constructor(props) {
        Object.assign(this,props);
    }
}

const db = withExtensions(open("test.db",{useVersions:true}));
db.clearSync();
db.defineSchema(Person);
await db.put(null,new Person({name:"joe",age:21,address:{city:"New York",state:"NY"}}));
await db.put(null,new Person({name:"joe",age:21,address:{city:"New York",state:"NY"}}));

test("select with literal",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (value)=>value}}, age:21}})];
    expect(results.length).toBe(4)
})
test("select with function",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21||undefined, name: {P2: {name: (value)=>value}}}})];
    expect(results.length).toBe(4)
})
test("select none with function",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===22||undefined, name: {P2: {name: (value)=>value}}}})];
    expect(results.length).toBe(0)
})
test("select join",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (left,right)=>left===right}}}})];
    expect(results.length).toBe(4)
})
test("select with selector",async () => {
    const results = [...db.select({P1:{name:(value)=>value}}).from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (left,right)=>left===right}}}})];
    expect(results.length).toBe(4);
    expect(results[0]).toEqual({ P1: { name: 'joe' } } )
})