class PrologQueryTerm
{
	baseTerm: any[];
	constrainedTerm: any[];
	rule: any[];
	constraintIndex: number = 0;
	currentRuleQuery: PrologQuery;
	lastResult: any;
	constructor(rule: any[], baseTerm: any[]){
		this.rule = rule;
		this.baseTerm = baseTerm;
		this.constrainedTerm = baseTerm;
	}
	rewind()
	{
		this.constraintIndex = 0;
	}
	setConstraints(constraints: any = {})
	{
		this.constrainedTerm = [];
		for(var i = 0; i < this.baseTerm.length; i++){
			var t = this.baseTerm[i];
			if(t instanceof Object){
				if(constraints[t.id] === undefined){
					this.constrainedTerm.push(t);
				} else{
					this.constrainedTerm.push(constraints[t.id]);
				}
			} else{
				this.constrainedTerm.push(t);
			}
		}
		this.rewind();
	}
	getLastResult()
	{
		return this.lastResult;
	}
	unify()
	{
		//console.log("start constraintIndex: " + this.constraintIndex);
		var isConstrained = function(v){
			if(!(v instanceof Object)) return true;
			return false;
		}
		for(var i = this.constraintIndex; i < this.rule.length; i++){
			var t = this.rule[i];
			// matching head
			var h = t[0];
			var body = t[1];
			if(!this.currentRuleQuery){
				if(h.length != this.constrainedTerm.length){
					// console.log("aa");
					continue;
				}
				var k;
				for(k = 0; k < h.length; k++){
					if(isConstrained(this.constrainedTerm[k]) && isConstrained(h[k])){
						if(this.constrainedTerm[k] !== h[k]) break;	// 不一致
					}
				}
				if(k < h.length){
					//console.log("bb" + this.constrainedTerm[k] + ":" + h[k]);
					continue;
				}
				this.currentRuleQuery = new PrologQuery(this.rule, body);
			}
			// matching body
			var ctx = this.currentRuleQuery.unify();
			if(ctx === false){
				//console.log("body failed: " + JSON.stringify(t));
				this.currentRuleQuery = null;
				continue;
			}
			// return matched variables
			this.constraintIndex = i;
			var retv = {};
			for(k in this.constrainedTerm){
				var e = this.constrainedTerm[k];
				if(e instanceof Object){
					if(h[k] instanceof Object){
						if(ctx[h[k].id] !== undefined) retv[e.id] = ctx[h[k].id];
					} else{
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
	}
}

class PrologQuery
{
	body: any[];
	rule: any[];
	terms: PrologQueryTerm[];
	index: number = 0;
	constructor(rule: any[], body: any[] = []){
		this.rule = rule;
		this.body = body;
		this.terms = [];
		for(var i = 0; i < this.body.length; i++){
			this.terms.push(new PrologQueryTerm(this.rule, this.body[i]));
		}
		if(this.body.length >= 1){
			this.terms[0].setConstraints({});
		}
	}
	getConstraints()
	{
		if(this.index < 0) return {};
		var list = this.terms.slice(0, this.index);
		var ctx = {};
		for(var t of list){
			var r = t.getLastResult();
			for(var k in r){
				if(ctx[k] === undefined) ctx[k] = r[k];
			}
		}
		return ctx;
	}
	unify()
	{
		//console.log("start index: " + this.index);
		if(this.index < 0) return false;
		if(this.terms.length == 0){
			this.index = -1;	// 常に真となる項は1回しかマッチしない
			return {};
		}
		while(this.index < this.terms.length){
			//console.log("try: body[" + this.index + "] = " + JSON.stringify(this.body[this.index]));
			var retv = this.terms[this.index].unify();
			if(retv === false){
				this.terms[this.index].rewind();
				this.index--;
				//console.log("backtrack");
				if(this.index < 0) return false;
				continue;
			}
			this.index++;
			if(this.terms[this.index]){
				this.terms[this.index].setConstraints(this.getConstraints());
			}
		}
		var retv = this.getConstraints();
		this.index--;
		//console.log("ctx: " + JSON.stringify(this.constraintStack, null, " "));
		return retv;
	}
}

class Prolog
{
	rule: any[] = [];
	constructor(){
		
	}
	setRule(rule: any[]){
		this.rule = rule;
	}
	query(body: any[]){
		return new PrologQuery(this.rule, body);
	}
}

module.exports = Prolog;

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
]);


//var q = prolog.query([["parent", {"id": "X"}, {"id": "Y"}]]);
var q = prolog.query([["hasachild", {"id": "X"}]]);
//var q = new PrologQuery(rule, [["parent", {"id": "X"}, {"id": "Y"}], ["female", {"id": "X"}]]);
//var q = new PrologQuery(rule, [["mother", {"id": "X"}, {"id": "Y"}]]);
console.log(q.unify());
console.log(q.unify());
console.log(q.unify());
console.log(q.unify());
console.log(q.unify());
console.log(q.unify());
console.log(q.unify());
