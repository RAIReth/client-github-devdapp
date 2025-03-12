import { GitHubClient } from './client';
import { elizaLogger } from '@elizaos/core';

/**
 * Interface for a labeling rule
 */
export interface LabelingRule {
  /** Regular expression pattern to match against issue title and body */
  pattern: RegExp;
  /** Labels to apply when pattern matches */
  labels: string[];
  /** Optional description of the rule */
  description?: string;
}

/**
 * Configuration options for the auto-labeler
 */
export interface AutoLabelConfig {
  /** Whether to create missing labels automatically */
  createMissingLabels?: boolean;
  /** Default color for auto-created labels (hex code) */
  defaultLabelColor?: string;
  /** Whether to apply labels to already labeled issues */
  relabelExistingIssues?: boolean;
  /** Issue states to process (open, closed, or all) */
  issueState?: 'open' | 'closed' | 'all';
}

/**
 * Default configuration for the auto-labeler
 */
const DEFAULT_CONFIG: AutoLabelConfig = {
  createMissingLabels: false,
  defaultLabelColor: '0075ca',
  relabelExistingIssues: true,
  issueState: 'open'
};

/**
 * Result of an auto-labeling operation
 */
export interface AutoLabelResult {
  /** Total number of issues processed */
  totalIssues: number;
  /** Number of issues that were labeled */
  labeledIssues: number;
  /** Number of labels created (if createMissingLabels is true) */
  labelsCreated: number;
  /** Details of the labeling operations */
  details: Array<{
    issueNumber: number;
    title: string;
    appliedLabels: string[];
  }>;
}

/**
 * GitHub Auto Labeler - Automatically applies labels to issues based on content
 */
export class GitHubAutoLabeler {
  private client: GitHubClient;
  private rules: LabelingRule[] = [];
  private config: AutoLabelConfig;

  /**
   * Creates a new instance of the GitHub Auto Labeler
   * @param client - The GitHub client instance
   * @param config - Configuration options
   */
  constructor(client: GitHubClient, config: Partial<AutoLabelConfig> = {}) {
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Adds a labeling rule
   * @param rule - The rule to add
   * @returns The auto-labeler instance for chaining
   */
  addRule(rule: LabelingRule): GitHubAutoLabeler {
    this.rules.push(rule);
    return this;
  }

  /**
   * Adds multiple labeling rules
   * @param rules - Array of rules to add
   * @returns The auto-labeler instance for chaining
   */
  addRules(rules: LabelingRule[]): GitHubAutoLabeler {
    this.rules.push(...rules);
    return this;
  }

  /**
   * Sets the configuration options
   * @param config - Configuration options
   * @returns The auto-labeler instance for chaining
   */
  setConfig(config: Partial<AutoLabelConfig>): GitHubAutoLabeler {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Runs the auto-labeling process
   * @returns Promise resolving to the result of the operation
   */
  async run(): Promise<AutoLabelResult> {
    if (this.rules.length === 0) {
      throw new Error('No labeling rules defined. Add rules before running the auto-labeler.');
    }

    const result: AutoLabelResult = {
      totalIssues: 0,
      labeledIssues: 0,
      labelsCreated: 0,
      details: []
    };

    try {
      // Get all issues
      const issues = await this.client.getRepoIssues(this.config.issueState);
      result.totalIssues = issues.length;
      
      // Get all available labels
      const availableLabels = await this.client.getRepoLabels();
      const availableLabelNames = new Set(availableLabels.map(label => label.name));
      
      // Process each issue
      for (const issue of issues) {
        // Skip issues that already have labels if relabelExistingIssues is false
        if (!this.config.relabelExistingIssues && issue.labels && issue.labels.length > 0) {
          continue;
        }
        
        const issueText = `${issue.title} ${issue.body || ''}`;
        const labelsToAdd: Set<string> = new Set();
        
        // Check each rule
        for (const rule of this.rules) {
          if (rule.pattern.test(issueText)) {
            // Add matched labels
            rule.labels.forEach(label => labelsToAdd.add(label));
          }
        }
        
        // Create any missing labels if configured to do so
        if (this.config.createMissingLabels) {
          for (const label of Array.from(labelsToAdd)) {
            if (!availableLabelNames.has(label)) {
              try {
                await this.client.createLabel(
                  label, 
                  this.config.defaultLabelColor || '0075ca',
                  `Auto-created label for ${label}`
                );
                availableLabelNames.add(label);
                result.labelsCreated++;
              } catch (error) {
                elizaLogger.error(`Failed to create label "${label}": ${error.message}`);
              }
            }
          }
        }
        
        // Filter out labels that don't exist in the repository
        const validLabels = Array.from(labelsToAdd).filter(label => availableLabelNames.has(label));
        
        // Apply labels if any matched
        if (validLabels.length > 0) {
          await this.client.labelIssue(issue.number, validLabels);
          result.labeledIssues++;
          
          result.details.push({
            issueNumber: issue.number,
            title: issue.title,
            appliedLabels: validLabels
          });
        }
      }
      
      return result;
    } catch (error) {
      elizaLogger.error(`Auto-labeling failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Common labeling rules that can be used with the auto-labeler
 */
export const CommonLabelingRules = {
  bug: {
    pattern: /\b(bug|fix|crash|problem|error|failure|issue)\b/i,
    labels: ['bug'],
    description: 'Issues that report bugs or problems'
  },
  enhancement: {
    pattern: /\b(feature|enhancement|improvement|add|improve|request)\b/i,
    labels: ['enhancement'],
    description: 'Issues that request features or enhancements'
  },
  documentation: {
    pattern: /\b(doc|documentation|readme|guide|tutorial)\b/i,
    labels: ['documentation'],
    description: 'Issues related to documentation'
  },
  question: {
    pattern: /\b(how|what|when|where|why|question|help|support)\b\?/i,
    labels: ['question'],
    description: 'Issues asking questions or requesting help'
  },
  security: {
    pattern: /\b(security|vulnerability|exploit|attack|auth|authentication|authorization)\b/i,
    labels: ['security'],
    description: 'Issues related to security concerns'
  },
  performance: {
    pattern: /\b(performance|slow|speed|optimize|optimization|efficient|efficiency)\b/i,
    labels: ['performance'],
    description: 'Issues related to performance'
  }
}; 