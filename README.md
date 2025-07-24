*[original Juice Shop readme](./JUICESHOP_README.md)*

# Snyk Juice Shop

This is a vulnerable by design repository for demonstrating Snyk in the IDE. Do not deploy this application in production.

### A note on consistency

The example prompts below may result in different outputs if you're using a different model. Even the same model may return greatly different responses from time to time.

If you experience different results than the workshop leader, try using a more specific prompt. For example, you may prompt `Scan for vulnerabilities using Snyk` and the agent may run a Snyk Code scan instead of Snyk Open Source scan like you were expecting. On the follow up prompt try prompting `Scan for vulnerabilities in my open source dependencies using Snyk Open Source` instead.

## Setup - Prep the Environemnt

```
# Clone this repo
git clone https://github.com/dylansnyk-org/juice-shop-workshop

# Install the Snyk CLI
npm install -g snyk
```
- AI-IDE like Cursor, or VS Code in Agent Mode 
  - In VS Code, search "Chat: Open Chat (Agent)"
- Snyk [IDE Extension](https://docs.snyk.io/cli-ide-and-ci-cd-integrations/snyk-ide-plugins-and-extensions) installed

To test your setup, try the following prompt:

```
Using Snyk's MCP Server, scan the code for Open Source vulnerabilities.
```

## Level 1 - Accelerate understanding

Start with asking for more information around a particular recommended fix.

```
Assess the breakability of upgrading the multer dependency to fix it's critical severity vulnerability.
```

Assuming the response is positive, let's try fixing it.
```
Yes, proceed with the upgrade.
```

We can also use AI to help better understand SAST findings from Snyk. Let's start by running a SAST scan and asking for an explanation for one of the vulnerabilities.

```
Scan the code for SAST vulnerabilities.
```

```
Choose one of the SQL Injection vulnerabilities in the login.ts file and explain it to me.
```

## Level 2

Level 1 is also about interfacing with Snyk through natural language. In level 2, we want to seemlessly integrate into agentic workflows.

To automatically trigger Snyk scans, create a file `.github/instructions/snyk.instructions.md` with the following contents:

```
---
applyTo: "**"
---
After generating any code, always scan for new SAST vulnerabilities using Snyk's MCP server.
```

Now try fixing that SQL Injection.
```
Fix this SQL Injection issue.
```

Notice how Snyk Code is automatically invoked to verify that the fix is secure.

Let's see Snyk Code automatically scan for vulnerabilities in brand new code.
```
Now, add an API endpoint to check the user's role.
```

## Level 3

Now that we've added Snyk to our agentic workflow, let's use additional context to better prioritize and align to our internal security policies. 

```
Run the scan with Snyk and list the vulnerbalities that need fixing for this Tier 3 application.
```

