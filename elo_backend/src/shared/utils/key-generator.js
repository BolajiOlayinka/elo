/**
 * Generate a random key with specified length
 * @param {number} keyLength - Length of the key to generate
 * @returns {string} Random key containing uppercase letters and numbers
 */
function generateRandomKey(keyLength = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = [];
    
    for (let i = 0; i < keyLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result.push(characters.charAt(randomIndex));
    }
    
    return result.join('');
}

module.exports = {
    generateRandomKey
};
