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
const items = {};
suite.add("put primitive",async () => {
    await db.put(1,1);
})
suite.add("get primitive",() => {
    db.get(1);
})
suite.add("select",async () => {
    for(const item of db.select().from(Object).where({Object:{random:1}})) {
        items[item["#"]] = item;
    }
})
suite.add("put indexed object",async () => {
    await db.put(null,{name:"joe",age:21,address:{city:"New York",state:"NY"},random:Math.random()});
})
suite.add("insert",async () => {
    // random forces reindexing
    await db.insert().into(Object).values({Object:{name:"joe",age:21,address:{city:"New York",state:"NY"},random:Math.random()}});
})

    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        console.log(Object.keys(items).length)
    })
    .run({ maxTime:5 });