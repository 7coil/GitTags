# GitTags
1. Make a GitHub repository and make a folder called `tags` within it
2. The names of the files are the name of the tags

## Tags are:
1. Processed via the Handlebars engine.
2. Parsed as JSON.
  - If not JSON, the output of handlebars is sent.
  - If it is JSON, the JSON is sent as part of `TextChannel.createMessage(payload)`

- Read about what can go in a JSON payload here: <https://abal.moe/Eris/docs/TextChannel#function-createMessage>
- View available handlebar functions: <https://github.com/helpers/handlebars-helpers#categories>

## Commands
**THE FETCH PREFIX IS `git>`, WHEREAS THE CONFIGURATION PREFIX IS `git<`.**  
No built-in commands can conflict with your tags.

### Set
_You need the "Manage Guild" role to set a repository_

- `git<set`
  - Use the default GitHub repository.
- `git<set [owner]`
  - Use the *[owner]/gittag* repository.
- `git<set [owner];[repo]`
  - Use the *[owner]/[repo]* repository.

Example: To use https://github.com/lepon01/gittag as your repository, run:
`git<set lepon01/gittag`

Tags will be taken from the `tags` folder here: https://github.com/lepon01/gittag/tree/master/tags

### Info
- `git<info`
  - Get information about where GitTags is currently pointing to

### Fetch a Tag
- `git>[tag]`
  - Obtain text with the tag name
