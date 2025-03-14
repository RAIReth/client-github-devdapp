import { AgentRuntime } from "@elizaos/core";
import { GitHubClient } from "../client";

/**
 * Example demonstrating GitHub label management functionality
 */
async function runLabelExample() {
    try {
        // Initialize runtime with required settings
        const runtime = new AgentRuntime();
        runtime.setSetting("GITHUB_OWNER", "your-github-username");
        runtime.setSetting("GITHUB_REPO", "your-repository-name");
        runtime.setSetting("GITHUB_API_TOKEN", "your-github-token");
        
        console.log("Initializing GitHub client...");
        const githubClient = new GitHubClient(runtime);
        await githubClient.initialize();
        
        // Create new labels
        console.log("\nCreating new labels...");
        const bugLabel = await githubClient.createLabel(
            "bug", 
            "d73a4a", 
            "Something isn't working as expected"
        );
        console.log(`Created label: ${bugLabel.name} with color #${bugLabel.color}`);
        
        const enhancementLabel = await githubClient.createLabel(
            "enhancement", 
            "a2eeef", 
            "New feature or request"
        );
        console.log(`Created label: ${enhancementLabel.name} with color #${enhancementLabel.color}`);
        
        const documentationLabel = await githubClient.createLabel(
            "documentation", 
            "0075ca", 
            "Improvements or additions to documentation"
        );
        console.log(`Created label: ${documentationLabel.name} with color #${documentationLabel.color}`);
        
        // Get all repository labels
        console.log("\nFetching all repository labels...");
        const labels = await githubClient.getRepoLabels();
        console.log(`Found ${labels.length} labels in the repository:`);
        labels.forEach(label => {
            console.log(`- ${label.name} (${label.color})${label.description ? `: ${label.description}` : ''}`);
        });
        
        // Label an issue (replace with a valid issue number in your repository)
        const issueNumber = 1; // Example issue number
        console.log(`\nAdding labels to issue #${issueNumber}...`);
        await githubClient.labelIssue(issueNumber, ["bug", "documentation"]);
        console.log(`Added 'bug' and 'documentation' labels to issue #${issueNumber}`);
        
        // Set labels for an issue (replacing existing labels)
        console.log(`\nSetting labels for issue #${issueNumber}...`);
        await githubClient.setIssueLabels(issueNumber, ["enhancement"]);
        console.log(`Set 'enhancement' label on issue #${issueNumber} (replacing previous labels)`);
        
        // Remove a specific label from an issue
        console.log(`\nRemoving 'enhancement' label from issue #${issueNumber}...`);
        await githubClient.removeIssueLabel(issueNumber, "enhancement");
        console.log(`Removed 'enhancement' label from issue #${issueNumber}`);
        
        // Add multiple labels to an issue
        console.log(`\nAdding multiple labels to issue #${issueNumber}...`);
        await githubClient.labelIssue(issueNumber, ["bug", "documentation", "enhancement"]);
        console.log(`Added multiple labels to issue #${issueNumber}`);
        
        // Remove all labels from an issue
        console.log(`\nRemoving all labels from issue #${issueNumber}...`);
        await githubClient.removeIssueLabel(issueNumber);
        console.log(`Removed all labels from issue #${issueNumber}`);
        
        console.log("\nLabel management example completed successfully!");
    } catch (error) {
        console.error("Error in label example:", error.message);
    }
}

// Run the example if this file is executed directly
// Using CommonJS check for Node.js environment
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
    runLabelExample().catch(error => {
        console.error("Unhandled error:", error);
        // @ts-ignore
        process.exit(1);
    });
}

export { runLabelExample }; 