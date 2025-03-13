import { Octokit } from "@octokit/rest";
import { glob } from "glob";
import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createHash } from "crypto";
import {
    elizaLogger,
    AgentRuntime,
    knowledge,
    stringToUuid,
} from "@elizaos/core";
import { validateGithubConfig } from "./environment";

interface GitHubConfig {
    owner: string;
    repo: string;
    branch?: string;
    path?: string;
    token: string;
}

export class GitHubClient {
    private octokit: Octokit;
    private git: SimpleGit;
    private config: GitHubConfig;
    private runtime: AgentRuntime;
    private repoPath: string;

    constructor(runtime: AgentRuntime) {
        this.runtime = runtime;
        this.config = {
            owner: runtime.getSetting("GITHUB_OWNER") as string,
            repo: runtime.getSetting("GITHUB_REPO") as string,
            branch: runtime.getSetting("GITHUB_BRANCH") as string,
            path: runtime.getSetting("GITHUB_PATH") as string,
            token: runtime.getSetting("GITHUB_API_TOKEN") as string,
        };
        this.octokit = new Octokit({ auth: this.config.token });
        this.git = simpleGit();
        this.repoPath = path.join(
            process.cwd(),
            ".repos",
            this.config.owner,
            this.config.repo
        );
    }

    async initialize() {
        // Create repos directory if it doesn't exist
        await fs.mkdir(path.join(process.cwd(), ".repos", this.config.owner), {
            recursive: true,
        });

        // Clone or pull repository
        if (!existsSync(this.repoPath)) {
            await this.cloneRepository();
        } else {
            const git = simpleGit(this.repoPath);
            await git.pull();
        }

        // Checkout specified branch if provided
        if (this.config.branch) {
            const git = simpleGit(this.repoPath);
            await git.checkout(this.config.branch);
        }
    }

