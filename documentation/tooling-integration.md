# Tooling integration

This is information dedicated to people who want to use the `elm-review` CLI in a different
environment than a user's terminal, like editors or GitHub actions.

## Things I expect you to do

If it is possible for your tool to run at the same time as an anrelated `elm-review` CLI run (e.g. an editor), then I'd like you to spawn the CLI using the `--namespace <unique-name-for-your-tool>`.

<!-- TODO Swap he order of CLI version and namespace? -->
The CLI creates a bunch of cache inside `elm-stuff/generated-code/jfmengels/elm-review/<CLI version>/<namespace>/` with `cli` as the default namespace, including
- `file-cache/`: Caching of the file's ASTs.
- `review-applications/`: Caching of the project's configuration. This is the application we build by compiling the source code in the CLI's `template/` directory.
- `dependencies-cache/`: Caching of the dependencies of the project's configuration computed by `elm-json`. `elm-json` is a bit slow, and doesn't work great offline. This is done so we don't have to compute the dependencies again if the configuration changed but not `review/elm.json`.

Namespacing things means that data will be duplicated, but also means that each tool won't step on each other's toes by saving the same files at the same time as another, potentially corrupting the file.

## Format of the JSON

If you desire to get the output of the CLI as JSON, you can run with `--report=json`. The output will look like the following sections describe.

### Review errors

```json
{
  "type": "review-errors",
  "errors": [
    {
      "path": "src/Review/Exceptions.elm",
      "errors": [
        {
          "message": "Top-level variable `fjoziejf` is not used",
          "ruleName": "NoUnused.Variables",
          "details": [
            "You should either use this value somewhere, or remove it at the location I pointed at."
          ],
          "region": {
            "start": {
              "line": 19,
              "column": 1
            },
            "end": {
              "line": 19,
              "column": 9
            }
          },
          "fix": [
            {
              "range": {
                "start": {
                  "line": 19,
                  "column": 1
                },
                "end": {
                  "line": 20,
                  "column": 1
                }
              },
              "str": ""
            }
          ],
          "formatted": [
            {
              "str": "(fix) ",
              "color": [
                51,
                187,
                200
              ]
            },
            {
              "str": "NoUnused.Variables",
              "color": [
                255,
                0,
                0
              ]
            },
            ": Top-level variable `fjoziejf` is not used\n\n19| fjoziejf=1\n    ",
            {
              "str": "^^^^^^^^",
              "color": [
                255,
                0,
                0
              ]
            },
            "\n20| type Exceptions\n\n\nYou should either use this value somewhere, or remove it at the location I pointed at."
          ]
        }
      ]
    }
  ]
}
```

- `type`: Equal to `"review-errors"` when the run went well (finding errors or not)
- `errors`: The list of errors that `elm-review` found. If it is empty, then no errors were found (in a normal run, `elm-review` would then exit with status code 0).

TODO describe errors

### CLI errors

Everything doesn't always go as planned, and sometimes we run into problems we anticipated and others that we didn't.
In that case, we (should) still report errors as JSON, with the following format:

```json
{
  "type": "error",
  "title": "COULD NOT FIND ELM.JSON",
  "path": "elm.json",
  "message": "I was expecting to find an elm.json file in the current directory or one of its parents, but I did not find one.\n\nIf you wish to run elm-review from outside your project,\ntry re-running it with --elmjson <path-to-elm.json>.",
  "stack": "Error: I was expecting to find an elm.json file in the current directory or one of its parents, but I did not find one.\n\nIf you wish to run elm-review from outside your project,\ntry re-running it with --elmjson <path-to-elm.json>.\n    at Object.projectToReview (/home/jeroen/dev/node-elm-review/lib/options.js:46:13)\n    at Object.build (/home/jeroen/dev/node-elm-review/lib/build.js:42:35)\n    at runElmReview (/home/jeroen/dev/node-elm-review/lib/main.js:62:41)\n    at module.exports (/home/jeroen/dev/node-elm-review/lib/main.js:105:3)\n    at Object.<anonymous> (/home/jeroen/dev/node-elm-review/bin/elm-review:3:23)\n    at Module._compile (internal/modules/cjs/loader.js:1144:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1164:10)\n    at Module.load (internal/modules/cjs/loader.js:993:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:892:14)\n    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:71:12)"
}
```

- `type`: Equal to `"error"` when things are unexpected
- `path`: The relative path to a file we could trace the problem to, or to a default one. This is in a lot of cases using a default value, because we are not able to pinpoint to a specific file. Also the default file might not exist, which may be the cause of the error.
- `message`: The helpful description of the problem. This is meant for humans to read, but colors have been removed and it has been trimmed. You may wish to remove the line-breaks maybe? In the future, it may become an array like the `formatted` message for review errors.
- `stack`: The original JavaScript runtime stacktrace. Only sent if you run with `--debug`.

## Things that may help you

Running with `--debug` will:
- Add the stack trace when you run into an (un)expected error while running the CLI
- Pretty print the JSON output, and add the stack trace to it.


TODO LOCAL_ELM_REVIEW

TODO Link this in the README
