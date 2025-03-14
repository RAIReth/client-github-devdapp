# Client-GitHub for Eliza Framework

## Overview

The `client-github` module is a component of the Eliza framework designed to interact with GitHub repositories. It provides functionalities to clone repositories, manage branches, create pull requests, and maintain file-based knowledge for Eliza agents.

This client leverages GitHub's REST API via the `@octokit/rest` library and includes robust error handling and configuration validation.

## Features

- **Repository Management**: Clone, pull, and switch branches
- **File Processing**: Generate agent memories from repository files
- **Pull Request Management**: Create and manage pull requests programmatically
- **Commit Operations**: Stage, commit, and push files with ease
- **Knowledge Base Integration**: Convert repository content into agent memories
- **Branch Management**: Flexible branch switching and creation
- **Issue Label Management**: Create, apply, and manage GitHub issue labels

## Installation

Install the package as part of the Eliza framework:
bash
pnpm add @elizaos/client-github

## Configuration

The GitHub client requires the following environment variables:

| Variable           | Description                        | Required |
|-------------------|------------------------------------|----------|
| `GITHUB_OWNER`    | Owner of the GitHub repository     | Yes      |
| `GITHUB_REPO`     | Repository name                    | Yes      |
| `GITHUB_BRANCH`   | Target branch (default: `main`)    | Yes      |
| `GITHUB_PATH`     | Path to focus on within the repo   | Yes      |
| `GITHUB_API_TOKEN`| GitHub API token for authentication| Yes      |

## Usage

### Initialization
typescript:packages/client-github/README.md
import { GitHubClientInterface } from "@elizaos/client-github";
// Initialize the client
const client = await GitHubClientInterface.start(runtime);

### Creating Memories

```typescript
// Convert repository files to agent memories
await client.createMemoriesFromFiles();

// Convert repository files to agent memories
await client.createMemoriesFromFiles();
```

### Creating Pull Requests

```typescript
await client.createPullRequest(
    "Feature: Add new functionality",
    "feature/new-feature",
    [
        {
            path: "src/feature.ts",
            content: "// New feature implementation"
        }
    ],
    "Implements new functionality with tests"
);

await client.createPullRequest(
"Feature: Add new functionality",
"feature/new-feature",
[
{
path: "src/feature.ts",
content: "// New feature implementation"
}
],
"Implements new functionality with tests"
);
```

### Direct Commits

```typescript
await client.createCommit(
    "Update configuration",
    [
        {
            path: "config.json",
            content: JSON.stringify(config, null, 2)
        }
    ]
);
```

## GitHub Label Management

This client now supports comprehensive GitHub issue label management, allowing you to:

- Create new labels in a repository
- Get all labels for a repository
- Add labels to issues
- Remove specific labels from issues
- Remove all labels from issues
- Set labels for issues (replacing existing labels)

### Example Usage

```typescript
// Initialize the GitHub client
const runtime = new AgentRuntime();
const githubClient = new GitHubClient(runtime);
await githubClient.initialize();

// Create a new label
const newLabel = await githubClient.createLabel(
    "enhancement",
    "a2eeef",
    "New feature or request"
);

// Get all repository labels
const labels = await githubClient.getRepoLabels();

// Label an issue
await githubClient.labelIssue(123, ["enhancement", "bug"]);

// Set labels for an issue (replacing existing labels)
await githubClient.setIssueLabels(123, ["documentation"]);

// Remove a specific label from an issue
await githubClient.removeIssueLabel(123, "documentation");

// Remove all labels from an issue
await githubClient.removeIssueLabel(123);
```

For a complete example, see [src/examples/label-example.ts](src/examples/label-example.ts).

## GitHub Label Actions

This client now includes a set of actions that can be used with Eliza agents to manage GitHub labels:

| Action Name | Description |
|-------------|-------------|
| `GITHUB_CREATE_LABEL` | Creates a new label in the GitHub repository |
| `GITHUB_LABEL_ISSUE` | Adds labels to a GitHub issue |
| `GITHUB_SET_ISSUE_LABELS` | Sets (replaces) all labels on a GitHub issue |
| `GITHUB_REMOVE_ISSUE_LABEL` | Removes a label from a GitHub issue |
| `GITHUB_GET_REPO_LABELS` | Gets all labels for a GitHub repository |

### Example Usage in Character Agent

```json
{
  "user": "RAIRDevAssistant",
  "content": {
    "text": "I'll create a 'bug' label for your repository right away.",
    "action": "GITHUB_CREATE_LABEL",
    "state": {
      "name": "bug",
      "color": "d73a4a",
      "description": "Something isn't working as expected"
    }
  }
}
```

```json
{
  "user": "RAIRDevAssistant",
  "content": {
    "text": "I'll add the 'enhancement' label to issue #42 for you.",
    "action": "GITHUB_LABEL_ISSUE",
    "state": {
      "issueNumber": 42,
      "labels": ["enhancement"]
    }
  }
}
```

## API Reference

### GitHubClientInterface

- `start(runtime: IAgentRuntime)`: Initialize the client
- `stop(runtime: IAgentRuntime)`: Clean up resources

### GitHubClient

- `initialize()`: Set up repository and configuration
- `createMemoriesFromFiles()`: Generate agent memories
- `createPullRequest(title: string, branch: string, files: Array<{path: string, content: string}>, description?: string)`: Create PR
- `createCommit(message: string, files: Array<{path: string, content: string}>)`: Direct commit
- `labelIssue(issueNumber: number, labels: string[])`: Add labels to an issue
- `removeIssueLabel(issueNumber: number, label?: string)`: Remove a label from an issue
- `setIssueLabels(issueNumber: number, labels: string[])`: Set labels for an issue
- `getRepoLabels()`: Get all labels for a repository
- `createLabel(name: string, color: string, description?: string)`: Create a new label

## Scripts

```bash
# Build the project
pnpm run build

# Development with watch mode
pnpm run dev

# Lint the codebase
pnpm run lint
```

## Dependencies

- `@elizaos/core`: ^0.1.7-alpha.2
- `@octokit/rest`: ^20.1.1
- `@octokit/types`: ^12.6.0
- `glob`: ^10.4.5
- `simple-git`: ^3.27.0

## Development Dependencies

- `@types/glob`: ^8.1.0
- `tsup`: ^8.3.5

## Contribution

Contributions are welcome! Please ensure all code adheres to the framework's standards and passes linting checks.

## License

This project is licensed under the MIT License. See the LICENSE file for details.