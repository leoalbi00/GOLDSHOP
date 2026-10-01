import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Archivio JSON su file, per installazione su server proprio (es. PC del negozio o VPS).
 * Non adatto a hosting serverless con filesystem effimero: lì sostituire con un database.
 */
const locks = new Map<string, Promise<unknown>>();

async function read<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}

async function write(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

/** `relPath` è relativo alla cartella data/ del progetto. */
export function jsonFile<T>(relPath: string, fallback: T) {
  const file = path.join(process.cwd(), "data", relPath);
  return {
    read: () => read(file, fallback),
    /** Lettura-modifica-scrittura serializzata per file, così due richieste non si sovrascrivono. */
    update<R>(fn: (data: T) => { data: T; result: R }): Promise<R> {
      const run = (locks.get(file) ?? Promise.resolve()).then(async () => {
        const { data, result } = fn(await read(file, fallback));
        await write(file, data);
        return result;
      });
      locks.set(file, run.catch(() => undefined));
      return run;
    },
  };
}
