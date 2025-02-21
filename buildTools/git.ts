import { execAsync } from "./utils";

export async function gitStatus(repoPath: string) {
  const output = await execAsync(
    "git",
    ["status", "--porcelain=v2", "--branch"],
    {
      cwd: repoPath,
    }
  );

  let workingDirChanges = false;
  let commitHash: string | null = null;
  for (const line of output.trim().split("\n")) {
    const parts = line.split(" ");
    if (parts[0] === "#") {
      if (parts[1] === "branch.oid") {
        commitHash = parts[2];
      }
    } else {
      workingDirChanges = true;
    }
  }

  if (!commitHash) {
    throw new Error(`Could not get commit hash for repo: ${repoPath}`);
  }

  return { workingDirChanges, commitHash };
}

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
