import { octokitWithToken } from './github';

export interface GitFile {
  path: string;
  content: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
}

export interface CommitResult {
  commitSha: string;
  treeSha: string;
  branch: string;
  files: string[];
}

/**
 * Push multiple files to a GitHub repository in a single commit
 * This is a more robust version that handles file updates and deletions
 */
export async function gitPush(
  userToken: string,
  repo: { owner: string; name: string },
  branch: string,
  files: GitFile[] | Record<string, string>,
  message: string,
): Promise<CommitResult> {
  const octo = octokitWithToken(userToken);
  
  // Normalize files to GitFile array
  const normalizedFiles: GitFile[] = Array.isArray(files)
    ? files
    : Object.entries(files).map(([path, content]) => ({
        path,
        content,
        mode: '100644' as const,
      }));

  try {
    // 1. Get the latest commit SHA for the branch
    const { data: ref } = await octo.git.getRef({
      ...repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = ref.object.sha;

    // 2. Get the tree SHA of the latest commit
    const { data: latestCommit } = await octo.git.getCommit({
      ...repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = latestCommit.tree.sha;

    // 3. Create blobs for all files
    const treeItems = await Promise.all(
      normalizedFiles.map(async (file) => {
        if (!file.content && file.content !== '') {
          // File deletion - return null to filter out later
          return {
            path: file.path,
            sha: null,
            mode: file.mode || '100644',
            type: 'blob' as const,
          };
        }

        // Create blob for file content
        const { data: blob } = await octo.git.createBlob({
          ...repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });

        return {
          path: file.path,
          sha: blob.sha,
          mode: file.mode || '100644',
          type: 'blob' as const,
        };
      }),
    );

    // 4. Create a new tree with the files
    const { data: newTree } = await octo.git.createTree({
      ...repo,
      base_tree: baseTreeSha,
      tree: treeItems.filter((item) => item.sha !== null) as any,
    });

    // 5. Create a new commit
    const { data: newCommit } = await octo.git.createCommit({
      ...repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // 6. Update the branch reference to point to the new commit
    await octo.git.updateRef({
      ...repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
      force: false,
    });

    return {
      commitSha: newCommit.sha,
      treeSha: newTree.sha,
      branch,
      files: normalizedFiles.map((f) => f.path),
    };
  } catch (error: any) {
    console.error('Git push error:', error);
    throw new Error(`Failed to push to GitHub: ${error.message}`);
  }
}

/**
 * Create a new branch and push files to it
 */
export async function createBranchAndPush(
  userToken: string,
  repo: { owner: string; name: string },
  branchName: string,
  files: GitFile[] | Record<string, string>,
  message: string,
  baseBranch: string = 'main',
): Promise<CommitResult> {
  const octo = octokitWithToken(userToken);

  try {
    // Get the SHA of the base branch
    const { data: baseRef } = await octo.git.getRef({
      ...repo,
      ref: `heads/${baseBranch}`,
    });

    // Try to create the new branch
    try {
      await octo.git.createRef({
        ...repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });
    } catch (error: any) {
      if (error.status === 422) {
        // Branch already exists, that's okay
        console.log(`Branch ${branchName} already exists`);
      } else {
        throw error;
      }
    }

    // Push files to the new branch
    return await gitPush(userToken, repo, branchName, files, message);
  } catch (error: any) {
    console.error('Create branch and push error:', error);
    throw new Error(`Failed to create branch and push: ${error.message}`);
  }
}

/**
 * Get the content of a file from a repository
 */
export async function getFileContent(
  userToken: string,
  repo: { owner: string; name: string },
  path: string,
  ref?: string,
): Promise<string | null> {
  const octo = octokitWithToken(userToken);

  try {
    const { data } = await octo.repos.getContent({
      ...repo,
      path,
      ref,
    });

    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all files in a directory
 */
export async function getDirectoryContents(
  userToken: string,
  repo: { owner: string; name: string },
  path: string = '',
  ref?: string,
): Promise<Array<{ path: string; type: 'file' | 'dir' }>> {
  const octo = octokitWithToken(userToken);

  try {
    const { data } = await octo.repos.getContent({
      ...repo,
      path,
      ref,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        path: item.path,
        type: item.type as 'file' | 'dir',
      }));
    }

    return [];
  } catch (error: any) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}