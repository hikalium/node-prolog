var PrologQueryTerm = (function () {
    function PrologQueryTerm(rule, baseTerm) {
        this.constraintIndex = 0;
        this.rule = rule;
        this.baseTerm = baseTerm;
        this.constrainedTerm = baseTerm;
    }
    PrologQueryTerm.prototype.rewind = function () {
        this.constraintIndex = 0;
    };
    PrologQueryTerm.prototype.setConstraints = function (constraints) {
        if (constraints === void 0) { constraints = {}; }
        this.constrainedTerm = [];
        for (var i = 0; i < this.baseTerm.length; i++) {
            var t = this.baseTerm[i];
            if (t instanceof Object) {
                if (constraints[t.id] === undefined) {
                    this.constrainedTerm.push(t);
                }
                else {
                    this.constrainedTerm.push(constraints[t.id]);
                }
            }
            else {
                this.constrainedTerm.push(t);
            }
        }
        this.rewind();
    };
    PrologQueryTerm.prototype.getLastResult = function () {
        return this.lastResult;
    };
    PrologQueryTerm.prototype.unify = function () {
        //console.log("start constraintIndex: " + this.constraintIndex);
        var isConstrained = function (v) {
            if (!(v instanceof Object))
                return true;
            return false;
        };
        for (var i = this.constraintIndex; i < this.rule.length; i++) {
            var t = this.rule[i];
            // matching head
            var h = t[0];
            var body = t[1];
            if (!this.currentRuleQuery) {
                if (h.length != this.constrainedTerm.length) {
                    // console.log("aa");
                    continue;
                }
                var k;
                for (k = 0; k < h.length; k++) {
                    if (isConstrained(this.constrainedTerm[k]) && isConstrained(h[k])) {
                        if (this.constrainedTerm[k] !== h[k])
                            break; // 不一致
                    }
                }
                if (k < h.length) {
                    //console.log("bb" + this.constrainedTerm[k] + ":" + h[k]);
                    continue;
                }
                this.currentRuleQuery = new PrologQuery(this.rule, body);
            }
            // matching body
            var ctx = this.currentRuleQuery.unify();
            if (ctx === false) {
                //console.log("body failed: " + JSON.stringify(t));
                this.currentRuleQuery = null;
                continue;
            }
            // return matched variables
            this.constraintIndex = i;
            var retv = {};
            for (k in this.constrainedTerm) {
                var e = this.constrainedTerm[k];
                if (e instanceof Object) {
                    if (h[k] instanceof Object) {
                        if (ctx[h[k].id] !== undefined)
                            retv[e.id] = ctx[h[k].id];
                    }
                    else {
                        retv[e.id] = h[k];
                    }
                }
            }
            //console.log("match: " + JSON.stringify(this.constrainedTerm) + ": -> rule["+ this.constraintIndex+"]");
            this.lastResult = retv;
            return retv;
        }
        this.constraintIndex = i;
        //console.log("Failed to match: " + JSON.stringify(this.constrainedTerm));
        return false;
    };
    PrologQueryTerm.prototype.toTraceString = function () {
        var s = "";
        s += JSON.stringify(this.baseTerm) + "\n";
        s += JSON.stringify(this.constrainedTerm) + "\n";
        s += "-> " + this.currentRuleQuery.toTraceString();
        return s;
    };
    return PrologQueryTerm;
}());
var PrologQuery = (function () {
    function PrologQuery(rule, body) {
        if (body === void 0) { body = []; }
        this.index = 0;
        this.rule = rule;
        this.body = body;
        this.terms = [];
        for (var i = 0; i < this.body.length; i++) {
            this.terms.push(new PrologQueryTerm(this.rule, this.body[i]));
        }
        if (this.body.length >= 1) {
            this.terms[0].setConstraints({});
        }
    }
    PrologQuery.prototype.getConstraints = function () {
        if (this.index < 0)
            return {};
        var list = this.terms.slice(0, this.index);
        var ctx = {};
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var t = list_1[_i];
            var r = t.getLastResult();
            for (var k in r) {
                if (ctx[k] === undefined)
                    ctx[k] = r[k];
            }
        }
        return ctx;
    };
    PrologQuery.prototype.unify = function () {
        //console.log("start index: " + this.index);
        if (this.index < 0)
            return false;
        if (this.terms.length == 0) {
            this.index = -1; // 常に真となる項は1回しかマッチしない
            return {};
        }
        while (this.index < this.terms.length) {
            //console.log("try: body[" + this.index + "] = " + JSON.stringify(this.body[this.index]));
            var retv = this.terms[this.index].unify();
            if (retv === false) {
                this.terms[this.index].rewind();
                this.index--;
                //console.log("backtrack");
                if (this.index < 0)
                    return false;
                continue;
            }
            this.index++;
            if (this.terms[this.index]) {
                this.terms[this.index].setConstraints(this.getConstraints());
            }
        }
        var retv = this.getConstraints();
        this.index--;
        //console.log("ctx: " + JSON.stringify(this.constraintStack, null, " "));
        return retv;
    };
    PrologQuery.prototype.toTraceString = function () {
        var s = "";
        s += JSON.stringify(this.body);
        for (var _i = 0, _a = this.terms; _i < _a.length; _i++) {
            var t = _a[_i];
            s += t.toTraceString();
        }
        return s;
    };
    return PrologQuery;
}());
var Prolog = (function () {
    function Prolog() {
        this.rule = [];
    }
    Prolog.prototype.setRule = function (rule) {
        this.rule = rule;
    };
    Prolog.prototype.query = function (body) {
        return new PrologQuery(this.rule, body);
    };
    return Prolog;
}());
module.exports = Prolog;
/*
class PrologInterpreter
{
readonly spaceChars = " \t\n";
readonly varPrefix = "$";
var tokens = [];
isCodePoint
parse(str){
    var i = 0;
    while(1){
        if(str[i] === undefined) break;
        if(~this.spaceChars.indexOf(str[i])){
            tokens.push(["space"]);
            i++;
        } else{
            var s = "";
            for()
        }
    }
}
return tokens;
}

var inp = new PrologInterpreter();
var res = inp.parse(`
parent($a, $b) :- sub(0x12, a, $b)
`);
console.log(res);

 */
