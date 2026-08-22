const originalLogFunction = console.log

function log(...args) {
    const date = new Date();
    const hour = date.toLocaleTimeString('pt-BR');
    const dateString = date.toLocaleDateString('pt-BR');
    return originalLogFunction(`[${dateString} ${hour}]`.gray, ...args)
}

console.log = log
