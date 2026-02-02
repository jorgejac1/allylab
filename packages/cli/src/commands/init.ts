import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { createSampleConfig } from '../utils/config.js';

const CI_TEMPLATES = {
  'github-actions': {
    filename: '.github/workflows/accessibility.yml',
    content: `# AllyLab Accessibility Check
# Runs accessibility scans on pull requests and push to main

name: Accessibility Check

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  accessibility:
    name: Accessibility Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: npm start &
        env:
          CI: true

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Install AllyLab CLI
        run: npm install -g @allylab/cli

      - name: Run accessibility scan
        run: allylab scan http://localhost:3000 --format sarif -o results.sarif --fail-on serious

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
`,
  },
  'gitlab-ci': {
    filename: '.gitlab-ci.yml',
    content: `# AllyLab Accessibility Check
# Add this to your existing .gitlab-ci.yml or use as standalone

accessibility:
  stage: test
  image: node:20

  before_script:
    - npm ci
    - npm install -g @allylab/cli

  script:
    - npm start &
    - npx wait-on http://localhost:3000 --timeout 60000
    - allylab scan http://localhost:3000 --format json -o accessibility-report.json --fail-on serious

  artifacts:
    when: always
    paths:
      - accessibility-report.json
    reports:
      codequality: accessibility-report.json

  rules:
    - if: $CI_MERGE_REQUEST_ID
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
`,
  },
  'jenkins': {
    filename: 'Jenkinsfile.accessibility',
    content: `// AllyLab Accessibility Check Pipeline
// Add this to your existing Jenkinsfile or use as standalone

pipeline {
    agent any

    tools {
        nodejs 'NodeJS 20'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npm install -g @allylab/cli'
            }
        }

        stage('Start Application') {
            steps {
                sh 'npm start &'
                sh 'npx wait-on http://localhost:3000 --timeout 60000'
            }
        }

        stage('Accessibility Scan') {
            steps {
                sh 'allylab scan http://localhost:3000 --format json -o accessibility-report.json --fail-on serious'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'accessibility-report.json', allowEmptyArchive: true
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'accessibility-report.json',
                reportName: 'Accessibility Report'
            ])
        }
    }
}
`,
  },
  'azure-pipelines': {
    filename: 'azure-pipelines-accessibility.yml',
    content: `# AllyLab Accessibility Check
# Add this to your Azure Pipelines configuration

trigger:
  branches:
    include:
      - main
      - master

pr:
  branches:
    include:
      - main
      - master

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install dependencies'

  - script: npm install -g @allylab/cli
    displayName: 'Install AllyLab CLI'

  - script: |
      npm start &
      npx wait-on http://localhost:3000 --timeout 60000
    displayName: 'Start application'

  - script: allylab scan http://localhost:3000 --format json -o $(Build.ArtifactStagingDirectory)/accessibility-report.json --fail-on serious
    displayName: 'Run accessibility scan'

  - task: PublishBuildArtifacts@1
    condition: always()
    inputs:
      pathToPublish: '$(Build.ArtifactStagingDirectory)/accessibility-report.json'
      artifactName: 'AccessibilityReport'
    displayName: 'Publish accessibility report'
`,
  },
  'circleci': {
    filename: '.circleci/config.yml',
    content: `# AllyLab Accessibility Check
# Add this to your existing .circleci/config.yml or use as standalone

version: 2.1

jobs:
  accessibility:
    docker:
      - image: cimg/node:20.0

    steps:
      - checkout

      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}

      - run:
          name: Install dependencies
          command: npm ci

      - save_cache:
          key: v1-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules

      - run:
          name: Install AllyLab CLI
          command: npm install -g @allylab/cli

      - run:
          name: Start application
          command: npm start
          background: true

      - run:
          name: Wait for server
          command: npx wait-on http://localhost:3000 --timeout 60000

      - run:
          name: Run accessibility scan
          command: allylab scan http://localhost:3000 --format json -o accessibility-report.json --fail-on serious

      - store_artifacts:
          path: accessibility-report.json
          destination: accessibility-report

workflows:
  accessibility-check:
    jobs:
      - accessibility:
          filters:
            branches:
              only:
                - main
                - master
`,
  },
  config: {
    filename: '.allylabrc.json',
    content: '', // Will use createSampleConfig()
  },
};

export const initCommand = new Command('init')
  .description('Generate configuration files for CI/CD integration')
  .argument('[template]', 'Template to generate: github-actions, gitlab-ci, jenkins, azure-pipelines, circleci, config')
  .option('-f, --force', 'Overwrite existing files')
  .option('-l, --list', 'List available templates')
  .action(async (template: string | undefined, options: { force?: boolean; list?: boolean }) => {
    console.log();
    console.log(chalk.bold.blue('🔧 AllyLab - Configuration Generator'));
    console.log();

    if (options.list || !template) {
      console.log('Available templates:');
      console.log();
      console.log(`  ${chalk.cyan('github-actions')}    GitHub Actions workflow with SARIF upload`);
      console.log(`  ${chalk.cyan('gitlab-ci')}         GitLab CI/CD pipeline configuration`);
      console.log(`  ${chalk.cyan('jenkins')}           Jenkins pipeline configuration`);
      console.log(`  ${chalk.cyan('azure-pipelines')}   Azure Pipelines configuration`);
      console.log(`  ${chalk.cyan('circleci')}          CircleCI configuration`);
      console.log(`  ${chalk.cyan('config')}            AllyLab configuration file (.allylabrc.json)`);
      console.log();
      console.log(`Usage: ${chalk.yellow('allylab init <template>')}`);
      console.log();
      return;
    }

    const templateConfig = CI_TEMPLATES[template as keyof typeof CI_TEMPLATES];

    if (!templateConfig) {
      console.error(chalk.red(`Unknown template: ${template}`));
      console.log();
      console.log('Available templates:', Object.keys(CI_TEMPLATES).join(', '));
      process.exit(1);
      return;
    }

    const filepath = resolve(process.cwd(), templateConfig.filename);

    // Check if file exists
    if (existsSync(filepath) && !options.force) {
      console.error(chalk.red(`File already exists: ${templateConfig.filename}`));
      console.log(chalk.dim('Use --force to overwrite'));
      process.exit(1);
      return;
    }

    // Create directory if needed
    const dir = dirname(filepath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Get content
    const content = template === 'config'
      ? createSampleConfig()
      : templateConfig.content;

    // Write file
    writeFileSync(filepath, content, 'utf-8');

    console.log(chalk.green(`✓ Created ${templateConfig.filename}`));
    console.log();

    // Show next steps
    if (template === 'config') {
      console.log('Next steps:');
      console.log(`  1. Edit ${chalk.cyan('.allylabrc.json')} with your settings`);
      console.log(`  2. Run ${chalk.cyan('allylab scan <url>')} to use the config`);
    } else if (template === 'github-actions') {
      console.log('Next steps:');
      console.log(`  1. Edit ${chalk.cyan(templateConfig.filename)} with your application URL`);
      console.log(`  2. Commit and push to enable the workflow`);
      console.log(`  3. View results in the Security tab > Code scanning alerts`);
    } else {
      console.log('Next steps:');
      console.log(`  1. Edit ${chalk.cyan(templateConfig.filename)} with your application URL`);
      console.log('  2. Commit and push to enable the pipeline');
    }

    console.log();
  });
