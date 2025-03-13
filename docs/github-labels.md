# GitHub Label Management

This document provides detailed information about the GitHub label management functionality in the `client-github` module.

## Overview

The GitHub label management functionality allows you to:

- Create new labels in a repository
- Get all labels for a repository
- Add labels to issues
- Remove specific labels from issues
- Remove all labels from issues
- Set labels for issues (replacing existing labels)

## API Reference

### `labelIssue(issueNumber: number, labels: string[]): Promise<any>`

Adds labels to an issue in the GitHub repository.

**Parameters:**
- `issueNumber`: The number of the issue to label
- `labels`: Array of label names to apply to the issue

**Returns:**
- Promise resolving to the updated issue data

**Example:**
```typescript
// Add 'bug' and 'enhancement' labels to issue #123
await githubClient.labelIssue(123, ['bug', 'enhancement']);
```

### `removeIssueLabel(issueNumber: number, label?: string): Promise<any>`

Removes a label from an issue in the GitHub repository. If no label is specified, removes all labels.

**Parameters:**
- `issueNumber`: The number of the issue
- `label` (optional): Label name to remove

**Returns:**
- Promise resolving to the updated issue data

**Example:**
```typescript
// Remove 'bug' label from issue #123
await githubClient.removeIssueLabel(123, 'bug');

// Remove all labels from issue #123
await githubClient.removeIssueLabel(123);
```

### `setIssueLabels(issueNumber: number, labels: string[]): Promise<any>`

Sets labels for an issue, replacing any existing labels.

**Parameters:**
- `issueNumber`: The number of the issue
- `labels`: Array of label names to set on the issue

**Returns:**
- Promise resolving to the updated issue data

**Example:**
```typescript
// Set 'documentation' and 'good first issue' labels on issue #123
// (replacing any existing labels)
await githubClient.setIssueLabels(123, ['documentation', 'good first issue']);
```

### `getRepoLabels(): Promise<any[]>`

Gets all labels for a repository.

**Returns:**
- Promise resolving to an array of labels

**Example:**
```typescript
// Get all labels in the repository
const labels = await githubClient.getRepoLabels();
console.log(`Found ${labels.length} labels`);
```

### `createLabel(name: string, color: string, description?: string): Promise<any>`

Creates a new label in the repository.

**Parameters:**
- `name`: Name of the label
- `color`: Color of the label (hex code with or without #)
- `description` (optional): Description of the label

**Returns:**
- Promise resolving to the created label data

**Example:**
```typescript
// Create a new label
await githubClient.createLabel(
  'feature',
  'a2eeef',
  'New feature or enhancement request'
);

// Color can include # prefix (it will be removed automatically)
await githubClient.createLabel('bug', '#ff0000', 'Bug report');
```

## Testing

### Unit Tests

The GitHub label management functionality is covered by unit tests in `__tests__/github-labels.test.ts`. Run the tests with:

```bash
npm test
```

### Integration Tests

Integration tests are available in `__tests__/github-labels-integration.test.ts`. These tests are skipped by default as they require actual GitHub credentials. To run them:

1. Set up the required environment variables:
   - `GITHUB_OWNER`: Owner of the GitHub repository
   - `GITHUB_REPO`: Repository name
   - `GITHUB_API_TOKEN`: GitHub API token
   - `TEST_ISSUE_NUMBER` (optional): Issue number to use for testing

2. Remove the `.skip` from the describe block in the test file

3. Run the tests:
   ```bash
   npm test
   ```

### Manual Testing

A manual test script is available in `scripts/test-github-labels.ts`. To run it:

1. Set up the required environment variables (same as for integration tests)

2. Run the script:
   ```bash
   npm run test:labels
   ```

## Error Handling

All label management methods include error handling and will throw appropriate errors if:

- The GitHub client is not initialized
- Invalid parameters are provided
- The issue does not exist
- The API request fails for any reason

Example error handling:

```typescript
try {
  await githubClient.labelIssue(123, ['bug']);
} catch (error) {
  console.error(`Failed to label issue: ${error.message}`);
}
``` 