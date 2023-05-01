import {operators} from './operators.js';

test("$type",() => {
    expect(operators.$type("hello",{test:"string"})).toBe("hello");
    expect(operators.$type("hello",{test:"number"})).toBeUndefined();
    expect(operators.$type(123,{test:"number"})).toBe(123);
    expect(operators.$type(123,{test:"string"})).toBeUndefined();
})

test("$lt",() => {
    expect(operators.$lt(1, {test: 2})).toBe(1);
    expect(operators.$lt(2, {test: 2})).toBeUndefined();
})

test("$lte",() => {
    expect(operators.$lte(1, {test: 2})).toBe(1);
    expect(operators.$lte(2, {test: 2})).toBe(2);
    expect(operators.$lte(3, {test: 2})).toBeUndefined();
})

test("$eq",() => {
    expect(operators.$eq(1, {test: 2})).toBeUndefined();
    expect(operators.$eq(2, {test: 2})).toBe(2);
})

test("$eeq",() => {
    expect(operators.$eeq(1, {test: 2})).toBeUndefined();
    expect(operators.$eeq(2, {test: 2})).toBe(2);
})

test("$neq",() => {
    expect(operators.$neq(1, {test: 2})).toBe(1);
    expect(operators.$neq(2, {test: 2})).toBeUndefined();
})

test("$gte",() => {
    expect(operators.$gte(1, {test: 2})).toBeUndefined();
    expect(operators.$gte(2, {test: 2})).toBe(2);
    expect(operators.$gte(3, {test: 2})).toBe(3);
})

test("$gt",() => {
    expect(operators.$gt(1, {test: 2})).toBeUndefined();
    expect(operators.$gt(2, {test: 2})).toBeUndefined();
    expect(operators.$gt(3, {test: 2})).toBe(3);
})

test("$between",() => {
    expect(operators.$between(1, {test: [2,3]})).toBeUndefined();
    expect(operators.$between(2, {test: [2,3]})).toBe(2);
    expect(operators.$between(3, {test: [2,3]})).toBe(3);
    expect(operators.$between(4, {test: [2,3]})).toBeUndefined();
})

test("$outside",() => {
    expect(operators.$outside(1, {test: [2,3]})).toBe(1);
    expect(operators.$outside(2, {test: [2,3]})).toBeUndefined();
    expect(operators.$outside(3, {test: [2,3]})).toBeUndefined();
    expect(operators.$outside(4, {test: [2,3]})).toBe(4);
})

test("$in",() => {
    expect(operators.$in(1, {test: [2,3]})).toBeUndefined();
    expect(operators.$in(2, {test: [2,3]})).toBe(2);
    expect(operators.$in(3, {test: [2,3]})).toBe(3);
    expect(operators.$in(4, {test: [2,3]})).toBeUndefined();
})

test("$nin",() => {
    expect(operators.$nin(1, {test: [2,3]})).toBe(1);
    expect(operators.$nin(2, {test: [2,3]})).toBeUndefined();
    expect(operators.$nin(3, {test: [2,3]})).toBeUndefined();
    expect(operators.$nin(4, {test: [2,3]})).toBe(4);
})

test("$includes",() => {
    expect(operators.$includes(1, {test: [2, 3]})).toBeUndefined();
    expect(operators.$includes(2, {test: [2, 3]})).toBe(2);
    expect(operators.$includes(3, {test: [2, 3]})).toBe(3);
})

test("$excludes",() => {
    expect(operators.$excludes(1, {test: [2, 3]})).toBe(1);
    expect(operators.$excludes(2, {test: [2, 3]})).toBeUndefined();
    expect(operators.$excludes(3, {test: [2, 3]})).toBeUndefined();
})

test("$intersects",() => {
    expect(operators.$intersects([1], {test: [2, 3]})).toBeUndefined();
    expect(operators.$intersects([2], {test: [2, 3]})).toEqual([2]);
})

test("$disjoint",() => {
    expect(operators.$disjoint([1], {test: [2, 3]})).toEqual([1]);
    expect(operators.$disjoint([2], {test: [2, 3]})).toBeUndefined();
})

test("$subset",() => {
    expect(operators.$subset([1], {test: [2, 3]})).toBeUndefined();
    expect(operators.$subset([2], {test: [2, 3]})).toEqual([2]);
})

test("$superset",() => {
    expect(operators.$superset([1,2,3], {test: [2, 3]})).toEqual([1,2,3]);
    expect(operators.$superset([2], {test: [2, 3]})).toBeUndefined();
})

