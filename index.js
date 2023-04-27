

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
                *where(where) {
                    const results = [];
                    // {$t1: {name: {$t2: {name: (value) => value!=null}} or null is a function for testing
                    for(const [leftalias,leftpattern] of Object.entries(where)) {
                        const joins = [],
                            aliases = new Set(),
                            cname = _classes[leftalias]?.cname,
                            idprefix = cname ? cname + "@" : /.*\@/g,
                            index = "@@" + cname,
                            schema = getSchema.call(db,cname);
                        let i = 0;
                        //for(const {key,value} of getRangeWhere.call(db,[idprefix],null,null,{bumpIndex:0,bump(value) { return value + String.fromCharCode(65535)}})) { // gets all objects of class cname
                        //const left = schema ? schema.create(value) : value;
                        for(const [leftproperty,test] of Object.entries(leftpattern)) {
                            const type = typeof(test);
                            let generator;
                            if(test && type==="object") { // get all instances
                                generator = getRangeWhere.call(db,[idprefix],null,null,{bumpIndex:0,bump(value) { return value + String.fromCharCode(65535)}})
                            } else { // get ids of all instances
                                generator = getRangeWhere.call(db,[leftproperty,test,index])
                            }
                            const joinLength = joins.length;
                            let count = 0;
                            for(let {key,value} of generator) {
                                // get instances if key is an array, otherwise key is the id and value is the instance
                                count++;
                                value = Array.isArray(key) ? db.get(key.pop()) : value;
                                const left = value;
                                let leftvalue = type==="function" ? test(left[leftproperty]) : left[leftproperty];
                                if (leftvalue === undefined) {
                                    break;
                                } // skips objects that do not have requested property or if property fails test
                                if(test && type==="object") {
                                    const values = {};
                                    for (const [rightalias, rightpattern] of Object.entries(test)) {
                                        aliases.add(rightalias);
                                        values[rightalias] = {};
                                        let every = true;
                                        for (const [rightproperty, rightvalue] of Object.entries(rightpattern)) {
                                            const type = typeof (rightvalue);
                                            // fail if property value test fails
                                            if ((type === "function" && rightvalue.length === 1 && rightvalue(leftvalue) === undefined) || (type !== "function" && rightvalue !== leftvalue)) {
                                                break;
                                            }
                                            ;
                                            // gets objects with same property where property values match
                                            const test = type === "function" ? ANY : leftvalue; // get all values for property
                                            for (const {
                                                key,
                                                value
                                            } of _classes[rightalias].entries(rightproperty, test)) {
                                                // fail if comparison function fails
                                                if (type === "function" && rightvalue.length > 1 && rightvalue(leftvalue, value[rightproperty]) === undefined) {
                                                    delete values[rightalias][key];
                                                    break;
                                                }
                                                values[rightalias][key] = value;
                                            }
                                        }
                                        if (!every) {
                                            delete values[rightalias];
                                            break;
                                        }
                                    }
                                    Object.entries(values).forEach(([rightalias, entries], j, array1) => {
                                        Object.entries(entries).forEach(([id, value], k, array2) => {
                                            joins[i] ||= [];
                                            const target = joins[i][(j * array1.length) + (k * array2.length)] ||= {};
                                            Object.assign(target, {[leftalias]: left, [rightalias]: value})
                                        })
                                    })
                                } else {
                                    joins[i] ||= [];
                                    const target = joins[i][0] ||= {};
                                    Object.assign(target, {[leftalias]: left});
                                }
                                i++;
                            }
                            if(count===0) {
                                joins.splice(0,joinLength)
                                break;
                            }
                        }
                        // }
                        for(const join of joins.flat()) {
                            if([...aliases].every((alias) => join[alias])) {
                                yield selector(select,join);
                            }
                        }
                    }
                }
            }
        }
    }
}

import {withExtensions} from "lmdb-extend";

export {select,withExtensions}