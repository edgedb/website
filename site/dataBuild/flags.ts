const args = process.argv.slice(2);

const flags: {
  watch?: boolean;
  clean?: boolean;
  skip?: Set<string>;
  only?: Set<string>;
  embeddings?: boolean;
} = {};

for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  switch (flag) {
    case "--watch":
      flags.watch = true;
      break;
    case "--clean":
      flags.clean = true;
      break;
    case "--skip":
      const skipNames = args[i + 1];
      flags.skip = new Set(skipNames.split(","));
      i++;
      break;
    case "--only":
      const onlyNames = args[i + 1];
      flags.only = new Set(onlyNames.split(","));
      i++;
      break;
    default:
      throw new Error(`Unknown flag: ${flag}`);
  }
}

export default flags;
