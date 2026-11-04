import { createInterface } from "node:readline/promises";

export class Cancelled extends Error {
  constructor() {
    super("Cancelled.");
  }
}

export const interactive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

/** A readline session; Ctrl+C / Ctrl+D at a prompt throw `Cancelled`. */
export function session() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (query) =>
    rl.question(query).catch(() => {
      throw new Cancelled();
    });
  return {
    async text(label, fallback) {
      const answer = (await ask(`${label} (${fallback}): `)).trim();
      return answer || fallback;
    },
    /** `choices` are `{ id, label }`; answer with the number or the id, Enter takes the first. */
    async select(label, choices) {
      console.log(`\n${label}:`);
      choices.forEach((c, i) => console.log(`  ${i + 1}) ${c.id.padEnd(8)} ${c.label}`));
      const answer = (await ask(`Choose 1-${choices.length} (1): `)).trim();
      const picked = answer
        ? (choices[Number(answer) - 1] ?? choices.find((c) => c.id === answer))
        : choices[0];
      if (!picked) throw new Error(`unknown choice "${answer}"`);
      return picked.id;
    },
    async confirm(label, fallback = true) {
      const answer = (await ask(`${label} (${fallback ? "Y/n" : "y/N"}): `)).trim().toLowerCase();
      return answer ? answer.startsWith("y") : fallback;
    },
    close: () => rl.close(),
  };
}
