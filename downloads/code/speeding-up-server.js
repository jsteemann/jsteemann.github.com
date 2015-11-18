var testRunner = function () {
  // declare some useful modules and functions
  var internal = require("internal"), 
      time = internal.time, 
      print = internal.print; 

  // calculate statistical values from series
  var calc = function (values, options) {
    var sum = function (values) {
      return values.reduce(function (previous, current) {
        return previous + current;
      });
    };
    values.sort();
    var n = values.length;
    var result = { 
      min: values[0], 
      max: values[n - 1],
      sum: sum(values),
      avg: sum(values) / n,
      har: sum(values.slice(options.strip, n - options.strip)) / (n - 2 * options.strip)
    };
    return result;
  }

  // execute callback function as many times as we have runs
  // call setup() and teardown() if defined
  // will return series of execution times (not including setup/teardown)
  var measure = function (test, options) {
    var timedExecution = function (test) { 
      var start = time();
      test.func(test.params); 
      return time() - start; 
    }; 

    var results = [ ], i;

    for (i = 0; i < options.runs; ++i) {
      typeof test.setup === "function" && test.setup();
      results.push(timedExecution(test));
      typeof test.teardown === "function" && test.teardown();
    }

    return results;
  }

  // run all the tests and print the test results
  var run = function (tests, options) {
    var pad = function (s, l, type) {
      if (s.length >= l) {
        return s.substr(0, l);
      }
      if (type === "right") {
        return s + Array(l - s.length).join(" ");
      }
      return Array(l - s.length).join(" ") + s;
    };

    var headLength = 15, 
        runsLength = 8, 
        cellLength = 12, 
        sep = " | ",
        lineLength = headLength + 2 * runsLength + 5 * cellLength + 5 * sep.length - 1;
    
    print(pad("test name", headLength, "right") + sep +  
          pad("runs", runsLength, "left") + sep +
          pad("total (s)", cellLength, "left") + sep +
          pad("min (s)", cellLength, "left") + sep +
          pad("max (s)", cellLength, "left") + sep +
          pad("avg (s)", cellLength, "left") + sep +
          pad("final (s)", cellLength, "left") + sep +
          pad("%", runsLength, "left"));
 
    print(Array(lineLength).join("-"));

    var i, baseline;
    for (i = 0; i < tests.length; ++i) {
      var test = tests[i];
      var stats = calc(measure(test, options), options); 

      if (i === 0) {
        stats.rat = 100;
        baseline = stats.har;
      }
      else {
        stats.rat = 100 * stats.har / baseline;
      }
  
      print(pad(test.name, headLength, "right") + sep +  
            pad(String(options.runs), runsLength, "left") + sep +
            pad(stats.sum.toFixed(options.digits), cellLength, "left") + sep +
            pad(stats.min.toFixed(options.digits), cellLength, "left") + sep +
            pad(stats.max.toFixed(options.digits), cellLength, "left") + sep + 
            pad(stats.avg.toFixed(options.digits), cellLength, "left") + sep + 
            pad(stats.har.toFixed(options.digits), cellLength, "left") + sep + 
            pad(stats.rat.toFixed(2), runsLength, "left")); 
    }
  };

  run(tests, options);
};


// setup for our test functions
var internal = require("internal"),
    db = require("org/arangodb").db;

// drop the collection, wait 1 sec and re-create it
var setup = function () {
  db._drop("test"); 
  internal.wait(1, true);
  db._create("test"); 
};

// drop the collection and wait 1 sec
var teardown = function () {
  db._drop("test");
  internal.wait(1, true);
};

// baseline function (assumed to be slowest)
var baseline = function (params) {
  var i, n = params.n;
  for (i = 0; i < n; ++i) { 
    db.test.save({ value: 1 });
  }
};

// collection accessor call moved out of the loop
var invariant = function (params) {
  var i, n = params.n;
  var c = db.test;
  for (i = 0; i < n; ++i) { 
    c.save({ value: 1 });
  }
};

// using "silent" option
var silence = function (params) {
  var i, n = params.n;
  for (i = 0; i < n; ++i) { 
    db.test.save({ value: 1 }, { silent: true });
  }
};

// using "transaction" option
var transaction = function (params) {
  db._executeTransaction({
    collections: {
      write: "test" 
    },
    action: function () {
      var i, n = params.n;
      for (i = 0; i < n; ++i) { 
        db.test.save({ value: 1 }, { silent: true });
      }
    }
  });
};

// combination of avoiding the accessor call and the "silent" option
var combined = function (params) {
  db._executeTransaction({
    collections: {
      write: "test" 
    },
    action: function () {
      var i, n = params.n;
      var c = db.test;
      for (i = 0; i < n; ++i) { 
        c.save({ value: 1 }, { silent: true });
      }
    }
  });
};

// test parameters
var options = { 
  runs: 10,   // number of runs for each test
  strip: 1,   // how many min/max extreme values to ignore
  digits: 4   // result display digits
};

// parameters for the test functions
var params = { 
  n: 100000   // number of documents to create
};

// the tests to run
var tests = [
  { name: "baseline",       setup: setup, teardown: teardown, params: params, func: baseline },
  { name: "loop-invariant", setup: setup, teardown: teardown, params: params, func: invariant },
  { name: "silence",        setup: setup, teardown: teardown, params: params, func: silence },
  { name: "transaction",    setup: setup, teardown: teardown, params: params, func: transaction },
  { name: "combined",       setup: setup, teardown: teardown, params: params, func: combined }
];

// run the tests and print results
testRunner(tests, options);
