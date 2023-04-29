import {operators as OPERATORS} from "./src/operators.js";

class FilterArray extends Array { }

function functionalize(key,value,filters=new FilterArray()) {
    if(arguments.length===1) return functionalize(null,key);
    if(OPERATORS[key] || (typeof(value)==="function" && value.name[0]==="$")) {
        const f = OPERATORS[key] || value,
            test = typeof(value)==="function" ? undefined : value;
        filters.push((right,options={}) => f(right, Object.assign({...options},test ? {test} : undefined)));
    }
    if(value && typeof(value)=="object" && !(value instanceof FilterArray)) {
        const result = {};
        return Object.entries(value).reduce((result,[k,v]) => {
            if(OPERATORS[k] || (typeof(v)==="function" && v.name[0]==="$")) {
                result instanceof FilterArray || (result = Object.assign(new FilterArray(),result));
                functionalize(k,v,result);
            } else {
                result[k] = functionalize(k,v);
            }
            return result;
        },{})
    }
    return value;
}
const select = (pattern,{all,isFunctionalized}={}) => {
    pattern = isFunctionalized ? pattern : functionalize(pattern);
    if(!isFunctionalized) console.log(pattern)
    return {
        from(where, {result = {}, root = result, parent, key} = {}) {
            const type = typeof (pattern);
            if (type === "function") {
                return pattern(where, {root, parent, key});
            }
            if (pattern && type === "object") {
                if (pattern instanceof RegExp) {
                    if (typeof (where) === "string") {
                        const match = where.match(pattern);
                        return match ? match[0] : undefined;
                    }
                    return;
                }
                if (pattern instanceof FilterArray) {
                    let final;
                    pattern.every((f) => {
                        final = f(where, {root,parent,key});
                        return final !== undefined;
                    })
                    return final;
                }
                if(all) {
                    Object.entries(where).forEach(([key,value]) => {
                        result[key] = value && typeof(value)==="object" ? {...value} : value
                    })
                }
                Object.entries(pattern).forEach(([key, value]) => {
                    // todo add RegExp matching for keys
                    value = select(value, {all,isFunctionalized:true}).from(where[key], {root, parent:result, key});
                    if(value === undefined) {
                        delete result[key];
                    } else {
                        result[key] = value;
                    }
                })
                if(Object.keys(result).length>0) return result;
            }
            if (pattern === where) {
                return where;
            }
        }
    }
}

console.log(select({name:{$eq: "joe",$test(value) { return value.toUpperCase(); }},address:{city:{$eq:"Seattle",$lift(value,{root,key}) { root[key] = value; }}}},{all:false}).from({age:21,name:"joe",address:{city:"Seattle",zip:"98101"}}));
const str = JSON.stringify({name:{$eq: "joe",$test(value) { return value.toUpperCase(); }},address:{city:{$eq:"Seattle",$lift(value,{root,key}) { root[key] = value; }}}});
console.log(str);
const parsed = JSON.parse(str,functionalize);
console.log(parsed);
console.log(select(parsed,{isFunctionalized:true}).from({age:21,name:"joe",address:{city:"Seattle",zip:"98101"}}))
