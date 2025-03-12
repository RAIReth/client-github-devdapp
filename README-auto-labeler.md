# GitHub Auto Labeler

The GitHub Auto Labeler is a powerful utility that automatically applies labels to GitHub issues based on their content. It uses pattern matching to analyze issue titles and descriptions, then applies appropriate labels according to configurable rules.

## Features

- **Content-based labeling**: Automatically label issues based on their title and body content
- **Customizable rules**: Define your own patterns and corresponding labels
- **Flexible configuration**: Control which issues to process and how to handle existing labels
- **Label management**: Optionally create missing labels automatically
- **Detailed reporting**: Get comprehensive results of the labeling operation

## Installation

The Auto Labeler is included in the `@elizaos-plugins/client-github` package:

```bash
npm install @elizaos-plugins/client-github
# or
pnpm add @elizaos-plugins/client-github
```

## Usage

### Basic Usage

```typescript
import { GitHubClient, GitHubAutoLabeler, CommonLabelingRules } from '@elizaos-plugins/client-github';

// Initialize the GitHub client
const client = new GitHubClient(runtime);
await client.initialize();

// Create an auto-labeler instance
const autoLabeler = new GitHubAutoLabeler(client);

// Add common labeling rules
autoLabeler.addRules([
  CommonLabelingRules.bug,
  CommonLabelingRules.enhancement,
  CommonLabelingRules.documentation
]);

// Run the auto-labeler
const result = await autoLabeler.run();
console.log(`Labeled ${result.labeledIssues} out of ${result.totalIssues} issues`);
```

### Custom Configuration

```typescript
// Create an auto-labeler with custom configuration
const autoLabeler = new GitHubAutoLabeler(client, {
  createMissingLabels: true,      // Create labels that don't exist
  defaultLabelColor: '0075ca',    // Default color for created labels
  relabelExistingIssues: false,   // Skip issues that already have labels
  issueState: 'all'               // Process both open and closed issues
});
```

### Custom Rules

```typescript
// Add a custom rule
autoLabeler.addRule({
  pattern: /\b(ui|ux|interface|design|layout|css|style)\b/i,
  labels: ['ui/ux'],
  description: 'Issues related to user interface or user experience'
});

// Add multiple custom rules
const projectRules = [
  {
    pattern: /\b(api|endpoint|rest|graphql|http)\b/i,
    labels: ['api'],
    description: 'Issues related to API endpoints'
  },
  {
    pattern: /\b(database|db|sql|query|schema|model)\b/i,
    labels: ['database'],
    description: 'Issues related to database operations'
  }
];

autoLabeler.addRules(projectRules);
```

## Common Labeling Rules

The package includes several predefined rules for common issue types:

- `bug`: Issues that report bugs or problems
- `enhancement`: Issues that request features or enhancements
- `documentation`: Issues related to documentation
- `question`: Issues asking questions or requesting help
- `security`: Issues related to security concerns
- `performance`: Issues related to performance

## API Reference

### `GitHubAutoLabeler`

#### Constructor

```typescript
constructor(client: GitHubClient, config?: Partial<AutoLabelConfig>)
```

- `client`: An initialized GitHubClient instance
- `config`: Optional configuration options

#### Configuration Options

```typescript
interface AutoLabelConfig {
  createMissingLabels?: boolean;    // Whether to create missing labels automatically
  defaultLabelColor?: string;       // Default color for auto-created labels (hex code)
  relabelExistingIssues?: boolean;  // Whether to apply labels to already labeled issues
  issueState?: 'open' | 'closed' | 'all';  // Issue states to process
}
```

#### Methods

- `addRule(rule: LabelingRule): GitHubAutoLabeler` - Adds a single labeling rule
- `addRules(rules: LabelingRule[]): GitHubAutoLabeler` - Adds multiple labeling rules
- `setConfig(config: Partial<AutoLabelConfig>): GitHubAutoLabeler` - Updates configuration options
- `run(): Promise<AutoLabelResult>` - Runs the auto-labeling process

#### Labeling Rule

```typescript
interface LabelingRule {
  pattern: RegExp;       // Regular expression pattern to match against issue title and body
  labels: string[];      // Labels to apply when pattern matches
  description?: string;  // Optional description of the rule
}
```

#### Result

```typescript
interface AutoLabelResult {
  totalIssues: number;    // Total number of issues processed
  labeledIssues: number;  // Number of issues that were labeled
  labelsCreated: number;  // Number of labels created (if createMissingLabels is true)
  details: Array<{        // Details of the labeling operations
    issueNumber: number;
    title: string;
    appliedLabels: string[];
  }>;
}
```

## Examples

See the [examples](./examples) directory for complete usage examples. 