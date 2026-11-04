const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Ordem explícita de execução dos testes. Arquivos não listados
    // rodam depois, em ordem alfabética.
    const order = [
      "auth.test.js",
      "users.test.js",
      "fleets.test.js",
      "vehicles.test.js"
    ];

    return [...tests].sort((a, b) => {
      const ia = order.findIndex(o => a.path.endsWith(o));
      const ib = order.findIndex(o => b.path.endsWith(o));

      if (ia === -1 && ib === -1) return a.path.localeCompare(b.path);
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });
  }
}

module.exports = CustomSequencer;
