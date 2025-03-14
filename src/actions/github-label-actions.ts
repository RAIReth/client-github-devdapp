import { Action, IAgentRuntime } from "@elizaos/core";
import { GitHubClient } from "../client";
import { validateGithubConfig } from "../environment";
import { elizaLogger } from "@elizaos/core";

// Helper function to get GitHub client from runtime
const getGitHubClient = async (runtime: IAgentRuntime): Promise<GitHubClient> => {
    const client = runtime.getClient("github") as GitHubClient;
    if (!client) {
        throw new Error("GitHub client not available");
    }
    return client;
};

// Validate GitHub configuration
const validateGitHubAction = async (runtime: IAgentRuntime) => {
    return validateGithubConfig(runtime);
};

export const createGitHubLabel: Action = {
    name: "GITHUB_CREATE_LABEL",
    similes: ["CREATE_GITHUB_LABEL", "ADD_GITHUB_LABEL"],
    description: "Creates a new label in the GitHub repository",
    
    validate: async (runtime: IAgentRuntime) => {
        return validateGitHubAction(runtime);
    },
    
    handler: async (runtime: IAgentRuntime, state: any, callback: any) => {
        try {
            const { name, color, description } = state;
            
            if (!name || !color) {
                await callback("I need both a label name and color to create a GitHub label.");
                return false;
            }
            
            const client = await getGitHubClient(runtime);
            const result = await client.createLabel(name, color, description);
            
            await callback(`Successfully created GitHub label "${name}" with color #${color}${description ? ` and description "${description}"` : ''}.`);
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to create GitHub label: ${error.message}`);
            await callback(`I couldn't create the GitHub label: ${error.message}`);
            return false;
        }
    }
};

export const labelGitHubIssue: Action = {
    name: "GITHUB_LABEL_ISSUE",
    similes: ["ADD_LABEL_TO_ISSUE", "TAG_GITHUB_ISSUE"],
    description: "Adds labels to a GitHub issue",
    
    validate: async (runtime: IAgentRuntime) => {
        return validateGitHubAction(runtime);
    },
    
    handler: async (runtime: IAgentRuntime, state: any, callback: any) => {
        try {
            const { issueNumber, labels } = state;
            
            if (!issueNumber || !labels || !Array.isArray(labels) || labels.length === 0) {
                await callback("I need both an issue number and at least one label to add to the GitHub issue.");
                return false;
            }
            
            const client = await getGitHubClient(runtime);
            await client.labelIssue(issueNumber, labels);
            
            const labelList = labels.map(l => `"${l}"`).join(", ");
            await callback(`Successfully added ${labels.length > 1 ? 'labels' : 'label'} ${labelList} to GitHub issue #${issueNumber}.`);
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to label GitHub issue: ${error.message}`);
            await callback(`I couldn't add labels to the GitHub issue: ${error.message}`);
            return false;
        }
    }
};

export const setGitHubIssueLabels: Action = {
    name: "GITHUB_SET_ISSUE_LABELS",
    similes: ["REPLACE_ISSUE_LABELS", "UPDATE_ISSUE_LABELS"],
    description: "Sets (replaces) all labels on a GitHub issue",
    
    validate: async (runtime: IAgentRuntime) => {
        return validateGitHubAction(runtime);
    },
    
    handler: async (runtime: IAgentRuntime, state: any, callback: any) => {
        try {
            const { issueNumber, labels } = state;
            
            if (!issueNumber || !labels || !Array.isArray(labels)) {
                await callback("I need both an issue number and a list of labels to set on the GitHub issue.");
                return false;
            }
            
            const client = await getGitHubClient(runtime);
            await client.setIssueLabels(issueNumber, labels);
            
            if (labels.length === 0) {
                await callback(`Successfully removed all labels from GitHub issue #${issueNumber}.`);
            } else {
                const labelList = labels.map(l => `"${l}"`).join(", ");
                await callback(`Successfully set ${labels.length > 1 ? 'labels' : 'label'} ${labelList} on GitHub issue #${issueNumber}.`);
            }
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to set GitHub issue labels: ${error.message}`);
            await callback(`I couldn't set labels on the GitHub issue: ${error.message}`);
            return false;
        }
    }
};

export const removeGitHubIssueLabel: Action = {
    name: "GITHUB_REMOVE_ISSUE_LABEL",
    similes: ["DELETE_ISSUE_LABEL", "REMOVE_LABEL_FROM_ISSUE"],
    description: "Removes a label from a GitHub issue",
    
    validate: async (runtime: IAgentRuntime) => {
        return validateGitHubAction(runtime);
    },
    
    handler: async (runtime: IAgentRuntime, state: any, callback: any) => {
        try {
            const { issueNumber, label } = state;
            
            if (!issueNumber) {
                await callback("I need an issue number to remove labels from a GitHub issue.");
                return false;
            }
            
            const client = await getGitHubClient(runtime);
            
            if (!label) {
                // Remove all labels
                await client.removeIssueLabel(issueNumber);
                await callback(`Successfully removed all labels from GitHub issue #${issueNumber}.`);
            } else {
                // Remove specific label
                await client.removeIssueLabel(issueNumber, label);
                await callback(`Successfully removed label "${label}" from GitHub issue #${issueNumber}.`);
            }
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to remove GitHub issue label: ${error.message}`);
            await callback(`I couldn't remove the label from the GitHub issue: ${error.message}`);
            return false;
        }
    }
};

export const getGitHubRepoLabels: Action = {
    name: "GITHUB_GET_REPO_LABELS",
    similes: ["LIST_GITHUB_LABELS", "FETCH_REPO_LABELS"],
    description: "Gets all labels for a GitHub repository",
    
    validate: async (runtime: IAgentRuntime) => {
        return validateGitHubAction(runtime);
    },
    
    handler: async (runtime: IAgentRuntime, state: any, callback: any) => {
        try {
            const client = await getGitHubClient(runtime);
            const labels = await client.getRepoLabels();
            
            if (labels.length === 0) {
                await callback("The GitHub repository doesn't have any labels yet.");
            } else {
                const labelList = labels.map(l => `"${l.name}" (${l.color}${l.description ? `: ${l.description}` : ''})`).join("\n- ");
                await callback(`Here are the labels in the GitHub repository:\n- ${labelList}`);
            }
            return true;
        } catch (error) {
            elizaLogger.error(`Failed to get GitHub repository labels: ${error.message}`);
            await callback(`I couldn't retrieve the labels from the GitHub repository: ${error.message}`);
            return false;
        }
    }
}; 