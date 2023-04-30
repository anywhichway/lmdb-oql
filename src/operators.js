const operators = {


    $type(right, {test}) {
        return typeof(right)===test ? right : undefined
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
    $startsWith(right, {test}) {
        return right.startsWith && right.startsWith(test) ? right : undefined
    },
    $endsWith(right, {test}) {
        return right.endsWith && right.endsWith(test) ? right : undefined
    },
    $length(right, {test}) {
        return right.length==test ? right : undefined
    },

    $matches(right, {test}) {
        return right.match(test) ? right : undefined
    },


    $odd(right, {test}) {
        return right%2===1 ? right : undefined
    },
    $even(right, {test}) {
        return right%2===0 ? right : undefined
    },
    $add(right, {test}) {
        return right+test[0]===test[1] ? right : undefined
    },
    $subtract(right, {test}) {
        return right-test[0]===test[1] ? right : undefined
    },
    multiply(right, {test}) {
        return right*test[0]===test[1] ? right : undefined
    },
    divide(right, {test}) {
        return right/test[0]===test[1] ? right : undefined
    },
    $mod(right, {test}) {
        return right%test[0]===test[1] ? right : undefined
    }
}

export {operators as default,operators}