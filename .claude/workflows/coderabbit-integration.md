# CodeRabbit + Claude Code Integration Workflow

## When I (Claude Code) make changes:

1. **Before committing**: Run these commands to ensure code quality
   ```bash
   npm run lint
   npm run build
   npm run test
   ```

2. **When creating PRs**: CodeRabbit will automatically review and provide feedback

3. **Responding to CodeRabbit feedback**:
   - Address any security or performance issues immediately
   - Consider suggestions for code improvements
   - Use CodeRabbit's suggestions to improve future code generation

## CodeRabbit Configuration:
- Located in `.coderabbit.yaml`
- Configured for TypeScript/Next.js best practices
- Focuses on security, performance, and code quality

## Integration Points:
- CodeRabbit reviews all PR changes automatically
- Claude Code follows the quality standards defined in CodeRabbit config
- Both tools work together to maintain high code quality

## Quality Gates:
1. ESLint passes (`npm run lint`)
2. TypeScript compiles (`npm run build`)
3. Tests pass (`npm run test`)
4. CodeRabbit review is positive