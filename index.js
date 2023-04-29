import {ANY,selector} from "lmdb-query";
import {CXProduct} from "cxproduct";
import {operators} from "./src/operators.js";


const optimize = (conditions,classNames) => {
    // optimize each to level portion
    // to do sort top level portions
    return Object.entries(conditions).reduce((optimized,[alias,condition]) => {
        const optimalOrder = Object.entries(condition).sort(([key1,value1],[key2,value2]) => {
            if(value1===null) {
                return value1===value2 ? 0 : -1
            }
            if(value2===null) {
                return value1===value2 ? 0 : 1
            }
            const type1 = typeof(value1),
                type2 = typeof(value2);
            if(type1==="object") {
                return type2=="object" ? 0 : 1
            }
            if(type1==="function") {
                return type2==="function" ? 0 : type2==="object" ? -1 : 1;
            }
            /*if(classNames.includes(key1)) {
                if(classNames.includes(key2)) {
                    return key1 > key2 ? 1 : key1===key2 ? 0 : -1
                }
                return 1
            }
            if(classNames.includes(key2)) {
                if(classNames.includes(key1)) {
                    return key1 > key2 ? 1 : key1===key2 ? 0 : -1
                }
                return 1
            }*/
            if(type1===type2) {
                return value1 > value2 ? 1 : value1 === value2 ? 0 : -1
            }
            if(type1==="symbol") return -1;
            if(type2==="symbol") return 1;
            return type1 < type2 ? -1 : 1;
        })
        optimized[alias] = optimalOrder.reduce((conditions,[key,value]) => {
            conditions[key] = value;
            return conditions;
        },{})
        return optimized;
    },{})
}

function select(select=(value)=>value) {
    const db = this;
    return {
        from(...classes) {
            const _classes = {};
            classes.forEach((item) => {
                const [cls,name] = Array.isArray(item) ? item : [item],
                    cname = cls.name;
                _classes[name||cname] = {
                    cname,
                    *entries(property,value) {
                        for (const {key} of db.getRangeFromIndex({[property]:value},null,null,{cname})) {
                            const entry = db.getEntry(key);
                            if(entry) {
                                yield {key,value:entry.value}
                            }
                        }
                    }
                }
            });
            return {
                *where(conditions={}) {
                    conditions = optimize(conditions,Object.keys(_classes))
                    const results = {};
                    // {$t1: {name: {$t2: {name: (value) => value!=null}} or null is a function for testing
                    const aliases = new Set();
                    for(const [leftalias,leftpattern] of Object.entries(conditions)) {
                        const cname = _classes[leftalias]?.cname,
                            idprefix = cname ? cname + "@" : /.*\@/g,
                            index = "@@" + cname,
                            schema = db.getSchema(cname);
                        aliases.add(leftalias);
                        results[leftalias] ||= {}
                        //for(const {key,value} of getRangeWhere([idprefix],null,null,{bumpIndex:0,bump(value) { return value + String.fromCharCode(65535)}})) { // gets all objects of class cname
                        //const left = schema ? schema.create(value) : value;
                        let count = 0;
                        for(const [leftproperty,test] of Object.entries(leftpattern)) {
                            const type = typeof(test);
                            let generator;
                            if(test && type==="object") { // get all instances
                                generator = db.getRangeWhere([idprefix],null,null,{bumpIndex:0,bump(value) { return value + String.fromCharCode(65535)}})
                            } else { // get ids of all instances
                                generator = db.getRangeWhere([leftproperty,test,index])
                            }
                            for(let {key,value} of generator) {
                                // get instances if key is an array, otherwise key is the id and value is the instance
                                let id = key;
                                value = Array.isArray(key) ? db.get(id=key.pop()) : schema.create(value);
                                let leftvalue = type==="function" ? (test.callLeft ? test.callLeft(value[leftproperty]) : test(value[leftproperty])) : value[leftproperty];
                                if (leftvalue === undefined) {
                                    delete results[leftalias][id]
                                    break;
                                } // skips objects that do not have requested property or if property fails test
                                results[leftalias][id] = value;
                                count++;
                                if(test && type==="object") {
                                    for (const [rightalias, rightpattern] of Object.entries(test)) {
                                        results[rightalias] ||= {};
                                        aliases.add(rightalias);
                                        let every = true;
                                        for (const [rightproperty, rightvalue] of Object.entries(rightpattern)) {
                                            const type = typeof (rightvalue);
                                            // fail if property value test fails
                                            if ((type === "function" && rightvalue.length === 1 && rightvalue(leftvalue) === undefined) || (type !== "function" && rightvalue !== leftvalue)) {
                                                break;
                                            }
                                            // gets objects with same property where property values match
                                            const test = type === "function" ? ANY : leftvalue; // get all values for property
                                            for (const {
                                                key,
                                                value
                                            } of _classes[rightalias].entries(rightproperty, test)) {
                                                // fail if comparison function fails
                                                if (type === "function" && rightvalue.length > 1 && (rightvalue.callRight ? rightvalue.callRight(leftvalue, value[rightproperty]) : rightvalue(leftvalue, value[rightproperty])) === undefined) {
                                                    delete results[rightalias][key];
                                                    break;
                                                }
                                                results[rightalias][key] = value;
                                            }
                                        }
                                        if (!every) {
                                            delete results[rightalias];
                                            break;
                                        }
                                    }
                                }
                            }
                            if(count===0) {
                                delete results[leftalias];
                                break;
                            }
                        }
                    }
                    if(![...Object.values(aliases)].every((alias) => alias in results)) return;
                    const join = {};
                    let i = 0;
                    const ids = [];
                    for(const values of Object.values(results)) {
                        ids.push(Object.keys(values))
                    }
                    const names = Object.keys(results);
                    for(const product of new CXProduct(ids).asGenerator()) {
                        const join = {};
                        product.forEach((id,i) => {
                            const name = names[i];
                            join[name] = results[name][id];
                        })
                        yield selector(select,join);
                    }
                }
            }
        }
    }
}

function del() {
    return {
        from(...classes) {
            return {
                where(where) {

                }
            }
        }
    }
}

import {withExtensions as lmdbExtend} from "lmdb-index";

const withExtensions = (db,extensions={}) => {
    return lmdbExtend(db,{select,delete:del,...extensions})
}

const functionalOperators = Object.entries(operators).reduce((operators,[key,f]) => {
    operators[key] = function(test) {
        let join;
        const op = (left,right) => {
            return join ? f(left,right) : f(left,{test});
        }
        op.callLeft = (left) => {
            join = true;
            let result;
            try {
                result = op(left,{test});
                join = false;
            } finally {
                join = false;
            }
            return result;
        }
        op.callRight = (left,right) => {
            join = true;
            let result;
            try {
                result = (test===undefined ? op(left, {test:right}) : op(right,{test}));
                join = false;
            } finally {
                join = false;
            }
            return result;
        }
        return op;
    }
    return operators;
},{});

export {withExtensions,functionalOperators as operators}