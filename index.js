import {ANY,selector} from "lmdb-index";
import cartesianProduct from "@anywhichway/cartesian-product";
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

function compileClasses (db,...classes) {
    return classes.reduce((result,item) => {
        const [cls,name] = Array.isArray(item) ? item : [item],
            cname = cls.name,
            index = "@@" + cname;
        db.defineSchema(cls);
        result[name||cname] = {
            cname,
            *entries(property,value) {
                const type = typeof(value);
                if(type==="string" || type==="number" || type==="boolean") {
                    for(const {key} of db.getRange([property,value,index])) {
                        if(key.length===4) {
                            const id = key[key.length-1],
                                value = db.get(id);
                            if(value!==undefined) {
                                yield {key:id,value}
                            }
                        }
                    }
                } else {
                    for(const {key} of db.getRangeFromIndex({[property]:value},null,null,{cname})) {
                        const value = db.get(key);
                        if(value!==undefined) {
                            yield {key,value}
                        }
                    }
                }
            }
        }
        return result;
    },{});
}

function* where(db,conditions={},classes,select,coerce) {
    const results = {};
    // {$t1: {name: {$t2: {name: (value) => value!=null}} or null is a function for testing
    const aliases = new Set();
    for(const [leftalias,leftpattern] of Object.entries(conditions)) {
        const cname = classes[leftalias]?.cname,
            idprefix = cname ? cname + "@" : /.*\@/g,
            schema = db.getSchema(cname),
            idkey = schema?.idKey || "#";
        aliases.add(leftalias);
        results[leftalias] ||= {};
        let maxCount = 0;
        for(const [leftproperty,test] of Object.entries(leftpattern)) {
            const type = typeof(test);
            let generator
            if(test && type==="object") { // get all instances of <cname>@
                generator = db.getRange({start:[idprefix]});
            } else { // get ids of all instances. relies on index structure created by lmdb-index, could use getRangeWhere instead, but less efficient
                generator = db.getRangeFromIndex({[leftproperty]:test})
            }
            for(let {value} of generator) {
                const id = value[schema.idKey];
                if(!id.startsWith(idprefix) && !(typeof(idPrefix)==="object" && idprefix instanceof RegExp && !id.match(idprefix))) {
                    break;
                }
                let leftvalue = value[leftproperty];
                results[leftalias][id] ||= {count:0,value};
                maxCount = results[leftalias][id].count += 1;
                if(test && type==="object") {
                    for (const [rightalias, rightpattern] of Object.entries(test)) {
                        results[rightalias] ||= {};
                        aliases.add(rightalias);
                        let every = true;
                        for (const [rightproperty, rightvalue] of Object.entries(rightpattern)) {
                            const type = typeof (rightvalue);
                            // fail if property value test fails
                            if ((type === "function" && rightvalue.length === 1 && rightvalue(leftvalue) === undefined) || (type !== "function" && rightvalue !== leftvalue)) {
                                every = false;
                                break;
                            }
                            // gets objects with same property where property values match
                            const test = type === "function" ? ANY : leftvalue; // get all values for property
                            for (const {
                                key,
                                value
                            } of classes[rightalias].entries(rightproperty, test)) {
                                // fail if comparison function fails
                                if (type === "function" && rightvalue.length > 1 && (rightvalue.callRight ? rightvalue.callRight(leftvalue, value[rightproperty]) : rightvalue(leftvalue, value[rightproperty])) === undefined) {
                                    delete results[rightalias][key];
                                    break;
                                }
                                results[rightalias][key] ||= {value};
                            }
                        }
                        if (!every) {
                            delete results[rightalias];
                            break;
                        }
                    }
                }
            }
            if(maxCount===0) {
                delete results[leftalias];
                break;
            }
        }
        if(maxCount===0) {
            delete results[leftalias];
            break;
        }
        for(const [id, {count}] of Object.entries(results[leftalias])) {
            if(count<maxCount) {
                delete results[leftalias][id];
            }
        }
    }
    if(![...Object.values(aliases)].every((alias) => alias in results)) {
        return;
    }
    const names = Object.keys(results);
    for(const classValues of Object.values(results)) {
        for (const product of cartesianProduct(Object.keys(classValues))) { // get all combinations of instance ids for each class
            const join = {};
            product.forEach((id, i) => {
                const name = names[i];
                join[name] = results[name][id].value;
            })
            const selected = select ? (select === IDS ? select.bind(db)(join) : selector(join,select)) : join;
            if (selected != undefined) {
                yield selected;
            }
        }
    }
}

