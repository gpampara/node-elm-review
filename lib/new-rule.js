const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const prompts = require('prompts');

const packageNameRegex = /.+\/(elm-)?review-.+/;

async function create(options) {
  let canceled = false;

  const {ruleName} = await prompts(
    {
      type: 'text',
      name: 'ruleName',
      message: `The name of your first rule (must be a valid Elm module name):`
    },
    {
      onCancel: () => {
        canceled = true;
        return false;
      }
    }
  );

  // TODO Validate rule name
  if (!canceled) {
    await addRule(options, ruleName);
  }
}

function writeFile(dir, fileName, content) {
  fs.writeFileSync(path.join(dir, fileName), content);
}

async function addRule(options, ruleName) {
  const ruleNameFolder = ruleName.split('.').slice(0, -1).join('/');
  // TODO Error if options.elmJsonPath is null (suggest using new-package or init)
  // TODO Error if file could not be read
  const elmJson = fs.readJsonSync(options.elmJsonPath, 'utf8');
  const dir = path.dirname(options.elmJsonPath);

  try {
    fs.mkdirpSync(path.join(dir, 'src', ruleNameFolder));
  } catch (_) {}

  try {
    fs.mkdirpSync(path.join(dir, 'tests', ruleNameFolder));
  } catch (_) {}

  console.log(`Adding rule - ${ruleName}`);

  writeFile(
    dir,
    path.join('src', `${ruleName.split('.').join('/')}.elm`),
    newSourceFile(ruleName)
  );
  writeFile(
    dir,
    path.join('tests', `${ruleName.split('.').join('/')}Test.elm`),
    newTestFile(ruleName)
  );

  if (elmJson.type === 'package' && packageNameRegex.test(elmJson.name)) {
    console.log('Exposing the rule in elm.json');
    elmJson['exposed-modules'] = elmJson['exposed-modules']
      .concat(ruleName)
      .sort();

    writeFile(dir, 'elm.json', JSON.stringify(elmJson, null, 2));
  } else {
    console.log(`${chalk.yellow('[SKIPPED]')} Exposing the rule in elm.json`);
  }

  console.log('Adding rule to the README');
  // TODO Handle case where the README is not found
  // TODO Handle case where the README does not have a rules section
  const readmeContent = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
  injectRuleInReadme(dir, elmJson, ruleName, readmeContent);
}

const ruleSectionRegex = /#+.*rules.*/i;

function injectRuleInReadme(dir, elmJson, ruleName, content) {
  const lines = content.split('\n');

  const rulesSectionIndex = lines.findIndex((line) =>
    ruleSectionRegex.test(line)
  );

  if (rulesSectionIndex) {
    const description = ruleDescription(
      elmJson.name,
      elmJson.version,
      ruleName
    );
    lines.splice(rulesSectionIndex + 2, 0, description);
    // TODO Add the rule to the list of rules in the configuration
    writeFile(dir, 'README.md', lines.join('\n'));
  } else {
    console.log(
      `${chalk.red('[SKIPPED]')} Could not find a ${chalk.yellow(
        'Provided rules'
      )} section in README`
    );
  }
}

function newSourceFile(ruleName) {
  return `module ${ruleName} exposing (rule)

{-|

@docs rule

-}

import Review.Rule as Rule exposing (Rule)


{-| Reports... REPLACEME

    config =
        [ ${ruleName}.rule
        ]


## Fail

    a =
        "REPLACEME example to replace"


## Success

    a =
        "REPLACEME example to replace"


## When (not) to enable this rule

This rule is useful when REPLACEME.
THis rule is not useful when REPLACEME.

-}
rule : Rule
rule =
    Rule.newModuleRuleSchema "${ruleName}" ()
        -- Add your visitors
        |> Rule.fromModuleRuleSchema
`;
}

function newTestFile(ruleName) {
  return `module ${ruleName}Test exposing (all)

import ${ruleName} exposing (rule)
import Review.Test
import Test exposing (Test, describe, test)


all : Test
all =
    describe "${ruleName}"
        [ test "should report an error when REPLACEME" <|
            \\() ->
                """module A exposing (..)
a = 1
"""
                    |> Review.Test.run rule
                    |> Review.Test.expectErrors
                        [ Review.Test.error
                            { message = "REPLACEME"
                            , details = [ "REPLACEME" ]
                            , under = "REPLACEME"
                            }
                        ]
        ]
`;
}

function ruleDescription(packageName, packageVersion, ruleName) {
  const ruleNameAsUrl = ruleName.split('.').join('-');
  return `- [\`${ruleName}\`](https://package.elm-lang.org/packages/${packageName}/${packageVersion}/${ruleNameAsUrl}) - Reports REPLACEME.`;
}

module.exports = {
  create,
  newSourceFile,
  newTestFile,
  ruleDescription
};
