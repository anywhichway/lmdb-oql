import {open} from "lmdb";
import {withExtensions,operators} from "./index.js";

const {$eq,$gte,$isCreditCard,$isEmail,$isSSN,$isURL} = operators;

class Person {
    constructor(props) {
        Object.assign(this,props);
    }
}

const db = withExtensions(open("test.db",{useVersions:true}));
db.clearSync();
db.defineSchema(Person);
await db.put(null,new Person({
    name:"joe",
    age:21,
    website:"https://nowhwere.com",
    CC: "4012888888881881",
    email: "joe@nowhere.com",
    address:{city:"New York",state:"NY"}}));
await db.put(null,new Person({name:"joe",age:21,address:{city:"New York",state:"NY"}}));

test("simple select",() => {
    const results = [...db.select().from(Person).where({Person:{name:"joe",age:$gte(21),website:$isURL(),CC:$isCreditCard(),email:$isEmail()}})];
    expect(results.length).toBe(1)
})

test("select with literal",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (value)=>value}}, age:21}})];
    expect(results.length).toBe(4)
})
test("select with function",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: (value)=>value}}}})];
    expect(results.length).toBe(4)
})
test("select with right operator",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: $eq()}}}})];
    expect(results.length).toBe(4)
})
test("select right outer join with right operator",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: $eq("joe")}}}})];
    expect(results.length).toBe(4)
})
test("select none with function",async () => {
    const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===22 ? value : undefined, name: {P2: {name: (value)=>value}}}})];
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