function del() {
    const db = this;
    return {
        from(...classes) {
            classes = compileClasses(db,...classes);
            async function *_where(conditions={}) {
                for(const join of where(db,conditions,classes,IDS)) {
                    for(const id of join) {
                        await db.remove(id);
                        yield id;
                    }
                }
            }
            return {
                where(conditions={}) {
                    let generator = _where(optimize(conditions,classes));
                    const exec = async () => {
                        const items = [];
                        for await (const item of generator) {
                            items.push(item);
                        }
                        generator = _where(optimize(conditions,classes));
                        generator.exec = exec;
                        return items;
                    }
                    generator.exec = exec;
                    return generator;
                }
            }
        }
    }
}

function insert() {
    const db = this;
    return {
        into(...classes) {
            classes = compileClasses(db,...classes);
            async function* _values(values) {
                for(let [key,instances] of Object.entries(values)) {
                    const {cname} = classes[key],
                        schema = db.getSchema(cname);
                    if(instances instanceof Array) {
                        if(!(instances[0] instanceof Array) && schema.create([]) instanceof Array) {
                            throw new TypeError("Expected array of arrays when inserting Array");
                        }
                    } else {
                        instances = [instances];
                    }
                    for(let instance of instances) {
                        if(!(instance instanceof schema.ctor)) {
                            instance = schema.create(instance);
                        }
                        yield await db.put(null,instance);
                    }
                }
            }
            return {
                values(values) {
                    let generator = _values(values);
                    const exec = async () => {
                        const ids = [];
                        for await(const id of generator) {
                            ids.push(id);
                        }
                        generator = _values(values);
                        generator.exec = exec;
                        return ids;
                    };
                    generator.exec = exec;
                    return generator;
                }
            }
        }
    }
}

function select(select) {
    const db = this;
    return {
        from(...classes) {
            classes = compileClasses(db,...classes);
            function *_where(conditions={}) {
                for(const item of where(db,conditions,classes,select)) {
                    yield item;
                }
            }
            return {
                where(conditions={}) {
                    let generator = _where(optimize(conditions,classes));
                    const exec = () => {
                        const items = [];
                        for (const item of generator) {
                            items.push(item);
                        }
                        generator = _where(optimize(conditions,classes));
                        generator.exec = exec;
                        return items;
                    }
                    generator.exec = exec;
                    return generator;
                }
            }
        }
    }
}

function update(...classes) {
    const db = this;
    classes = compileClasses(db,...classes);
    return {
        set(patches) {
            async function *_where(conditions={}) {
                for(const join of where(db,conditions,classes,IDS)) {
                    for(const id of join) {
                        for(const {cname} of Object.values(classes)) {
                            const patch = patches[cname];
                            if(patch && id.startsWith(cname+"@")) {
                                await db.patch(id,patch);
                            }
                        }
                        yield id;
                    }
                }
            }
            return {
                where(conditions={}) {
                    let generator = _where(optimize(conditions,classes));
                    const exec = async () => {
                        const items = [];
                        for await(const item of generator) {
                            items.push(item);
                        }
                        generator = _where(optimize(conditions,classes));
                        generator.exec = exec;
                        return items;
                    }
                    generator.exec = exec;
                    return generator;
                }
            }
        }
    }
}

import {withExtensions as lmdbExtend} from "lmdb-index";

const withExtensions = (db,extensions={}) => {
    return lmdbExtend(db,{delete:del,insert,select,update,...extensions})
}

const functionalOperators = Object.entries(operators).reduce((operators,[key,f]) => {
    operators[key] = function(test) {
        let join;
        const op = (left,right) => {
            return join ? f(left,right) : f(left,{test});
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
    operators.$and = (...tests) => {
        const op = (left,right) => {
            return tests.every((test) => test(left,right));
        }
        op.callRight = (left,right) => {
            return tests.every((test) => test.callRight(left,right));
        }
        return op;
    }
    operators.$or = (...tests) => {
        const op = (left,right) => {
            return tests.some((test) => test(left,right));
        }
        op.callRight = (left,right) => {
            return tests.every((test) => test.callRight(left,right));
        }
        return op;
    }
    operators.$not = (test) => {
        const op = (left,right) => {
            return !test(left,right);
        }
        op.callRight = (left,right) => {
            return !test.callRight(left,right);
        }
        return op;
    }
    return operators;
},{});

function IDS(value) {
    return Object.values(value).map((value) => {
        const schema = this.getSchema(value);
        return schema ? value[schema.idKey||"#"] : value["#"]
    });

}

export {functionalOperators as operators,withExtensions,IDS}