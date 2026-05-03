export function evaluateMathExpression(expression: string): number {
  let index = 0;
  const input = expression.replace(/\s+/g, '');

  if (!input || /[^0-9+\-*/().]/.test(input)) {
    throw new Error('Invalid characters');
  }

  const peek = () => input[index];
  const consume = (char: string) => {
    if (peek() === char) {
      index++;
      return true;
    }
    return false;
  };

  const parseNumber = (): number => {
    const start = index;
    while (/[0-9.]/.test(peek() || '')) index++;
    if (start === index) throw new Error('Expected number');
    const raw = input.slice(start, index);
    if ((raw.match(/\./g) || []).length > 1) throw new Error('Invalid number');
    return Number(raw);
  };

  const parseFactor = (): number => {
    if (consume('+')) return parseFactor();
    if (consume('-')) return -parseFactor();
    if (consume('(')) {
      const value = parseExpression();
      if (!consume(')')) throw new Error('Expected closing parenthesis');
      return value;
    }
    return parseNumber();
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (true) {
      if (consume('*')) {
        value *= parseFactor();
      } else if (consume('/')) {
        const divisor = parseFactor();
        if (divisor === 0) throw new Error('Division by zero');
        value /= divisor;
      } else {
        return value;
      }
    }
  };

  function parseExpression(): number {
    let value = parseTerm();
    while (true) {
      if (consume('+')) {
        value += parseTerm();
      } else if (consume('-')) {
        value -= parseTerm();
      } else {
        return value;
      }
    }
  }

  const result = parseExpression();
  if (index !== input.length || !Number.isFinite(result)) {
    throw new Error('Invalid expression');
  }
  return result;
}
