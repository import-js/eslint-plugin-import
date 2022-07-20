// source https://github.com/privatenumber/get-tsconfig
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.parseTsconfig = exports.getTsconfig = exports.createPathsMatcher = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var module_1 = __importDefault(require("module"));
var getOwnPropertyDescriptors_1 = require("object.getownpropertydescriptors");
var getOwnPropertySymbols_1 = require("get-own-property-symbols");
function T(r) { var t = /^\\\\\?\\/.test(r), n = /[^\u0000-\u0080]+/.test(r); return t || n ? r : r.replace(/\\/g, "/"); }
function B(r, t) { for (;;) {
    var n = path_1["default"].join(r, t);
    if (fs_1["default"].existsSync(n))
        return T(n);
    var e = path_1["default"].dirname(r);
    if (e === r)
        return;
    r = e;
} }
function G(r, t) {
    t === void 0 && (t = !1);
    var n = r.length, e = 0, i = "", a = 0, o = 16, u = 0, f = 0, d = 0, C = 0, c = 0;
    function y(s, m) { for (var v = 0, b = 0; v < s || !m;) {
        var h = r.charCodeAt(e);
        if (h >= 48 && h <= 57)
            b = b * 16 + h - 48;
        else if (h >= 65 && h <= 70)
            b = b * 16 + h - 65 + 10;
        else if (h >= 97 && h <= 102)
            b = b * 16 + h - 97 + 10;
        else
            break;
        e++, v++;
    } return v < s && (b = -1), b; }
    function V(s) { e = s, i = "", a = 0, o = 16, c = 0; }
    function $() { var s = e; if (r.charCodeAt(e) === 48)
        e++;
    else
        for (e++; e < r.length && j(r.charCodeAt(e));)
            e++; if (e < r.length && r.charCodeAt(e) === 46)
        if (e++, e < r.length && j(r.charCodeAt(e)))
            for (e++; e < r.length && j(r.charCodeAt(e));)
                e++;
        else
            return c = 3, r.substring(s, e); var m = e; if (e < r.length && (r.charCodeAt(e) === 69 || r.charCodeAt(e) === 101))
        if (e++, (e < r.length && r.charCodeAt(e) === 43 || r.charCodeAt(e) === 45) && e++, e < r.length && j(r.charCodeAt(e))) {
            for (e++; e < r.length && j(r.charCodeAt(e));)
                e++;
            m = e;
        }
        else
            c = 3; return r.substring(s, m); }
    function _() {
        for (var s = "", m = e;;) {
            if (e >= n) {
                s += r.substring(m, e), c = 2;
                break;
            }
            var v = r.charCodeAt(e);
            if (v === 34) {
                s += r.substring(m, e), e++;
                break;
            }
            if (v === 92) {
                if (s += r.substring(m, e), e++, e >= n) {
                    c = 2;
                    break;
                }
                var b = r.charCodeAt(e++);
                switch (b) {
                    case 34:
                        s += '"';
                        break;
                    case 92:
                        s += "\\";
                        break;
                    case 47:
                        s += "/";
                        break;
                    case 98:
                        s += "\b";
                        break;
                    case 102:
                        s += "\f";
                        break;
                    case 110:
                        s += "\n";
                        break;
                    case 114:
                        s += "\r";
                        break;
                    case 116:
                        s += "  ";
                        break;
                    case 117:
                        var h = y(4, !0);
                        h >= 0 ? s += String.fromCharCode(h) : c = 4;
                        break;
                    default: c = 5;
                }
                m = e;
                continue;
            }
            if (v >= 0 && v <= 31)
                if (P(v)) {
                    s += r.substring(m, e), c = 2;
                    break;
                }
                else
                    c = 6;
            e++;
        }
        return s;
    }
    function S() {
        if (i = "", c = 0, a = e, f = u, C = d, e >= n)
            return a = n, o = 17;
        var s = r.charCodeAt(e);
        if (U(s)) {
            do
                e++, i += String.fromCharCode(s), s = r.charCodeAt(e);
            while (U(s));
            return o = 15;
        }
        if (P(s))
            return e++, i += String.fromCharCode(s), s === 13 && r.charCodeAt(e) === 10 && (e++, i += "\n"), u++, d = e, o = 14;
        switch (s) {
            case 123: return e++, o = 1;
            case 125: return e++, o = 2;
            case 91: return e++, o = 3;
            case 93: return e++, o = 4;
            case 58: return e++, o = 6;
            case 44: return e++, o = 5;
            case 34: return e++, i = _(), o = 10;
            case 47:
                var m = e - 1;
                if (r.charCodeAt(e + 1) === 47) {
                    for (e += 2; e < n && !P(r.charCodeAt(e));)
                        e++;
                    return i = r.substring(m, e), o = 12;
                }
                if (r.charCodeAt(e + 1) === 42) {
                    e += 2;
                    for (var v = n - 1, b = !1; e < v;) {
                        var h = r.charCodeAt(e);
                        if (h === 42 && r.charCodeAt(e + 1) === 47) {
                            e += 2, b = !0;
                            break;
                        }
                        e++, P(h) && (h === 13 && r.charCodeAt(e) === 10 && e++, u++, d = e);
                    }
                    return b || (e++, c = 1), i = r.substring(m, e), o = 13;
                }
                return i += String.fromCharCode(s), e++, o = 16;
            case 45: if (i += String.fromCharCode(s), e++, e === n || !j(r.charCodeAt(e)))
                return o = 16;
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57: return i += $(), o = 11;
            default:
                for (; e < n && k(s);)
                    e++, s = r.charCodeAt(e);
                if (a !== e) {
                    switch (i = r.substring(a, e), i) {
                        case "true": return o = 8;
                        case "false": return o = 9;
                        case "null": return o = 7;
                    }
                    return o = 16;
                }
                return i += String.fromCharCode(s), e++, o = 16;
        }
    }
    function k(s) { if (U(s) || P(s))
        return !1; switch (s) {
        case 125:
        case 93:
        case 123:
        case 91:
        case 34:
        case 58:
        case 44:
        case 47: return !1;
    } return !0; }
    function l() { var s; do
        s = S();
    while (s >= 12 && s <= 15); return s; }
    return { setPosition: V, getPosition: function () { return e; }, scan: t ? l : S, getToken: function () { return o; }, getTokenValue: function () { return i; }, getTokenOffset: function () { return a; }, getTokenLength: function () { return e - a; }, getTokenStartLine: function () { return f; }, getTokenStartCharacter: function () { return a - C; }, getTokenError: function () { return c; } };
}
function U(r) { return r === 32 || r === 9 || r === 11 || r === 12 || r === 160 || r === 5760 || r >= 8192 && r <= 8203 || r === 8239 || r === 8287 || r === 12288 || r === 65279; }
function P(r) { return r === 10 || r === 13 || r === 8232 || r === 8233; }
function j(r) { return r >= 48 && r <= 57; }
var N;
(function (r) { r.DEFAULT = { allowTrailingComma: !1 }; })(N || (N = {}));
function K(r, t, n) { t === void 0 && (t = []), n === void 0 && (n = N.DEFAULT); var e = null, i = [], a = []; function o(f) { Array.isArray(i) ? i.push(f) : e !== null && (i[e] = f); } var u = { onObjectBegin: function () { var f = {}; o(f), a.push(i), i = f, e = null; }, onObjectProperty: function (f) { e = f; }, onObjectEnd: function () { i = a.pop(); }, onArrayBegin: function () { var f = []; o(f), a.push(i), i = f, e = null; }, onArrayEnd: function () { i = a.pop(); }, onLiteralValue: o, onError: function (f, d, C) { t.push({ error: f, offset: d, length: C }); } }; return Q(r, u, n), i[0]; }
function Q(r, t, n) { n === void 0 && (n = N.DEFAULT); var e = G(r, !1); function i(p) { return p ? function () { return p(e.getTokenOffset(), e.getTokenLength(), e.getTokenStartLine(), e.getTokenStartCharacter()); } : function () { return !0; }; } function a(p) { return p ? function (w) { return p(w, e.getTokenOffset(), e.getTokenLength(), e.getTokenStartLine(), e.getTokenStartCharacter()); } : function () { return !0; }; } var o = i(t.onObjectBegin), u = a(t.onObjectProperty), f = i(t.onObjectEnd), d = i(t.onArrayBegin), C = i(t.onArrayEnd), c = a(t.onLiteralValue), y = a(t.onSeparator), V = i(t.onComment), $ = a(t.onError), _ = n && n.disallowComments, S = n && n.allowTrailingComma; function k() { for (;;) {
    var p = e.scan();
    switch (e.getTokenError()) {
        case 4:
            l(14);
            break;
        case 5:
            l(15);
            break;
        case 3:
            l(13);
            break;
        case 1:
            _ || l(11);
            break;
        case 2:
            l(12);
            break;
        case 6:
            l(16);
            break;
    }
    switch (p) {
        case 12:
        case 13:
            _ ? l(10) : V();
            break;
        case 16:
            l(1);
            break;
        case 15:
        case 14: break;
        default: return p;
    }
} } function l(p, w, L) { if (w === void 0 && (w = []), L === void 0 && (L = []), $(p), w.length + L.length > 0)
    for (var D = e.getToken(); D !== 17;) {
        if (w.indexOf(D) !== -1) {
            k();
            break;
        }
        else if (L.indexOf(D) !== -1)
            break;
        D = k();
    } } function s(p) { var w = e.getTokenValue(); return p ? c(w) : u(w), k(), !0; } function m() { switch (e.getToken()) {
    case 11:
        var p = e.getTokenValue(), w = Number(p);
        isNaN(w) && (l(2), w = 0), c(w);
        break;
    case 7:
        c(null);
        break;
    case 8:
        c(!0);
        break;
    case 9:
        c(!1);
        break;
    default: return !1;
} return k(), !0; } function v() { return e.getToken() !== 10 ? (l(3, [], [2, 5]), !1) : (s(!1), e.getToken() === 6 ? (y(":"), k(), F() || l(4, [], [2, 5])) : l(5, [], [2, 5]), !0); } function b() { o(), k(); for (var p = !1; e.getToken() !== 2 && e.getToken() !== 17;) {
    if (e.getToken() === 5) {
        if (p || l(4, [], []), y(","), k(), e.getToken() === 2 && S)
            break;
    }
    else
        p && l(6, [], []);
    v() || l(4, [], [2, 5]), p = !0;
} return f(), e.getToken() !== 2 ? l(7, [2], []) : k(), !0; } function h() { d(), k(); for (var p = !1; e.getToken() !== 4 && e.getToken() !== 17;) {
    if (e.getToken() === 5) {
        if (p || l(4, [], []), y(","), k(), e.getToken() === 4 && S)
            break;
    }
    else
        p && l(6, [], []);
    F() || l(4, [], [4, 5]), p = !0;
} return C(), e.getToken() !== 4 ? l(8, [4], []) : k(), !0; } function F() { switch (e.getToken()) {
    case 3: return h();
    case 1: return b();
    case 10: return s(!0);
    default: return m();
} } return k(), e.getToken() === 17 ? n.allowEmptyContent ? !0 : (l(4, [], []), !1) : F() ? (e.getToken() !== 17 && l(9, [], []), !0) : (l(4, [], []), !1); }
var X = K;
var W = /^\.{1,2}(\/.*)?$/, J = function (r) { return T(W.test(r) ? r : "./".concat(r)); }, E = fs_1["default"].existsSync, Y = function (r) { try {
    return JSON.parse(r);
}
catch (_a) { } }, Z = function () { var r = module_1["default"].findPnpApi; return r && r(process.cwd()); };
function I(r) { var t = Y(fs_1["default"].readFileSync(r, "utf8")); return path_1["default"].join(r, "..", t && "tsconfig" in t ? t.tsconfig : "tsconfig.json"); }
function x(r, t) { var n = r; if (n === ".." && (n += "/tsconfig.json"), n.startsWith(".")) {
    var a = path_1["default"].resolve(t, n);
    if (E(a) && fs_1["default"].statSync(a).isFile() || !a.endsWith(".json") && (a += ".json", E(a)))
        return a;
    throw new Error("File '".concat(r, "' not found."));
} var e = Z(); if (e) {
    var a = e.resolveRequest, _a = r.split("/"), o = _a[0], u = _a[1], f = o.startsWith("@") ? "".concat(o, "/").concat(u) : o;
    try {
        if (f === r) {
            var d = a(path_1["default"].join(f, "package.json"), t);
            if (d) {
                var C = I(d);
                if (E(C))
                    return C;
            }
        }
        else
            try {
                return a(r, t, { extensions: [".json"] });
            }
            catch (_b) {
                return a(path_1["default"].join(r, "tsconfig.json"), t);
            }
    }
    catch (_c) { }
} var i = B(t, path_1["default"].join("node_modules", n)); if (i) {
    if (fs_1["default"].statSync(i).isDirectory()) {
        var a = path_1["default"].join(i, "package.json");
        if (E(a) ? i = I(a) : i = path_1["default"].join(i, "tsconfig.json"), E(i))
            return i;
    }
    else if (i.endsWith(".json"))
        return i;
} if (!n.endsWith(".json") && (n += ".json", i = B(t, path_1["default"].join("node_modules", n)), i))
    return i; throw new Error("File '".concat(r, "' not found.")); }
