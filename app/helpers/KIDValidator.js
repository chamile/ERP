
function isKIDValid(kid) {
    return luhn_validate(kid);
}

function luhn_checksum(code) {
    var len = code.length
    var parity = len % 2
    var sum = 0
    for (var i = len - 1; i >= 0; i--) {
        var d = parseInt(code.charAt(i))
        if (i % 2 == parity) { d *= 2 }
        if (d > 9) { d -= 9 }
        sum += d
    }
    return sum % 10
}


function luhn_validate(fullcode) {
    return luhn_checksum(fullcode) == 0
}

export default {
    isKIDValid
};
