import { AgentRuntime } from "@elizaos/core";
import { GitHubClient } from "../client";

/**
 * Example demonstrating how to use the GitHub labeling functionality
 */
async function runLabelExample() {
    try {
        // Initialize the GitHub client
        const runtime = new AgentRuntime();
        const githubClient = new GitHubClient(runtime);
        await githubClient.initialize();

        console.log("GitHub client initialized successfully");

        // Example 1: Get all repository labels
        console.log("Fetching repository labels...");
        const labels = await githubClient.getRepoLabels();
        console.log(`Found ${labels.length} labels in the repository:`);
        labels.forEach(label => {
            console.log(`- ${label.name} (#${label.color}): ${label.description}`);
        });

        // Example 2: Create a new label
        console.log("\nCreating a new label...");
        const newLabel = await githubClient.createLabel(
            "enhancement",
            "a2eeef",
            "New feature or request"
        );
        console.log(`Created label: ${newLabel.name} (#${newLabel.color})`);

        // Example 3: Label an issue
        const issueNumber = 1; // Replace with an actual issue number
        console.log(`\nLabeling issue #${issueNumber}...`);
        const labeledIssue = await githubClient.labelIssue(issueNumber, ["enhancement", "bug"]);
        console.log(`Issue #${issueNumber} labeled successfully`);

        // Example 4: Set labels for an issue (replacing existing labels)
        console.log(`\nSetting labels for issue #${issueNumber}...`);
        const updatedIssue = await githubClient.setIssueLabels(issueNumber, ["documentation"]);
        console.log(`Issue #${issueNumber} labels updated successfully`);

        // Example 5: Remove a label from an issue
        console.log(`\nRemoving 'documentation' label from issue #${issueNumber}...`);
        await githubClient.removeIssueLabel(issueNumber, "documentation");
        console.log(`Label removed from issue #${issueNumber} successfully`);

        // Example 6: Remove all labels from an issue
        console.log(`\nRemoving all labels from issue #${issueNumber}...`);
        await githubClient.removeIssueLabel(issueNumber);
        console.log(`All labels removed from issue #${issueNumber} successfully`);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Run the example
runLabelExample().then(() => {
    console.log("Example completed");
}).catch(error => {
    console.error("Example failed:", error);
}); 