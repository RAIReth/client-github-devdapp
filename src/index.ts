import { GitHubClientInterface, GitHubClient } from "./client";
import { GitHubAutoLabeler, CommonLabelingRules, type LabelingRule, type AutoLabelConfig, type AutoLabelResult } from "./github-auto-labeler";

const githubPlugin = {
    name: "github",
    description: "GitHub client",
    clients: [GitHubClientInterface],
};

export { 
    GitHubClient, 
    GitHubAutoLabeler, 
    CommonLabelingRules,
    // Types
    LabelingRule,
    AutoLabelConfig,
    AutoLabelResult
};
export default githubPlugin;
