import {open} from "lmdb";
import {withExtensions} from "./index.js";

const benchmark = await import("./node_modules/benchmark/benchmark.js"),
    Benchmark = benchmark.default,
    suite = new Benchmark.Suite;

const db = withExtensions(open("test.db",{useVersions:true}));
db.clearSync();
db.defineSchema(Object);
//for await (const item of db.insert().into(Object).values({Object:{name:"joe",age:21,random:1,address:{city:"New York",state:"NY"}}})) {};
await db.insert().into(Object).values({Object:{name:"joe",age:21,random:1,address:{city:"New York",state:"NY"}}}).exec();
const select = db.select().from(Object).where({Object:{random:1}});
const insert = db.insert().into(Object).values({Object:{name:"joe",age:21,address:{city:"New York",state:"NY"},random:Math.random()}});
await db.put(1,1);
suite.add("put primitive",async () => {
    const key = await db.put(1,1);
    if(key!==1) console.log(new Error("Key is not 1"));
})
suite.add("get primitive",() => {
    const value = db.get(1);
    if(value!==1) console.log(new Error("Value is not 1"));
})
suite.add("get primitive from disk",async () => {
    const v0 = db.get(1);
    const v1 = db.cache.get(1);
    db.cache.delete(1);
    const v2 = db.get(1);
    //if(v2!==1) console.log(new Error("Value is not 1"));
})
suite.add("getEntry primitive",() => {
    const {value} = db.getEntry(1);
    if(value!==1) console.log(new Error("Value is not 1"));
})
suite.add("select.exec",() => {
    let count = 0;
    for(const item of select.exec()) {
        count++
    }
    if(count===0) console.log(new Error("select.exec no items found"));
})
suite.add("select",() => {
    let count = 0;
    for(const item of db.select().from(Object).where({Object:{random:1}})) {
        count++
    }
    if(count===0) console.log(new Error("select no items found"));
})
suite.add("put indexed object",async () => {
    await db.put(null,{name:"joe",age:21,address:{city:"New York",state:"NY"},random:Math.random()});
})
suite.add("insert with change",async () => {
    await db.insert().into(Object).values({Object:{name:"joe",age:21,address:{city:"New York",state:"NY"},random:Math.random()}});
})
suite.add("insert.exec",async () => {
    await insert.exec();
})

    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({ maxTime:5 });