//soundex from https://gist.github.com/shawndumas/1262659
function soundex(a) {a=(a+"").toLowerCase().split("");var c=a.shift(),b="",d={a:"",e:"",i:"",o:"",u:"",b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6},b=c+a.map(function(a){return d[a]}).filter(function(a,b,e){return 0===b?a!==d[c]:a!==e[b-1]}).join("");return(b+"000").slice(0,4).toUpperCase()};

const validateLuhn = num => {
    let arr = (num + '')
        .split('')
        .reverse()
        .map(x => parseInt(x));
    let lastDigit = arr.splice(0, 1)[0];
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    sum += lastDigit;
    return sum % 10 === 0;
}

const operators = {

    //$and
    //$or
    //$not
    //$xor
    //$ior


    $type(right, {test}) {
        return typeof(right)===test ? right : undefined
    },
    $isOdd(value) {
        return value%2===1 ? value : undefined
    },
    $isEven(value) {
        return value%2===0 ? value : undefined
    },
    $isPositive(value) {
        return value>0 ? value : undefined
    },
    $isNegative(value) {
        return value<0 ? value : undefined
    },
    $isInteger(value) {
        return Number.isInteger(value) ? value : undefined
    },
    $isFloat(value) {
        const str = value+"",
            parts = str.split(".");
        return parts.length==2 ? value : undefined
    },
    $isNaN(value) {
        return Number.isNaN(value) ? value : undefined
    },
    $isTruthy(value) {
        return value ? value : undefined
    },
    $isFalsy(value) {
        return !value ? value : undefined
    },
    $isNull(value) {
        return value===null ? value : undefined
    },
    $isUndefined(value) {
        return value===undefined ? value : undefined
    },
    $isDefined(value) {
        return value!==undefined ? value : undefined
    },
    $isPrimitive(value) {
        return typeof(value)!=="object" ? value : undefined
    },
    $isArray(value) {
        return Array.isArray(value) ? value : undefined
    },
    $isCreditCard(value) {
        //  Visa || Mastercard || American Express || Diners Club || Discover || JCB
        return typeof(value)==="string" && (/(?:\d[ -]*?){13,16}/g).test(value) && validateLuhn(value) ? value : undefined;
    },
    $isEmail(value) {
        return typeof(value)==="string" && (!/(\.{2}|-{2}|_{2})/.test(value) && /^[a-z0-9][a-z0-9-_\.]+@[a-z0-9][a-z0-9-]+[a-z0-9]\.[a-z]{2,10}(?:\.[a-z]{2,10})?$/i).test(value) ? value : undefined;
    },
    $isURL(value) {
        return typeof(value)==="string" && (/^(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*$/is).test(value) ? value : undefined;
    },
    $isUUID(value) {
        return typeof(value)==="string" && (/^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/is).test(value) ? value : undefined;
    },
    $isIPAddress(value) {
        return typeof(value)==="string" && (/(([2]([0-4][0-9]|[5][0-5])|[0-1]?[0-9]?[0-9])[.]){3}(([2]([0-4][0-9]|[5][0-5])|[0-1]?[0-9]?[0-9]))/gi).test(value) ? value : undefined;
    },
    $isSSN(value) {
        return typeof(value)==="string" && (/^\d{3}-?\d{2}-?\d{4}$/is).test(value) ? value : undefined;
    },
    $isISBN(value) {
        return typeof(value)==="string" && (/^(?:ISBN(?:-1[03])?:?\s)?(?=[-0-9\s]{17}$|[-0-9X\s]{13}$|[0-9X]{10}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?(?:[0-9]+[-\s]?){2}[0-9X]$/).test(value) ? value : undefined;
    },
    $isZIPCode(value) {
        return  typeof(value)==="string" && (/[0-9]{5}(-[0-9]{4})?/g).test(value) ? value : undefined;
    },

    $lt(right, {test}) {
        return right<test ? right : undefined
    },
    $lte(right, {test}) {
        return right<=test ? right : undefined
    },
    $eq(right, {test}) {
        return right==test ? right : undefined
    },
    $eeq(right, {test}) {
        return right===test ? right : undefined
    },
    $neq(right, {test}) {
        return right!=test ? right : undefined
    },
    $gte(right, {test}) {
        return right>=test ? right : undefined
    },
    $gt(right, {test}) {
        return right>test ? right : undefined
    },

    $between(right, {test}) {
        return right>=test[0] && right<=test[1] ? right : undefined
    },
    $outside(right, {test}) {
        return right<test[0] || right>test[1] ? right : undefined
    },
    $in(right, {test}) {
        return test.includes(right) ? right : undefined
    },
    $nin(right, {test}) {
        return !test.includes(right) ? right : undefined
    },
    $includes(right, {test}) {
        return test.includes && test.includes(right) ? right : undefined
    },
    $excludes(right, {test}) {
        return !test.includes || !test.includes(right) ? right : undefined
    },

    $intersects(right, {test}) {
        return Array.isArray(right) && Array.isArray(test)  && right.some((item) => test.includes(item)) ? right : undefined
    },
    $disjoint(right, {test}) {
        return Array.isArray(right) && Array.isArray(test)  && !right.some((item) => test.includes(item)) ? right : undefined
    },
    $subset(right, {test}) {
        return Array.isArray(right) && Array.isArray(test)  && right.every((item) => test.includes(item)) ? right : undefined
    },
    $superset(right, {test}) {
        return Array.isArray(right) && Array.isArray(test)  && test.every((item) => right.includes(item)) ? right : undefined
    },
    $symmetric(right, {test}) {
        return Array.isArray(right) && Array.isArray(test) && right.length===test.length && right.every((item) => test.includes(item)) ? right : undefined
    },
    $startsWith(right, {test}) {
        test = typeof(test)==="number" ? test+"" : test;
        return right.startsWith && right.startsWith(test) ? right : undefined
    },
    $endsWith(right, {test}) {
        test = typeof(test)==="number" ? test+"" : test;
        return right.endsWith && right.endsWith(test) ? right : undefined
    },
    $length(right, {test}) {
        return right.length==test ? right : undefined
    },

    $matches(right, {test}) {
        const value = typeof(right)==="number" ? right+"" : right;
        return typeof(value)==="string" && value.match(test) ? right : undefined
    },
    $echoes(right, {test}) {
        right = typeof(right)==="number" ? right+"" : right;
        test = typeof(test)==="number" ? test+"" : test;
        return typeof(right)==="string" && typeof(test)==="string" && soundex(right)===soundex(test) ? right : undefined
    },


    $add(right, {test}) {
        return right+test[0]===test[1] ? right : undefined
    },
    $subtract(right, {test}) {
        return right-test[0]===test[1] ? right : undefined
    },
    $multiply(right, {test}) {
        return right*test[0]===test[1] ? right : undefined
    },
    $divide(right, {test}) {
        return right/test[0]===test[1] ? right : undefined
    },
    $mod(right, {test}) {
        return right%test[0]===test[1] ? right : undefined
    },
    $pow(right, {test}) {
        return right**test[0]===test[1] ? right : undefined
    },

/*
    $$if(right, {test}) {
        return right===test[0] ? test[1] : test[2]
    },
    $$case(right, {test}) {
        const dflt = test.length/2!==0 ? test.pop() : undefined,
            pair = () => test.length>0 ? [test.shift(), test.shift()] : undefined;
        let next;
        while(next=pair()) {
            if(next[0]===right) return next[1];
        }
    },
    $$concat(right, {test}) {
        return Array.isArray(test) && Array.isArray(right) ? right.concat(test) : right + test;
    },
    $$join(right, {test}) {
        right = Array.isArray(right) ? right : [right];
        return right.join(test)
    },
    $$slice(right, {test}) {
        return Array.isArray(test) && Array.isArray(right) ? right.slice(...test) : typeof(right)==="string" ? right.substring(...test) : undefined;
    },
    $$substring(right, {test}) {
        return typeof(right)==="string" ? right.substring(...test) : undefined;
    },
    $$replace(right, {test}) {
        return typeof(right)==="string" ? right.replace(...test) : undefined;
    },
    $$split(right, {test}) {

    },
    $$trim(right, {test}) {

    },
    $$padStart(right, {test}) {

    },
    $$add(right, {test}) {
        return typeof(right)==="number" ? right+test : undefined;
    },
    $$subtract(right, {test}) {
        return  typeof(right)==="number" ? right-test : undefined;
    },
    $$multiply(right, {test}) {
        return  typeof(right)==="number" ? right*test : undefined;
    },
    $$divide(right, {test}) {
        return  typeof(right)==="number" ? right/test : undefined;
    },
    $$mod(right, {test}) {
        return  typeof(right)==="number" ? right%test : undefined
    },
    $$pow(right, {test}) {
        return  typeof(right)==="number" ? right**test : undefined;
    },
    ...["abs", "ceil", "floor", "round", "sign", "sqrt", "trunc","cos","sin","tan","acos","asin","atan","atan2","exp","log","max","min","random"].reduce((acc,fn) => {
        acc["$$"+fn] = (right, {test}) => typeof(right)==="number" ? Math[fn](right) : undefined;
        return acc;
    },{})
*/
}

export {operators as default,operators}