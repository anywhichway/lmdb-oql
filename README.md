# lmdb-oql
A high level object query language for indexed [LMDB](https://www.npmjs.com/package/lmdb) databases using [lmdb-index](https://github.com/anywhichway/lmdb-index).

Because it is layered on top of LMDB, `lmdb-oql` is fast and has ACID properties. It can also be schemaless or schema based in the same database.

Easily join and select data across multiple collections/classes using literals, functions, regular expressions, and built-in predicates to match property names or values using the familiar nomenclature `select(what).from(classes).where(conditions)`.

```javascript
select({Database:{description:$isDefined()},Provider:{name:$isDefined()}})
    .from(Database,Performance,Provider)
    .where({Database:
            {
                repository:{ // https://github.com/anywhichway/lmdb-index
                    Provider:{provides:$includes()}, // provides property array includes Database repository
                    Performance:{
                        repository:$eq(), // repository property equals Database repository
                        primitivePutOpsPerSecond:$gte(400000), 
                        primitiveGetOpsPerSecond:$gte(40000000), // yes, forty million (when objects are cached)
                        indexedPutOpsPerSecond:$gte(175000), // direct object put with indexing
                        insertOpsPerSecond:$gte(60000), // object insertion via lmdb-oql with indexing
                        selectOpsPerSecond:$gte(100000) // object selection via lmdb-oql against index
                    }}
                }});
/* On a i7-1165G7 CPU @ 2.80GHz with 16GB RAM running Windows 11 x64
{
    Database: {
        description: "A high performance, high reliability, high durability key-value and object store.",
    },
    Provider: {
        name: "AnyWhichWay, LLC",
    }
 */
```

This is BETA software. The API is stable and unit tests have over 90% coverage.

Note: Schema are currently used for indexing only. They are not used to validate data. This is a planned feature subsequent to v1.0.0.

# Installation

```bash
npm install lmdb-oql
```

# Usage

```javascript
import {open} from "lmdb";
import {operators,withExtensions,IDS} from "lmdb-oql";

const {$mod,$gte} = operators;
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

// typically you do not provide an id for a put of a an instance controlled by a schema
const personId = await db.put(null,new Person({name:"bill",age:21,employer:"ACME"}));
// but you can if you want to, so long as you start it with the class name followed by @
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

// you can use predefined operators in place of literal matches
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
// there are lots of operators, Person has an odd numbered age, could also use $odd
console.log([...db.select().from(Person).where({Person:{age:$mod([2,1])}})]);
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
// this example joins Person to Employer on Person.employer === Employer.name === "ACME
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

// you can select just ids
console.log([...db.select(IDS).from([Person, "P"],[Employer,"E"]).where({P:{employer: {E:{name:"ACME"}}}})])
/*
[ [ 'Person@64fc6554-066c-47dd-a99e-d0492dcb957c', 'Employer@1' ] ]
 */

```

## Operators

Operators take either 0 or 1 argument. 

Zero argument operators are typically used to test the type of the value being compared, e.g. `$isZIPCode()`. 

On the right side of a join, providing no argument when one is expected compares the value to the left, e.g. `{Person:{employer: {Employer:{name:$eq()}}}}`. 

Providing 1 argument creates a right outer join where the right side value satisfies the operator, e.g. `{Person:{employer: {Employer:{name:$eq("ACME")}}}}`.

Note: `$eq()` is provided for completeness, but using a literal is more efficient, e.g. `{Person:{employer: {Employer:{name:"ACME"}}}}`. Using a function causes a partial index scan.

The documentation below just shows how to use the operator with a single argument. The `item being compared` for each definition below is the value of a property in an object on either the left or right side of a join.

### Logical

`$and(...operatorCalls)` - returns the item being compared if it satisfies all conditions, otherwise `undefined`

`$or(...operatorCalls)` - returns the item being compared if it satisfies any condition, otherwise `undefined`

`$not(operatorCall)` - returns the item being compared if it does not satisfy the condition, otherwise `undefined`

### Types

`$type(value:any)` - returns item being compared if it is of type value, otherwise `undefined`

`$isOdd(value:any)` - returns item being compared if it is odd, otherwise `undefined`

`$isEven(value:any)` - returns item being compared if it is even, otherwise `undefined`

`$isTruthy(value:any)` - returns item being compared if it is truthy, otherwise `undefined`

`$isFalsy(value:any)` - returns item being compared if it is falsy, otherwise `undefined`

`$isPositive(value:any)` - returns item being compared if it is positive, otherwise `undefined`

`$isNegative(value:any)` -  returns item being compared if it is negative, otherwise `undefined`

`$isFloat(value:any)` -  returns item being compared if it is a float, otherwise `undefined`

`$isNaN(value:any)` -  returns item being compared if it is not a number, otherwise `undefined`

`$isInteger(value:any)` -  returns item being compared if it is an integer, otherwise `undefined`

`$isUndefined(value:any)` -  returns item being compared if it is undefined, otherwise `undefined`

`$isDefined(value:any)` -  returns item being compared if it is defined, otherwise `undefined`

`$isNull(value:any)` -  returns item being compared if it is null, otherwise `undefined`

`$isPrimitive(value:any)` -  returns item being compared if it is a primitive, otherwise `undefined`

`$isArray(value:any)` -  returns item being compared if it is an array, otherwise `undefined`

`$isEmail(value:any)`  -  returns item being compared if it is an email address , otherwise `undefined`

`$isURL(value:any)`  -  returns item being compared if it is a URL , otherwise `undefined`

`$isUUID(value:any)`  -  returns item being compared if it is a v4 UUID , otherwise `undefined`

`$isISBN(value:any)`  -  returns item being compared if it is an ISBN number, otherwise `undefined`

`$isSSN(value:any)`  -  returns item being compared if it is a social security number, otherwise `undefined`

`$isZIPCode(value:any)`  -  returns item being compared if it is a zip code, otherwise `undefined`

### Comparisons

`$lt(value:number|string)` - returns item being compared if it is < value, otherwise `undefined`

`$lte(value:number|string)` - returns item being compared if it is <= value, otherwise `undefined`

`$eq(value:number|string)` - returns item being compared if it is == value, otherwise `undefined`

`$eeq(value:number|string)` - returns item being compared if it is === value, otherwise `undefined

`$neq(value:number|string)` - returns item being compared if it is != value, otherwise `undefined`

`$gte(value:number|string)` - returns item being compared if it is >= value, otherwise `undefined`

`$gt(value:number|string)` - returns item being compared if it is > value, otherwise `undefined`

`$between(value1:number|string,value2:number|string)` - returns item being compared if it is >= value1 and <= value2 , otherwise `undefined`

`$outside(value1:number|string,value2:number|string)` - returns item being compared if it is < value1 or > value2 , otherwise `undefined`

### Arrays & Strings

`$in(value:array|string)` - returns item being compared if it is in value, otherwise `undefined`

`$nin(value:array|string)` - returns item being compared if it is not in value, otherwise `undefined`

`$includes(value:any)` - returns item being compared if it contains value, otherwise `undefined`

`$excludes(value:any)` - returns item being compared if it does not contain value, otherwise `undefined`

`$in(value:array|string)` - returns item being compared if it is in value, otherwise `undefined`

`$nin(value:array|string)` - returns item being compared if it is not in value, otherwise `undefined`

`$startsWith(value:string)` - returns item being compared if it starts with value, otherwise `undefined`

`$endsWith(value:string)` - returns item being compared if it ends with value, otherwise `undefined`

`$length(value:number)` - returns item being compared if it has length value, otherwise `undefined`

### Sets (based on Arrays)

`$intersects(value:array)` - returns item being compared if it intersects with value, otherwise `undefined`

`$disjoint(value:array)` - returns item being compared if it does not intersect with value, otherwise `undefined`

`$subset(value:array)` - returns item being compared if it is a subset of value, otherwise `undefined`

`$superset(value:array)` - returns item being compared if it is a superset of value, otherwise `undefined`

`$symmetric(value:array)` - returns item being compared if it is a symmetric of value, otherwise `undefined`

### Other String Operators

`$matches(regexp:RegExp)` -  returns item being compared if it matches `regexp`, otherwise `undefined`

`$echoes(value:string)` - returns item being compared if it sounds like `value`, otherwise `undefined`

### Math

`$odd(value)` - returns item being compared if it is odd , otherwise `undefined`

`$even(value)` - returns item being compared if it is even , otherwise `undefined`

`add(value:array)` - returns item being compared if item being compared + value[0] === value[1] , otherwise `undefined`

`subtract(value:array)` - returns item being compared if item being compared - value[0] === value[1] , otherwise `undefined`

`multiply(value:array)` - returns item being compared if item being compared * value[0] === value[1] , otherwise `undefined`

`divide(value:array)` - returns item being compared if item being compared / value[0] === value[1] , otherwise `undefined`

`$mod(value:array)` - returns item being compared if the mod of value[0] is value[1] , otherwise `undefined`

### LMDB Index API

Developers should be familiar with the behavior of [lmdb-index](https://github.com/anywhichway/lmdb-index), particularly `defineSchema` and `put`, the documentation for which is replicated here:

### async defineSchema(classConstructor,?options={}) - returns boolean

- The key names in the array `options.indexKeys` will be indexed. If no value is provided, all keys will be indexed. If `options.indexKeys` is an empty array, no keys will be indexed.
- If the property `options.idKey` is provided, its value will be used for unique ids. If `options.idKey` is not provided, the property `#` on instances will be used for unique ids.
- If the property `options.keyGenerator` is provided, its value should be a function that returns a unique id. This will be prefixed by `<className>@`. If `options.keyGenerator` is not provided, a v4 UUID will be used.

The `options` properties and values are inherited by child schema, i.e. if you define them for `Object`, then you do not need to provide them for other classes.

To index all keys on all objects using UUIDs as ids and `#` as the id key, call `db.defineSchema(Object)`.

### async db.put(key,value,?version,?ifVersion) - returns boolean

Works similar to [lmdb put](https://github.com/kriszyp/lmdb-js#dbputkey-value-version-number-ifversion-number-promiseboolean)

If `value` is an object, it will be indexed by the top level keys of the object so long as it is an instance of an object controlled by a schema declared with `defineSchema`. To index all top level keys on all objects, call `db.defineSchema(Object)`. If `key` is `null`, a unique id will be generated and added to the object. See [defineSchema](#async-defineschemaclassconstructor-options) for more information.

If there is a mismatch between the `key` and the `idKey` of the object, an Error will be thrown.

***Note***: For objects to be retrievable using `lmdb-oql`, the assignment of keys to objects ***MUST*** be done by calling `put` with `null or keys ***MUST*** be of the form `<classname>@<unique-identifier>`

# API

The `select` method is documented first because it illustrates the full range of argument surfaces also used in `delete`, `insert`, and `update`. After `select`, methods are documented in alphabetical order.

`* db.select(?selector:object|function,?{class:constructor}).from(...classes).where(?conditions:object)` - yields object representing join

A generator function that selects instances across multiple classes based on a `conditions` object that can contain literals, regular expressions, functions, and joins. The `where` chained function optimizes the `conditions` and processes the most restrictive criteria first.

The yielded value will be a class instance if only one class is provided in `from` and plain object if the selection is done across multiple classes unless a `class` is provided to `selector`. A `class` provided to `select` and used in `from` does not have to be declared using `defineSchema`, it will be automatically declared and all top level properties will be indexed. If a schema has already been defined, it will be respected. The objects nested in the `conditions` object (see `where` below) do not have to be instances of their respective classes, it is their data values that matter.

`selector(result:object)` - If selector is a function it takes an object representing the joined instances matching the `where` object. It can manipulate the object in any way it wishes. It defaults to `(value) => value`

`selector:object` - If `selector` is an object, its properties can be functions or regular expressions that extract and manipulate values from the result joined instances matching the `where` object.

`...classes` can be any number of class constructors. By default, the constructor name will be used as an alias in the `where` clause and joined instances. Specific alias can be provided by using two element arrays, e.g. `from([Person,"P1"],[Person,"P2"])` if you need to join `Person` back to itself.

`where` is an onbject with top level properties matching class names or aliases. The values of these properties are objects used to match against instances of the classes. These sub-objects contain literals, RegExp, and functions as property values. Serialized regular expressions can also be used for property names. Joins are created by using a class alias (see `...classes` above) as a property name.

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

`* async db.delete().from(...classes:class).where(?conditions:object)` - yields ids of deleted objects

Deletes instances of `classes` based on `conditions`. If `conditions` is not provided, all instances of `classes` will be deleted.

All the deletions are done in a single transaction.

Attempting to use `.db.get()` on a deleted object will return `undefined`. The `ids` are just yielded for convenience.

`* async db.insert().into(...classes:class).values(values:object)` - yields ids of inserted objects as an array

Multiple `classes` can be provided. If they do not have a schema defined, one will be defined automatically. This is the primary advantage of using `insert` over `put` with a null key.

The `values` object should contain top level properties that match the class names or aliases of the `classes` provided. The values of those properties should be objects containing the properties to be inserted,e g. `{Person:{name:"Bill",age:22}}` will insert a `Person` with name "Bill" and age of 22. You can also provide an array of objects to insert multiple objects, e.g. `{Person:[{name"Mary",age:22},{name:"John",age:23}]}` will insert two `Person` objects. If you need to store Arrays as top level database objects, you can use the `Array` class and MUST provide an array with more than one dimension as a value, e.g. `{Array:[[1,2,3],[4,5,6]]}` will insert `Array` objects.

All the inserts are done in a single transaction.

`* async db.put(key,?data,?options)` - yields id of inserted object

Effectively the same as `db.put(null,data)` except that `data` can be a plain object and is coerced into and instance of a class.

`* async db.update(...classes:class).set(updates:object).where(?conditions:object)` - yields ids of updated objects

Patches instances of `classes`with `updates` based on `conditions`. If `conditions` is not provided, all instances of `classes` will be updated.

Multiple `classes` can be provided. The `updates` object should contain top level properties that match the class names of the `classes` provided. The values of those properties should be objects containing the properties to be updated and their new values,e g. `{Person:{age:22}}` will update all matching instances of `Person` to have the age of 22.

All the updates are done in a single transaction.

Providing property values of `undefined` in `updates will delete the property from instances.


# Testing

Testing conducted with `jest`.

File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|------------------------
All files      |   90.09 |    84.24 |   94.78 |   91.12 |
lmdb-oql      |   86.58 |    67.62 |   88.46 |   88.39 |
index.js     |   86.58 |    67.62 |   88.46 |   88.39 | ...12,125-126,136-137,143-144,165,182,212,280,315,356,365,374
lmdb-oql/src  |     100 |    97.67 |     100 |     100 |
operators.js |     100 |    97.67 |     100 |     100 | 10,167,171-172

# Release Notes (Reverse Chronological Order)

During ALPHA and BETA, the following semantic versioning rules apply:

* The major version will be zero.
* Breaking changes or feature additions will increment the minor version.
* Bug fixes and documentation changes will increment the patch version.


2023-11-26 v0.5.8 Updated test suite to ensure operation with child databases.

2023-06-01 v0.5.7 Integrated v1.0.0 release of `lmdb-index`. Removed `lmdb-query` and `array-set-ops` as dependencies.

2023-05-26 v0.5.6 Corrected respository pointer in package.json.

2023-05-04 v0.5.5 Documentation corrections.

2023-05-04 v0.5.4 Updated dependencies.

2023-05-04 v0.5.3 Documentation enhancements. Fixed issues related to undocumented `.exec()` functions. Improved performance of `select`. Added some unit tests.

2023-05-03 v0.5.2 Documentation enhancements. Fixed issues related to complex joins and nested object matches not returning results. Added some performance testing and did a little optimization. Ensured all `oql` database changes are wrapped in transactions. Unit test coverage has degraded from 96% to 90% due to the addition of some code.

2023-05-02 v0.5.1 Documentation typo fixes.

2023-05-02 v0.5.0 Implemented `delete`, `update`, `insert`, `$and`, `$or`, `$not`. Added unit tests and updated documentation.
API is now stable. Unit tests are now over 90% coverage. Moving to BETA.

2023-05-01 v0.4.0 Improved/optimized join capability. Added many operators. Enhanced unit tests. Enhanced documentation.

2023-04-30 v0.3.0 Implemented ability to return `IDS` only for `select`. Added lots of operators. Enhanced documentation.

2023-04-29 v0.2.1 Enhanced documentation and `examples/basic.js`.

2023-04-28 v0.2.0 Implemented operator support. Updated dependencies.

2023-04-27 v0.1.0 Enhanced documentation. Re-implemented `where` to be more efficient.

2023-04-27 v0.0.1 Initial public release.

# License

This software is provided as-is under the [MIT license](http://opensource.org/licenses/MIT).

Copyright (c) 2023, AnyWhichWay, LLC and Simon Y. Blackwell.
