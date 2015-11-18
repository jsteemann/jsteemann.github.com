"use strict";

var testRunner = function (tests, options) {
  var internal = require("internal"), 
      time = internal.time, 
      print = internal.print; 

  var calc = function (values /*, options */) {
    var sum = function (values) {
      return values.reduce(function (previous, current) {
        return previous + current;
      });
    };
    values = values.sort();
    var n = values.length;
    var result = { 
      min: values[0], 
      max: values[n - 1],
      sum: sum(values),
      avg: sum(values) / n
    };
    return result;
  };

  var buildParams = function (test, collection) {
    var params = test.params;
    params.collection = collection.name;
    return params;
  };

  var measure = function (test, collection, options) {
    var timedExecution = function (test, collection) { 
      var params = buildParams(test, collection);

      var start = time();
      test.params.func(params); 
      return time() - start; 
    }; 

    var results = [ ];

    for (var i = 0; i < options.runs; ++i) {
      var params = buildParams(test, collection);

      if (typeof options.setup === "function") { 
        options.setup(params);
      }

      var duration = timedExecution(test, collection);
      results.push(duration);

      if (typeof options.teardown === "function") {
        options.teardown(test.params);
      }
    }

    return results;
  };

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
    var out = [ ];

    var headLength = 30, 
        collectionLength = 12, 
        runsLength = 8, 
        cellLength = 12, 
        sep = " | ",
        lineLength = headLength + runsLength + 4 * cellLength + 5 * sep.length - 1;
    
    out.push(pad("test name", headLength, "right") + sep +  
             pad("collection", collectionLength, "right") + sep +
             pad("runs", runsLength, "left") + sep +
             pad("min (s)", cellLength, "left") + sep +
             pad("max (s)", cellLength, "left") + sep +
             pad("avg (s)", cellLength, "left"));
 
    out.push(Array(lineLength).join("-"));

    for (var i = 0; i < tests.length; ++i) {
      var test = tests[i];
      print("running test " + test.name);

      for (var j = 0; j < options.collections.length; ++j) {
        var collection = options.collections[j];
        var stats = calc(measure(test, collection, options), options); 

        out.push(pad(test.name, headLength, "right") + sep +  
                 pad(collection.label, collectionLength, "right") + sep + 
                 pad(String(options.runs), runsLength, "left") + sep +
                 pad(stats.min.toFixed(options.digits), cellLength, "left") + sep +
                 pad(stats.max.toFixed(options.digits), cellLength, "left") + sep + 
                 pad(stats.avg.toFixed(options.digits), cellLength, "left")); 
      }
    }

    return out;
  };

  return run(tests, options);
};


var internal = require("internal"),
    db = require("org/arangodb").db;

var initialize = function () {
  function create(n) {
    var name = "values" + n;
    if (db._collection(name) !== null) {
      return;
    }
    db._drop(name);
    internal.print("creating collection " + name);
    var c = db._create(name);
    var g = n / 100;

    for (var i = 0; i < n; ++i) {
      c.insert({ 
        _key: "test" + i, 
        value1: i, 
        value2: "test" + i, 
        value3: i, 
        value4: "test" + i, 
        value5: i, 
        value6: "test" + i,
        value7: i % g,
        value8: "test" + (i % g) 
      });
    }
  
    c.ensureIndex({ type: "hash", fields: [ "value1" ] });
    c.ensureIndex({ type: "hash", fields: [ "value2" ] });
    c.ensureIndex({ type: "skiplist", fields: [ "value3" ] });
    c.ensureIndex({ type: "skiplist", fields: [ "value4" ] });
  }

  create(10000);
  create(100000);
  create(1000000);
  internal.wal.flush(true, true);
};

var subquery = function (params) {
  db._query("FOR c IN @@c LET sub = (FOR s IN @@c FILTER s.@attr == c.@attr RETURN s) RETURN LENGTH(sub)", { 
    "@c": params.collection, 
    "attr": params.attr 
   });
};

