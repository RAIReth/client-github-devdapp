import { Action } from "@elizaos/core";
import {
  createGitHubLabel,
  labelGitHubIssue,
  setGitHubIssueLabels,
  removeGitHubIssueLabel,
  getGitHubRepoLabels
} from "./github-label-actions";

// Export all GitHub label actions
export const githubLabelActions: Action[] = [
  createGitHubLabel,
  labelGitHubIssue,
  setGitHubIssueLabels,
  removeGitHubIssueLabel,
  getGitHubRepoLabels
];

// Export individual actions for direct use
export {
  createGitHubLabel,
  labelGitHubIssue,
  setGitHubIssueLabels,
  removeGitHubIssueLabel,
  getGitHubRepoLabels
}; 