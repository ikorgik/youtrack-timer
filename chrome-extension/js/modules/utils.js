define(function () {
  var DAY_IN_MS = 864e5;

  function noon(year, month, day) {
    return new Date(year, month, day, 12, 0, 0);
  }

  function dayOfYear(date) {

    if (!date) date = new Date;

    var then = noon(date.getFullYear(), date.getMonth(), date.getDate()),
      first = noon(date.getFullYear(), 0, 0);

    return Math.round((then - first) / DAY_IN_MS);
  }

  function _f() { }

  return {
    dayOfYear: dayOfYear,
    noon: noon,
    _f: _f,
    DAY_IN_MS: DAY_IN_MS
  }
});
