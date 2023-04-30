import {open} from "lmdb";
import {withExtensions,operators} from "../index.js";

const {$gte} = operators;
class Person {
    constructor(config={}) {
        Object.assign(this,config);
    }
}
class Employer {
    constructor(config={}) {
        Object.assign(this,config);
    }
}

const db = withExtensions(open("test"));
db.clearSync();
db.defineSchema(Person);
db.defineSchema(Employer);

// typically you do no provide an id for a put of a an instance controlled by a schema
const personId = await db.put(null,new Person({name:"bill",age:21,employer:"ACME"}));
// but you can if you want to, so long as you at start it with the class name followed by @
await db.put("Employer@1",new Employer({name:"ACME",address:"123 Main St."}));

const person = await db.get(personId);
// if a return value is an object that is controlled by a schema,
// it will be an instance of the schema's class
console.log(person);
/*
Person {
  name: 'bill',
  age: 21,
  employer: 'ACME',
  '#': 'Person@850ad934-a449-493e-846a-96e00a1b6546'
}
 */

// you can use predefined operators in place of literal matchee
console.log([...db.select().from(Person).where({Person:{age:$gte(21)}})]);
/*
[
  {
    Person: Person {
      name: 'bill',
      age: 21,
      employer: 'ACME',
      '#': 'Person@850ad934-a449-493e-846a-96e00a1b6546'
    }
  }
]
 */

// joins are performed using the class name as the key
// this example joins Person to Employer on Person.employer === Employer.name
console.log([...db.select().from(Person,Employer).where({Person:{employer: {Employer:{name:"ACME"}}}})]);
/*
[
  {
    Person: Person {
      name: 'bill',
      age: 21,
      employer: 'ACME',
      '#': 'Person@850ad934-a449-493e-846a-96e00a1b6546'
    },
    Employer: Employer {
      name: 'ACME',
      address: '123 Main St.',
      '#': 'Employer@c5e07e94-4a94-4cfc-b167-65cb1dd7bd29'
    }
  }
]
 */

// class aliases are supported by providing two element arrays in 'from'
// with the first element being the class and the second being the alias
console.log([...db.select().from([Person, "P"],[Employer,"E"]).where({P:{employer: {E:{name:"ACME"}}}})]);
/*
[
  {
    Person: Person {
      name: 'bill',
      age: 21,
      employer: 'ACME',
      '#': 'Person@850ad934-a449-493e-846a-96e00a1b6546'
    },
    Employer: Employer {
      name: 'ACME',
      address: '123 Main St.',
      '#': 'Employer@c5e07e94-4a94-4cfc-b167-65cb1dd7bd29'
    }
  }
]
 */

// you can select just the data you want and move it up a level
console.log([...db.select({P:{name(value,{root}) { root.name=value; }},E:{address(value,{root}){ root.workAddress=value; }}})
    .from([Person, "P"],[Employer,"E"])
    .where({P:{employer: {E:{name:"ACME"}}}})]);
/*
[ { name: 'bill', workAddress: '123 Main St.' } ]
 */