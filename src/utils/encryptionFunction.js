export function encrypt(obj) {
    const jsonString = JSON.stringify(obj)
    let asciiArray = [];
    for (let i = 0; i < jsonString.length; i++) {
        asciiArray.unshift(jsonString.charCodeAt(i));
    }
    
    const encryptedString = asciiArray.reduce((accumulator, element) => {
        return accumulator+element+'f'
    }, '')
    return encryptedString
}

export function decrypt(str) {
    try {
        const decryptStr = str.split("f").reverse()
        decryptStr.shift()
        let stringDecrypt = ''
        decryptStr.forEach(e=>stringDecrypt +=String.fromCharCode(e))
        return JSON.parse(stringDecrypt)
    } catch (error) {
        throw new Error('Decryption error')
    }
}
