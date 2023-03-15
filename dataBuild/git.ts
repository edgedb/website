import {execAsync} from "./utils";

export async function checkWorkingDirClean(repoPath: string) {
  if (
    await execAsync("git", ["status", "--porcelain"], {
      cwd: repoPath,
    })
  ) {
    throw new Error(`Working dir of '${repoPath}' is not clean,
  cannot checkout doc version branches`);
  }
}

export async function checkoutBranch(repoPath: string, branch: string) {
  try {
    await execAsync("git", ["checkout", branch], {
      cwd: repoPath,
    });
  } catch (err) {
    throw new Error(
      `Failed to checkout branch ${branch} on ${repoPath}: ${err}`
    );
  }
}