/*

var prolog = new Prolog();
prolog.setRule([
[["parent", "pam", "bob"]],
[["parent", "tom", "bob"]],
[["parent", "tom", "liz"]],
[["parent", "bob", "ann"]],
[["parent", "bob", "pat"]],
[["parent", "pat", "jim"]],
//
[["female", "pam"]],
[["male", "tom"]],
[["male", "bob"]],
[["female", "liz"]],
[["female", "pat"]],
[["female", "ann"]],
[["male", "jim"]],
//
[["mother", {"id": "X"}, {"id": "Y"}],
    [["parent", {"id": "X"}, {"id": "Y"}], ["female", {"id": "X"}]]],
[["hasachild", {"id": "X"}],
    [["parent", {"id": "X"}, {"id": "Y"}]]],
[["predecessor", {"id": "X"}, {"id": "Y"}],
    [["parent", {"id": "X"}, {"id": "Y"}]]],
[["predecessor", {"id": "X"}, {"id": "Z"}],
    [["parent", {"id": "X"}, {"id": "Y"}], ["predecessor", {"id": "Y"},  {"id": "Z"}]]],
]);
 */
/*
//var q = prolog.query([["parent", {"id": "X"}, {"id": "Y"}]]);
//var q = prolog.query([["hasachild", {"id": "X"}]]);
var q = prolog.query([["predecessor", "bob", {"id": "Y"}]]);
//var q = new PrologQuery(rule, [["parent", {"id": "X"}, {"id": "Y"}], ["female", {"id": "X"}]]);
//var q = new PrologQuery(rule, [["mother", {"id": "X"}, {"id": "Y"}]]);
console.log(q.unify());
console.log(q.toTraceString());
console.log(q.unify());
console.log(q.unify());
 */