    private async cloneRepository() {
        const repositoryUrl = `https://github.com/${this.config.owner}/${this.config.repo}.git`;
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                await this.git.clone(repositoryUrl, this.repoPath);
                elizaLogger.log(
                    `Successfully cloned repository from ${repositoryUrl}`
                );
                return;
            } catch {
                elizaLogger.error(
                    `Failed to clone repository from ${repositoryUrl}. Retrying...`
                );
                retries++;
                if (retries === maxRetries) {
                    throw new Error(
                        `Unable to clone repository from ${repositoryUrl} after ${maxRetries} retries.`
                    );
                }
            }
        }
    }

    async createMemoriesFromFiles() {
        console.log("Create memories");
        const searchPath = this.config.path
            ? path.join(this.repoPath, this.config.path, "**/*")
            : path.join(this.repoPath, "**/*");

        const files = await glob(searchPath, { nodir: true });

        for (const file of files) {
            const relativePath = path.relative(this.repoPath, file);
            const content = await fs.readFile(file, "utf-8");
            const contentHash = createHash("sha256")
                .update(content)
                .digest("hex");
            const knowledgeId = stringToUuid(
                `github-${this.config.owner}-${this.config.repo}-${relativePath}`
            );

            const existingDocument =
                await this.runtime.documentsManager.getMemoryById(knowledgeId);

            if (
                existingDocument &&
                existingDocument.content["hash"] == contentHash
            ) {
                continue;
            }

            console.log(
                "Processing knowledge for ",
                this.runtime.character.name,
                " - ",
                relativePath
            );

            await knowledge.set(this.runtime, {
                id: knowledgeId,
                content: {
                    text: content,
                    hash: contentHash,
                    source: "github",
                    attachments: [],
                    metadata: {
                        path: relativePath,
                        repo: this.config.repo,
                        owner: this.config.owner,
                    },
                },
            });
        }
    }

    async createPullRequest(
        title: string,
        branch: string,
        files: Array<{ path: string; content: string }>,
        description?: string
    ) {
        // Create new branch
        const git = simpleGit(this.repoPath);
        await git.checkout(["-b", branch]);

        // Write files
        for (const file of files) {
            const filePath = path.join(this.repoPath, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        // Commit and push changes
        await git.add(".");
        await git.commit(title);
        await git.push("origin", branch);

        // Create PR
        const pr = await this.octokit.pulls.create({
            owner: this.config.owner,
            repo: this.config.repo,
            title,
            body: description || title,
            head: branch,
            base: this.config.branch || "main",
        });

        return pr.data;
    }

    async createCommit(
        message: string,
        files: Array<{ path: string; content: string }>
    ) {
        const git = simpleGit(this.repoPath);

        // Write files
        for (const file of files) {
            const filePath = path.join(this.repoPath, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        // Commit and push changes
        await git.add(".");
        await git.commit(message);
        await git.push();
    }

    async stop() {
        elizaLogger.warn("GitHub client does not support stopping yet");
    }

    /**
     * Labels an issue in the GitHub repository
     * @param issueNumber - The number of the issue to label
     * @param labels - Array of label names to apply to the issue
     * @returns Promise resolving to the updated issue data
     */
    async labelIssue(issueNumber: number, labels: string[]): Promise<any> {
        try {
            if (!this.octokit) {
                throw new Error('GitHub client not initialized');
            }

            if (!issueNumber || !Array.isArray(labels)) {
                throw new Error('Invalid parameters: issueNumber must be a number and labels must be an array');
            }

            // Validate the issue exists
            await this.octokit.issues.get({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber
            });

            // Add labels to the issue
            const response = await this.octokit.issues.addLabels({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                labels: labels
            });

            return response.data;
        } catch (error) {
            elizaLogger.error(`Failed to label issue #${issueNumber}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Removes a label from an issue in the GitHub repository
     * @param issueNumber - The number of the issue
     * @param label - Label name to remove (or omit to remove all labels)
     * @returns Promise resolving to the updated issue data
     */
    async removeIssueLabel(issueNumber: number, label?: string): Promise<any> {
        try {
            if (!this.octokit) {
                throw new Error('GitHub client not initialized');
            }

            if (!issueNumber) {
                throw new Error('Invalid parameter: issueNumber must be a number');
            }

            if (label) {
                // Remove specific label
                const response = await this.octokit.issues.removeLabel({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    issue_number: issueNumber,
                    name: label
                });
                return response.data;
            } else {
                // Remove all labels
                const response = await this.octokit.issues.removeAllLabels({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    issue_number: issueNumber
                });
                return response.data;
            }
        } catch (error) {
            elizaLogger.error(`Failed to remove label(s) from issue #${issueNumber}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sets labels for an issue (replacing any existing labels)
     * @param issueNumber - The number of the issue
     * @param labels - Array of label names to set on the issue
     * @returns Promise resolving to the updated issue data
     */
    async setIssueLabels(issueNumber: number, labels: string[]): Promise<any> {
        try {
            if (!this.octokit) {
                throw new Error('GitHub client not initialized');
            }

            if (!issueNumber || !Array.isArray(labels)) {
                throw new Error('Invalid parameters: issueNumber must be a number and labels must be an array');
            }

            // Set labels (replaces existing labels)
            const response = await this.octokit.issues.setLabels({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                labels: labels
            });

            return response.data;
        } catch (error) {
            elizaLogger.error(`Failed to set labels for issue #${issueNumber}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gets all labels for a repository
     * @returns Promise resolving to an array of labels
     */
    async getRepoLabels(): Promise<any[]> {
        try {
            if (!this.octokit) {
                throw new Error('GitHub client not initialized');
            }

            const response = await this.octokit.issues.listLabelsForRepo({
                owner: this.config.owner,
                repo: this.config.repo
            });

            return response.data;
        } catch (error) {
            elizaLogger.error(`Failed to get repository labels: ${error.message}`);
            throw error;
        }
    }

    /**
     * Creates a new label in the repository
     * @param name - Name of the label
     * @param color - Color of the label (hex code without #)
     * @param description - Optional description of the label
     * @returns Promise resolving to the created label data
     */
    async createLabel(name: string, color: string, description?: string): Promise<any> {
        try {
            if (!this.octokit) {
                throw new Error('GitHub client not initialized');
            }

            if (!name || !color) {
                throw new Error('Invalid parameters: name and color are required');
            }

            // Create a new label
            const response = await this.octokit.issues.createLabel({
                owner: this.config.owner,
                repo: this.config.repo,
                name: name,
                color: color.replace(/^#/, ''), // Remove # if present
                description: description || ''
            });

            return response.data;
        } catch (error) {
            elizaLogger.error(`Failed to create label "${name}": ${error.message}`);
            throw error;
        }
    }
}