var ee = Object.defineProperty, re = Object.defineProperties, ne = getOwnPropertyDescriptors_1, R = getOwnPropertySymbols_1, te = Object.prototype.hasOwnProperty, ae = Object.prototype.propertyIsEnumerable, q = function (r, t, n) { return t in r ? ee(r, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[t] = n; }, A = function (r, t) { for (var n in t || (t = {}))
    te.call(t, n) && q(r, n, t[n]); if (R)
    for (var _i = 0, _a = R(t); _i < _a.length; _i++) {
        var n = _a[_i];
        ae.call(t, n) && q(r, n, t[n]);
    } return r; }, oe = function (r, t) { return re(r, ne(t)); };
function M(r) { var t; var n; try {
    n = fs_1["default"].realpathSync(r);
}
catch (_a) {
    throw new Error("Cannot resolve tsconfig at path: ".concat(r));
} var e = path_1["default"].dirname(n), i = fs_1["default"].readFileSync(n, "utf8").trim(); var a = {}; if (i && (a = X(i), !a || typeof a != "object"))
    throw new SyntaxError("Failed to parse tsconfig at: ".concat(r)); if (a["extends"]) {
    var o_1 = x(a["extends"], e), u = M(o_1);
    if (delete u.references, (t = u.compilerOptions) != null && t.baseUrl) {
        var d = u.compilerOptions;
        d.baseUrl = path_1["default"].relative(e, path_1["default"].join(path_1["default"].dirname(o_1), d.baseUrl)) || "./";
    }
    u.files && (u.files = u.files.map(function (d) { return path_1["default"].relative(e, path_1["default"].join(path_1["default"].dirname(o_1), d)); })), u.include && (u.include = u.include.map(function (d) { return path_1["default"].relative(e, path_1["default"].join(path_1["default"].dirname(o_1), d)); })), delete a["extends"];
    var f = oe(A(A({}, u), a), { compilerOptions: A(A({}, u.compilerOptions), a.compilerOptions) });
    u.watchOptions && (f.watchOptions = A(A({}, u.watchOptions), a.watchOptions)), a = f;
} if (a.compilerOptions) {
    var o = a.compilerOptions;
    o.baseUrl && (o.baseUrl = J(o.baseUrl)), o.outDir && (Array.isArray(a.exclude) || (a.exclude = []), a.exclude.push(o.outDir), o.outDir = J(o.outDir));
} if (a.files && (a.files = a.files.map(J)), a.include && (a.include = a.include.map(T)), a.watchOptions) {
    var o = a.watchOptions;
    o.excludeDirectories && (o.excludeDirectories = o.excludeDirectories.map(function (u) { return T(path_1["default"].resolve(e, u)); }));
} return a; }
exports.parseTsconfig = M;
function ie(r, t) {
    if (r === void 0) { r = process.cwd(); }
    if (t === void 0) { t = "tsconfig.json"; }
    var n = B(r, t);
    if (!n)
        return null;
    var e = M(n);
    return { path: n, config: e };
}
exports.getTsconfig = ie;
var se = /\*/g, z = function (r, t) { var n = r.match(se); if (n && n.length > 1)
    throw new Error(t); };
function ce(r) { if (r.includes("*")) {
    var _a = r.split("*"), t = _a[0], n = _a[1];
    return { prefix: t, suffix: n };
} return r; }
var fe = function (_a, n) {
    var r = _a.prefix, t = _a.suffix;
    return n.startsWith(r) && n.endsWith(t);
};
function ue(r, t, n) { return Object.entries(r).map(function (_a) {
    var e = _a[0], i = _a[1];
    return (z(e, "Pattern '".concat(e, "' can have at most one '*' character.")), { pattern: ce(e), substitutions: i.map(function (a) { if (z(a, "Substitution '".concat(a, "' in pattern '").concat(e, "' can have at most one '*' character.")), !t && !W.test(a))
            throw new Error("Non-relative paths are not allowed when 'baseUrl' is not set. Did you forget a leading './'?"); return path_1["default"].join(n, a); }) });
}); }
function le(r) { if (!r.config.compilerOptions)
    return null; var _a = r.config.compilerOptions, t = _a.baseUrl, n = _a.paths; if (!t && !n)
    return null; var e = path_1["default"].resolve(path_1["default"].dirname(r.path), t || "."), i = n ? ue(n, t, e) : []; return function (o) { if (W.test(o))
    return []; var u = []; for (var _i = 0, i_1 = i; _i < i_1.length; _i++) {
    var c = i_1[_i];
    if (c.pattern === o)
        return c.substitutions.map(T);
    typeof c.pattern != "string" && u.push(c);
} var f, d = -1; for (var _a = 0, u_1 = u; _a < u_1.length; _a++) {
    var c = u_1[_a];
    fe(c.pattern, o) && c.pattern.prefix.length > d && (d = c.pattern.prefix.length, f = c);
} if (!f)
    return t ? [T(path_1["default"].join(e, o))] : []; var C = o.slice(f.pattern.prefix.length, o.length - f.pattern.suffix.length); return f.substitutions.map(function (c) { return T(c.replace("*", C)); }); }; }
exports.createPathsMatcher = le;
