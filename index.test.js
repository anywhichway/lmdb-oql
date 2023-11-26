import {open} from "lmdb";
import {withExtensions,operators,IDS} from "./index.js";

const {$and,$or,$not,$eq,$gte,$isCreditCard,$isEmail,$isNull,$isSSN,$isURL,$type} = operators;

class Person {
    constructor(props) {
        Object.assign(this,props);
    }
}

const parent = withExtensions(open("test.db",{useVersions:true})),
    child = withExtensions(parent.openDB("child",{useVersions:true})),
    dbs = [parent,child];
for (let i=0;i<dbs.length;i++) {
    const db = dbs[i];
    db.clearSync();
    db.defineSchema(Person);
    await db.put(null,new Person({
        name:"joe",
        age:21,
        notes:null,
        website:"https://nowhwere.com",
        CC: "4012888888881881",
        email: "joe@nowhere.com",
        address:{city:"New York",state:"NY"}}));

    test(`insert ${i}`,async () => {
        for await(const id of db.insert().into(Person).values({Person:{name:"joe",age:21,notes:null,address:{city:"New York",state:"NY"}}})) {
            const person = db.get(id);
            expect(person.name).toBe("joe");
            expect(person).toBeInstanceOf(Person);
        }
    })
    test(`insert with exec ${i}`,async () => {
        for (const id of await db.insert().into(Person).values({Person:{name:"joe",age:21,notes:null,address:{city:"New York",state:"NY"}}}).exec()) {
            const person = db.get(id);
            expect(person.name).toBe("joe");
            expect(person).toBeInstanceOf(Person);
            await db.remove(id);
        }
    })

    test(`insert array ${i}`,async () => {
        for await(const id of db.insert().into(Array).values({Array:[[1,2,3]]})) {
            const array = db.get(id);
            expect(array.length).toBe(3);
            expect(array["#"]).toBe(id);
            expect(array).toBeInstanceOf(Array);
            delete array["#"];
            expect(array).toEqual([1,2,3]);
        }
    })

    test(`insert array throws ${i}`,async () => {
        try {
            for await(const id of db.insert().into(Array).values({Array:[1,2,3]})) {
                throw new Error("should have thrown")
            }
        } catch(e) {
            expect(e.message).toBe("Expected array of arrays when inserting Array");
            return;
        };
        throw new Error("should have thrown")
    })

    test(`simple select ${i}`,() => {
        const results = [...db.select().from(Person).where({Person:{name:"joe",age:$gte(21),notes:$isNull(),pronoun:$type("string"),website:$isURL(),CC:$isCreditCard(),email:$isEmail()}})];
        expect(results.length).toBe(1)
    })

    test(`simple select $and ${i}`,() => {
        const results = [...db.select().from(Person).where({Person:{name:"joe",age:$and($gte(21),$gte(21))}})];
        expect(results.length).toBe(2)
    })

    test(`simple select $or ${i}`,() => {
        const results = [...db.select().from(Person).where({Person:{name:"joe",age:$or($eq(20),$gte(21))}})];
        expect(results.length).toBe(2)
    })

    test(`simple select $not ${i}`,() => {
        const results = [...db.select().from(Person).where({Person:{name:"joe",age:$not($eq(20))}})];
        expect(results.length).toBe(2)
    })

    test(`select IDS ${i}`,() => {
        const results = [...db.select(IDS).from(Person).where({Person:{name:"joe",age:$gte(21),notes:$isNull(),pronoun:$type("string"),website:$isURL(),CC:$isCreditCard(),email:$isEmail()}})];
        expect(results.length).toBe(1)
    })

    test(`select with literal ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (value)=>value}}, age:21}})];
        expect(results.length).toBe(4)
    })
    test(`select with function ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: (value)=>value}}}})];
        expect(results.length).toBe(4)
    })
    test(`select with right operator ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: $eq()}}}})];
        expect(results.length).toBe(4)
    })
    test(`select right outer join with right operator ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===21 ? value : undefined, name: {P2: {name: $eq("joe")}}}})];
        expect(results.length).toBe(4)
    })
    test(`select none with function ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {age:(value)=>value===22 ? value : undefined, name: {P2: {name: (value)=>value}}}})];
        expect(results.length).toBe(0)
    })
    test(`select join ${i}`,async () => {
        const results = [...db.select().from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (left,right)=>left===right}}}})];
        expect(results.length).toBe(4)
    })
    test(`select with selector ${i}`,async () => {
        const results = [...db.select({P1:{name:(value)=>value}}).from([Person,"P1"],[Person,"P2"]).where({P1: {name: {P2: {name: (left,right)=>left===right}}}})];
        expect(results.length).toBe(4);
        expect(results[0]).toEqual({ P1: { name: 'joe' } } )
    })
    test(`patch ${i}`,async () => {
        for await(const id of db.update(Person).set({Person:{age:22}}).where({Person:{name:"joe"}})) {
            const person = db.get(id);
            expect(person.age).toBe(22);
        }
        expect([...db.select().from(Person).where({Person:{age:22}})].length).toBe(2);
    })
    test(`delete ${i}`,async () => {
        for await(const id of db.delete().from(Person).where({Person:{name:"joe"}})) {
            expect(db.get(id)).toBe(undefined);
        };
        expect([...db.select().from(Person).where({Person:{name:"joe"}})].length).toBe(0);
    })
    test(`delete with exec ${i}`,async () => {
        const results = await db.delete().from().where().exec();
        expect(results.length).toBe(0);
    })
    test(`update with exec ${i}`,async () => {
        const results = await db.update().set().where().exec();
        expect(results.length).toBe(0);
    })
    test(`select with exec ${i}`,async () => {
        const results = db.select().from().where().exec();
        expect(results.length).toBe(0);
    })
}
