"use strict";Object.defineProperty(exports, "__esModule", { value: true }); /**
                                                                             * Same as the classic array.flat() method, which I cannot use
                                                                             * because that does not pass some CI pipelines. I'm guessing
                                                                             * there is somehow differently configured transpilation.
                                                                             * Didn't have time to get into the details.
                                                                             */
var arrayFlat = exports.arrayFlat = function arrayFlat(arrayOfArrays) {
  return arrayOfArrays.reduce(function (acc, item) {
    return acc.concat(item);
  }, []);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3V0aWxzL2FycmF5LmpzIl0sIm5hbWVzIjpbImFycmF5RmxhdCIsImFycmF5T2ZBcnJheXMiLCJyZWR1Y2UiLCJhY2MiLCJpdGVtIiwiY29uY2F0Il0sIm1hcHBpbmdzIjoiNEVBQUE7Ozs7OztBQU1PLElBQU1BLGdDQUFZLFNBQVpBLFNBQVksQ0FBQ0MsYUFBRCxFQUFtQjtBQUMxQyxTQUFPQSxjQUFjQyxNQUFkLENBQXFCLFVBQUNDLEdBQUQsRUFBTUMsSUFBTixFQUFlO0FBQ3pDLFdBQU9ELElBQUlFLE1BQUosQ0FBV0QsSUFBWCxDQUFQO0FBQ0QsR0FGTSxFQUVKLEVBRkksQ0FBUDtBQUdELENBSk0iLCJmaWxlIjoiYXJyYXkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNhbWUgYXMgdGhlIGNsYXNzaWMgYXJyYXkuZmxhdCgpIG1ldGhvZCwgd2hpY2ggSSBjYW5ub3QgdXNlXG4gKiBiZWNhdXNlIHRoYXQgZG9lcyBub3QgcGFzcyBzb21lIENJIHBpcGVsaW5lcy4gSSdtIGd1ZXNzaW5nXG4gKiB0aGVyZSBpcyBzb21laG93IGRpZmZlcmVudGx5IGNvbmZpZ3VyZWQgdHJhbnNwaWxhdGlvbi5cbiAqIERpZG4ndCBoYXZlIHRpbWUgdG8gZ2V0IGludG8gdGhlIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBjb25zdCBhcnJheUZsYXQgPSAoYXJyYXlPZkFycmF5cykgPT4ge1xuICByZXR1cm4gYXJyYXlPZkFycmF5cy5yZWR1Y2UoKGFjYywgaXRlbSkgPT4ge1xuICAgIHJldHVybiBhY2MuY29uY2F0KGl0ZW0pXG4gIH0sIFtdKVxufVxuIl19