var min = function (params) {
  db._query("RETURN MIN(FOR c IN @@c RETURN c.@attr)", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var max = function (params) {
  db._query("RETURN MAX(FOR c IN @@c RETURN c.@attr)", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var concat = function (params) {
  db._query("FOR c IN @@c RETURN CONCAT(c._key, '-', c.@attr)", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var merge = function (params) {
  db._query("FOR c IN @@c RETURN MERGE(c, { 'testValue': c.@attr })", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var keep = function (params) {
  db._query("FOR c IN @@c RETURN KEEP(c, '_key', '_rev', '_id')", { 
    "@c": params.collection 
  });
};

var unset = function (params) {
  db._query("FOR c IN @@c RETURN UNSET(c, '_key', '_rev', '_id')", { 
    "@c": params.collection 
  });
};

var sort = function (params) {
  db._query("FOR c IN @@c SORT c.@attr LIMIT 1 RETURN c.@attr", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var filter = function (params) {
  db._query("FOR c IN @@c FILTER c.@attr == @value RETURN c.@attr", { 
    "@c": params.collection, 
    "attr": params.attr, 
    "value" : params.value 
  });
};

var extract = function (params) {
  if (params.attr === undefined) {
    db._query("FOR c IN @@c RETURN c", { 
      "@c": params.collection 
    });
  }
  else {
    db._query("FOR c IN @@c RETURN c.@attr", { 
      "@c": params.collection, 
      "attr" : params.attr 
    });
  }
};

var join = function (params) {
  db._query("FOR c1 IN @@c FOR c2 IN @@c FILTER c1.@attr == c2.@attr RETURN c1", { 
    "@c": params.collection, 
    "attr": params.attr 
  });
};

var lookupIn = function (params) {
  var keys = [], numeric = params.numeric;
  for (var i = 0; i < params.n; ++i) {
    if (numeric) {
      keys.push(i);
    }
    else {
      keys.push("test" + i);
    }
  } 
  db._query("FOR c IN @@c FILTER c.@attr IN @keys RETURN c", { 
    "@c": params.collection, 
    "attr": params.attr, keys : keys 
  });
};

var collect = function (params) {
  if (params.count) {
    db._query("FOR c IN @@c COLLECT g = c.@attr WITH COUNT INTO l RETURN [ g, l ]", { 
      "@c": params.collection, 
      "attr": params.attr 
    });
  }
  else {
    db._query("FOR c IN @@c COLLECT g = c.@attr RETURN g", { 
      "@c": params.collection, 
      "attr": params.attr 
    });
  }
};


initialize();

var tests = [
  { name: "collect-number",         params: { func: collect,  attr: "value7", count: false } },
  { name: "collect-string",         params: { func: collect,  attr: "value8", count: false } },
  { name: "collect-count-number",   params: { func: collect,  attr: "value7", count: true } },
  { name: "collect-count-string",   params: { func: collect,  attr: "value8", count: true } },
  { name: "subquery",               params: { func: subquery, attr: "value1" } },
  { name: "concat",                 params: { func: concat,   attr: "value5" } },
  { name: "merge-number",           params: { func: merge,    attr: "value5" } },
  { name: "merge-string",           params: { func: merge,    attr: "value6" } },
  { name: "keep",                   params: { func: keep,     attr: "value5" } },
  { name: "unset",                  params: { func: unset,    attr: "value5" } },
  { name: "min-number",             params: { func: min,      attr: "value5" } },
  { name: "min-string",             params: { func: min,      attr: "value6" } },
  { name: "max-number",             params: { func: max,      attr: "value5" } },
  { name: "max-string",             params: { func: max,      attr: "value6" } },
  { name: "sort-number",            params: { func: sort,     attr: "value5" } },
  { name: "sort-string",            params: { func: sort,     attr: "value6" } },
  { name: "filter-number",          params: { func: filter,   attr: "value5", value: 333 } },
  { name: "filter-string",          params: { func: filter,   attr: "value6", value: "test333" } },
  { name: "extract-doc",            params: { func: extract } },
  { name: "extract-key",            params: { func: extract,  attr: "_key" } },
  { name: "extract-number",         params: { func: extract,  attr: "value1" } },
  { name: "extract-string",         params: { func: extract,  attr: "value2" } },
  { name: "join-key",               params: { func: join,     attr: "_key" } },
  { name: "join-id",                params: { func: join,     attr: "_id" } },
  { name: "join-hash-number",       params: { func: join,     attr: "value1" } },
  { name: "join-hash-string",       params: { func: join,     attr: "value2" } },
  { name: "join-skiplist-number",   params: { func: join,     attr: "value3" } },
  { name: "join-skiplist-string",   params: { func: join,     attr: "value4" } },
  { name: "lookup-key",             params: { func: lookupIn, attr: "_key", n: 10000, numeric: false } },
  { name: "lookup-hash-number",     params: { func: lookupIn, attr: "value1", n: 10000, numeric: true } },
  { name: "lookup-hash-string",     params: { func: lookupIn, attr: "value2", n: 10000, numeric: false } },
  { name: "lookup-skiplist-number", params: { func: lookupIn, attr: "value3", n: 10000, numeric: true } },
  { name: "lookup-skiplist-string", params: { func: lookupIn, attr: "value4", n: 10000, numeric: false } }

];


var options = { 
  runs: 5,  
  digits: 4,
  setup: function (params) {
    db._collection(params.collection).load();
    internal.wait(1, true);
  },
  teardown: function () { 
  },
  collections: [
    { name: "values10000",    label: "10k" },
    { name: "values100000",   label: "100k" },
    { name: "values1000000",  label: "1000k" }
  ]
};

var results = testRunner(tests, options);
internal.print(results.join("\n"));
