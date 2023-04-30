# lmdb-oql
A high level object query language for indexed LMDB databases using [lmdb-index](https://github.com/anywhichway/lmdb-index).

Easily join and select data across multiple collections/classes using literals, functions, regular expressions, and built-in predicates to match property names or values using the familiar nomenclature `select(what).from(classes).where(conditions)`.

This is ALPHA software. The API is not yet stable and adequate unit testing has not been completed.

# Installation

```bash
nom install lmdb-oql
```

# Usage

```javascript
import {open} from "lmdb";
import {withExtensions,operators} from "lmdb-oql";

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

```

## Operators

Operators take either 0 or 1 argument. If on the left side of a join, there should be 1 argument. On the right side of a join, providing no argument compares the value to the left. Providing 1 argument creates a right outer join where the right side value satisfies the operator.

`$and` - NOT YET IMPLEMENTED

`$or` - NOT YET IMPLEMENTED

`$lt`

`$lte`

`$eq`

`$eeq`

`$neq`

`$gte`

`$gt`

`$between` - NOT YET IMPLEMENTED

`$in` - NOT YET IMPLEMENTED


### LMDB Index API

Developers should be familiar wit the behavior of [lmdb-index](https://github.com/anywhichway/lmdb-index), particularly `defineSchema` and `put`, the documentation for which is replicated here:

### async defineSchema(classConstructor,?options={}) - returns boolean

- The key names in the array `options.indexKeys` will be indexed. If no value is provided, all keys will be indexed. If `options.indexKeys` is an empty array, no keys will be indexed.
- If the property `options.idKey` is provided, its value will be used for unique ids. If `options.idKey` is not provided, the property `#` on instances will be used for unique ids.
- If the property `options.keyGenerator` is provided, its value should be a function that returns a unique id. If `options.keyGenerator` is not provided, a v4 UUID will be used.

The `options` properties and values are inherited by child schema, i.e. if you define them for `Object`, then you do not need to provide them for other classes.

To index all keys on all objects using UUIDs as ids and `#` as the id key, call `db.defineSchema(Object)`.

### async db.put(key,value,?version,?ifVersion) - returns boolean

Works similar to [lmdb put](https://github.com/kriszyp/lmdb-js#dbputkey-value-version-number-ifversion-number-promiseboolean)

If `value` is an object, it will be indexed by the keys of the object so long as it is an instance of an object controlled by a schema declared with `defineSchema`. To index all keys on all objects, call `db.defineSchema(Object)`. If `key` is `null`, a unique id will be generated and added to the object. See [defineSchema](#async-defineschemaclassconstructor-options) for more information.

If there is a mismatch between the `key` and the `idKey` of the object, an Error will be thrown.

***Note***: For objects to be retrievable using `lmdb-oql`, the assignment of keys to objects ***MUST*** be done by calling `put` with `null or keys ***MUST*** be of the form `<classname>@<unique-identifier>`

# API

`* db.select(?selector:object|function,?{class:constructor}).from(?...classes).where(?conditions:object)` - returns object

A generator function that selects instances across multiple classes based on a `conditions` object that can contain literals, regular expressions, functions, and joins. The `where` chained function optimizes the `conditions` and processes the most restrictive criteria first.

THe returned value will be a class instance if only one class is provided in `from` and plain object if the selection is done across multiple classes unless a `class` is provided as an option to `select`. The `class` provided to `select` and used in `from` do not have to be declared using `defineSchema`, they will be automatically declared.

`selector(result:object)` - If selector is a function it takes an object representing the joined instances matching the `where` object. It can manipulate the object in any way it wishes. It defaults to `(value) => value`

`selector:object` - If `selector` is an object, its properties can be functions or regular expressions that extract and manipulate values from the result joined instances matching the `where` object.

`...classes` can be any number of class constructors. By default, the constructor name will be used as an alias in the `where` clause and joined instances. Specific alias can be provided by using two element arrays, e.g. `from([Person,"P1"],[Person,"P2"])` if you need to join `Person` back to itself.

`where` is typically an object containing literals, RegExp, and functions as property values. Serialized regular expressions can alos be used for property names. Joins are created by using a class alias (see `...classes` above) as a property name.

For example:

```javascript
db.select()
    .from(Person)
    .where({Person:{name:"joe"}}) // will yield all Person objects {Person: {name:"joe",...otherProperties}}
```

```javascript
db.select()
    .from(Person)
    .where({Person:{name:(value)=>value==="joe" ? value : undefined}}) // yields the same results
```

```javascript
db.select()
    .from(Person)
    .where({Person:{[/name/g]:(value)=>value==="joe" ? value : undefined}}) // yields the same results
```

```javascript
db.select()
    .from(Person)
    .where({Person:{[/name/g]:/joe/g}}) // yields the same results
```

```javascript
db.select()
    .from([Person,"P1"])
    .where({P1:{[/name/g]:"joe"}}) ///yields objects of the form {P1: {name:"joe",...otherProperties}}
```

```javascript
db.select()
    .from([Person,"P1"],[Person,"P2"])
    .where({}) // yields objects of the form {P1: {name:"joe",...otherProperties}, P2:{name:"joe",...}}
```

```javascript
db.select({Person:{name(value,{root}) { delete root.Person;return root.name=value; }}})
    .from(Person)
    .where({name:NOTNULL}) // yields objects of the form {name:<some name>}
```


# Release Notes (Reverse Chronological Order)

During ALPHA and BETA, the following semantic versioning rules apply:

* The major version will be zero.
* Breaking changes or feature additions will increment the minor version.
* Bug fixes and documentation changes will increment the patch version.

2023-04-29 v0.2.1 Enhanced documentation and `examples/basic.js`.

2023-04-28 v0.2.0 Implemented operator support. Updated dependencies.

2023-04-27 v0.1.0 Enhanced documentation. Re-implemented `where` to be more efficient.

2023-04-27 v0.0.1 Initial public release
