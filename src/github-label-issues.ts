// Add this function to the GitHubClient class in the client-github module

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
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });

    // Add labels to the issue
    const response = await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: labels
    });

    return response.data;
  } catch (error) {
    this.logger.error(`Failed to label issue #${issueNumber}: ${error.message}`);
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
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        name: label
      });
      return response.data;
    } else {
      // Remove all labels
      const response = await this.octokit.issues.removeAllLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });
      return response.data;
    }
  } catch (error) {
    this.logger.error(`Failed to remove label(s) from issue #${issueNumber}: ${error.message}`);
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
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: labels
    });

    return response.data;
  } catch (error) {
    this.logger.error(`Failed to set labels for issue #${issueNumber}: ${error.message}`);
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
      owner: this.owner,
      repo: this.repo
    });

    return response.data;
  } catch (error) {
    this.logger.error(`Failed to get repository labels: ${error.message}`);
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
      owner: this.owner,
      repo: this.repo,
      name: name,
      color: color.replace(/^#/, ''), // Remove # if present
      description: description || ''
    });

    return response.data;
  } catch (error) {
    this.logger.error(`Failed to create label "${name}": ${error.message}`);
    throw error;
  }
}
