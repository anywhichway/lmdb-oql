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
import {withExtensions} from "lmdb-index";

class Person {
    constructor(config={}) {
        Object.assign(this,config);
    }
}
const db = withExtensions(open("test"));
db.defineSchema(Person);
const id = await db.put(null,new Person({name:"bill",age:21}));
if(id) {
    const person = await db.get(id);
    if(person && person instanceof Person) {
        console.log(person)
    }
}
console.log([...db.select().from(Person).where({name:"bill"})]);
```

# API

`* db.select(?selector:object|function).from(?...classes).where(?conditions:object)`

A generator function that selects across multiple class types based on a `conditions` object that can contain literals, regular expressions, functions, and joins. The `where` sub-function optimizes the `conditions` and processes the most restrictive criteria first.

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
    .where({Person:{name:(value)=>value==="joe"||undefined}}) // yields the same results
```

```javascript
db.select()
    .from(Person)
    .where({Person:{[/name/g]:(value)=>value==="joe"||undefined}}) // yields the same results
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

## Predicates

NOT YET IMPLEMENTED

`$and`

`$or`

`$lt`

`$lte`

`$eq`

`$eeq`

`$neq`

`$gte`

`$gt`

`$between`

`$in`



# Release Notes (Reverse Chronological Order)

During ALPHA and BETA, the following semantic versioning rules apply:

* The major version will be zero.
* Breaking changes or feature additions will increment the minor version.
* Bug fixes and documentation changes will increment the patch version.

2023-04-27 v0.1.0 Enhanced documentation. Re-implemented `where` to be more efficient.

2023-04-27 v0.0.1 Initial public release
