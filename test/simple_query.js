
const Prolog = require("../index.js");

var prolog = new Prolog();
prolog.setRule([
	[["parent", "pam", "bob"]],
	[["parent", "tom", "bob"]],
	[["parent", "tom", "liz"]],
	[["parent", "bob", "ann"]],
	[["parent", "bob", "pat"]],
	[["parent", "pat", "jim"]],
]);

var q = prolog.query([["parent", {"id": "X"}, {"id": "Y"}]]);
var r = q.unify();
var X = r.X;
var Y = r.Y;
console.log(X == "pam" && Y == "bob");
