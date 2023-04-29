const operators = {
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
    }
}

export {operators as default,operators}