test("$symmetric",() => {
    expect(operators.$symmetric([2,3], {test: [2, 3]})).toEqual([2,3]);
    expect(operators.$symmetric([3,2], {test: [2, 3]})).toEqual([3,2]);
    expect(operators.$symmetric([2], {test: [2, 3]})).toBeUndefined();
})

test("$startsWith",() => {
    expect(operators.$endsWith("1", {test: "2"})).toBeUndefined();
    expect(operators.$endsWith("2", {test: "2"})).toBe("2");
    expect(operators.$endsWith("2", {test: 2})).toBe("2");
})

test("$endsWith",() => {
    expect(operators.$endsWith("1", {test: "2"})).toBeUndefined();
    expect(operators.$endsWith("2", {test: "2"})).toBe("2");
    expect(operators.$endsWith("2", {test: 2})).toBe("2");
})

test("$length",() => {
    expect(operators.$length("123", {test: 2})).toBeUndefined();
    expect(operators.$length("123", {test: 3})).toBe("123");
    expect(operators.$length([1,2,3], {test: 2})).toBeUndefined();
    expect(operators.$length([1,2,3], {test: 3})).toEqual([1,2,3]);
})

test("$matches",() => {
    expect(operators.$matches(1, {test: /2/})).toBeUndefined();
    expect(operators.$matches(2, {test: /2/})).toBe(2);
})

test("$echoes",() => {
    expect(operators.$echoes("lyme", {test: "lime"})).toBe("lyme");
    expect(operators.$echoes("lemon", {test: "apple"})).toBeUndefined();
})

test("$isOdd",() => {
    expect(operators.$isOdd(1, {test: true})).toBe(1);
    expect(operators.$isOdd(2, {test: true})).toBeUndefined();
})

test("$isEven",() => {
    expect(operators.$isEven(1, {test: true})).toBeUndefined();
    expect(operators.$isEven(2, {test: true})).toBe(2);
})

test("$isPositive",() => {
    expect(operators.$isPositive(1, {test: true})).toBe(1);
    expect(operators.$isPositive(-1, {test: true})).toBeUndefined();
})

test("$isNegative",() => {
    expect(operators.$isNegative(1, {test: true})).toBeUndefined();
    expect(operators.$isNegative(-1, {test: true})).toBe(-1);
})

test("$isInteger",() => {
    expect(operators.$isInteger(1, {test: true})).toBe(1);
    expect(operators.$isInteger(1.1, {test: true})).toBeUndefined();
})

test("$isFloat",() => {
    expect(operators.$isFloat(1, {test: true})).toBeUndefined();
    expect(operators.$isFloat(1.1, {test: true})).toBe(1.1);
})

test("$isNaN",() => {
    expect(operators.$isNaN(1, {test: true})).toBeUndefined();
    expect(operators.$isNaN(NaN, {test: true})).toBe(NaN);
})

test("$isTruthy",() => {
    expect(operators.$isTruthy(1, {test: true})).toBe(1);
    expect(operators.$isTruthy(0, {test: true})).toBeUndefined();
})

test("$isFalsy",() => {
    expect(operators.$isFalsy(1, {test: true})).toBeUndefined();
    expect(operators.$isFalsy(0, {test: true})).toBe(0);
})

test("$isCreditCard",() => {
    expect(operators.$isCreditCard(1, {test: true})).toBeUndefined();
    expect(operators.$isCreditCard("4012888888881881", {test: true})).toBe("4012888888881881");
})

test("$isEmail",() => {
    expect(operators.$isEmail(1, {test: true})).toBeUndefined();
    expect(operators.$isEmail("nobody@nowhere.com", {test: true})).toBe("nobody@nowhere.com");
})

test("$isURL",() => {
    expect(operators.$isURL(1, {test: true})).toBeUndefined();
    expect(operators.$isURL("http://www.nowhere.com", {test: true})).toBe("http://www.nowhere.com");
})

test("$isUUID",() => {
    expect(operators.$isUUID(1, {test: true})).toBeUndefined();
    expect(operators.$isUUID("550e8400-e29b-41d4-a716-446655440000", {test: true})).toBe("550e8400-e29b-41d4-a716-446655440000");
})

test("$isIPAddress",() => {
    expect(operators.$isIPAddress(1, {test: true})).toBeUndefined();
    expect(operators.$isIPAddress("127.0.0.1", {test: true})).toBe("127.0.0.1")
})

