const a11y = require('./a11y');
const jquery = require('jquery');
const Reporter = require('./reporter');

function run ({ reporterName, exit, console, remoteConsole, pages }) {
  const ask = function () {
    return Promise.resolve()
  };
  const reporter = Reporter.createReporter({ name: reporterName, console, remoteConsole });
  reporter.runStarted();

  function checkNextPage () {
    const { goToPage, page } = pages.shift();
    console.log(goToPage());

    const elementScope = jquery(window.document).contents();

    function find (selector) {
      return elementScope.find(selector)
    }

    return new Promise(function (resolve, reject) {

      function resolveWithPageResult (pageResult) {
        const valid = !pageResult.results.find(function (r) { return r.errors.length > 0 });
        reporter.pageChecked(page, pageResult);
        const exitCode = valid ? 0 : 1;
        resolve(exitCode)
      }

      try {
        a11y.test(page, find, ask)
          .then(function (r) {
            resolveWithPageResult(r)
          })
          .catch(function (e) {
            reporter.unexpectedError(e);
            reject(e)
          })
      } catch (e) {
        reporter.unexpectedError(e);
        reject(e)
      }
    })
    .then(function (code) {
      if (pages.length > 0) {
        return checkNextPage()
      }
      return code
    })
    .catch(function (e) {
      reporter.unexpectedError(e);
      return 666
    })
  }

  return checkNextPage().then(function (code) {
    reporter.runEnded();
    return code
  }).then(exit)
}

module.exports = {
  run
};