test("$isSSN",() => {
    expect(operators.$isSSN(1, {test: true})).toBeUndefined();
    expect(operators.$isSSN("123-45-6789", {test: true})).toBe("123-45-6789");
})

test("$isISBN",() => {
    expect(operators.$isISBN(1, {test: true})).toBeUndefined();
    expect(operators.$isISBN("978-0-596-52068-7", {test: true})).toBe("978-0-596-52068-7");
})

test("$isZIPCode",() => {
    expect(operators.$isZIPCode(1, {test: true})).toBeUndefined();
    expect(operators.$isZIPCode("12345", {test: true})).toBe("12345");
})



test("$add",() => {
    expect(operators.$add(1, {test: [1, 2]})).toBe(1);
    expect(operators.$add(1, {test: [1, 3]})).toBeUndefined();
})

test("$subtract",() => {
    expect(operators.$subtract(1, {test: [1, 0]})).toBe(1);
    expect(operators.$subtract(1, {test: [1, 2]})).toBeUndefined();
})

test("$multiply",() => {
    expect(operators.$multiply(1, {test: [1, 1]})).toBe(1);
    expect(operators.$multiply(1, {test: [1, 2]})).toBeUndefined();
})

test("$divide",() => {
    expect(operators.$divide(1, {test: [1, 1]})).toBe(1);
    expect(operators.$divide(1, {test: [1, 2]})).toBeUndefined();
})

test("$mod",() => {
    expect(operators.$mod(1, {test: [1, 0]})).toBe(1);
    expect(operators.$mod(1, {test: [1, 2]})).toBeUndefined();
})

test("$pow",() => {
    expect(operators.$pow(1, {test: [1, 1]})).toBe(1);
    expect(operators.$pow(1, {test: [1, 2]})).toBeUndefined();
})

/*
test("$$if",() => {
    expect(operators.$$if("hello",{test:["hello","world","goodbye"]})).toBe("world");
    expect(operators.$$if("goodbye",{test:["hello","world","goodbye"]})).toBe("goodbye");
    expect(operators.$$if("world",{test:["hello","world","goodbye"]})).toBeUndefined();
})
test("$$case",() => {
    expect(operators.$$case("hello",{test:["hello","world","goodbye"]})).toBe("world");
    expect(operators.$$case("goodbye",{test:["hello","world","goodbye","world"]})).toBe("world");
    expect(operators.$$case("world",{test:["hello","world","default"]})).toBe("default");
    expect(operators.$$case("world",{test:["hello","world"]})).toBeUndefined()
})
test("$$concat",() => {
    expect(operators.$$concat("hello",{test:"world"})).toBe("helloworld");
    expect(operators.$$concat([1],[2])).toEqual([1,2]);
    expect(operators.$$concat("hello",{test:1})).toBe("hello1");
    expect(operators.$$concat("hello",{test:[1,2]})).toBe("hello1,2");
    expect(operators.$$concat("hello",{test:{a:1}})).toBe("hello[object Object]");
    expect(operators.$$concat("hello",{test:undefined})).toBe("helloundefined");
    expect(operators.$$concat(1,{test:1})).toBe("11");
})
test("$$join",() => {
    expect(operators.$$join("hello",{test:"world"})).toBe("helloworld");
    expect(operators.$$join([1],[2])).toEqual([1,2]);
    expect(operators.$$join("hello",{test:1})).toBe("hello1");
    expect(operators.$$join("hello",{test:[1,2]})).toBe("hello1,2");
    expect(operators.$$join("hello",{test:{a:1}})).toBe("hello[object Object]");
    expect(operators.$$join("hello",{test:undefined})).toBe("helloundefined");
    expect(operators.$$join(1,{test:1})).toBe("11");
})
test("$$slice",() => {
    expect(operators.$$slice([1,2,3,4],{test:[1]})).toEqual([2,3,4]);
    expect(operators.$$slice([1,2,3,4],{test:[1,2]})).toEqual([2,3]);
    expect(operators.$$slice("hello",{test:1})).toBe("ello");
    expect(operators.$$slice("hello",{test:[1,3]})).toBe("el");
    expect(operators.$$slice(1,{test:[1]})).toBeUndefined()
})
test("$$substring",() => {
    expect(operators.$$substring("hello",{test:[1]})).toBe("ello");
    expect(operators.$$substring("hello",{test:[1,3]})).toBe("el");
    expect(operators.$$substring(1,{test:[1]})).toBeUndefined()
})
*/


