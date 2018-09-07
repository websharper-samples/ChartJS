// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
/*!
 * Chart.js
 * http://chartjs.org/
 * Version: 2.5.0
 *
 * Copyright 2017 Nick Downie
 * Released under the MIT license
 * https://github.com/chartjs/Chart.js/blob/master/LICENSE.md
 */
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.Chart=t()}}(function(){return function t(e,a,i){function n(r,s){if(!a[r]){if(!e[r]){var l="function"==typeof require&&require;if(!s&&l)return l(r,!0);if(o)return o(r,!0);var u=new Error("Cannot find module '"+r+"'");throw u.code="MODULE_NOT_FOUND",u}var d=a[r]={exports:{}};e[r][0].call(d.exports,function(t){var a=e[r][1][t];return n(a?a:t)},d,d.exports,t,e,a,i)}return a[r].exports}for(var o="function"==typeof require&&require,r=0;r<i.length;r++)n(i[r]);return n}({1:[function(t,e,a){},{}],2:[function(t,e,a){function i(t){if(t){var e=/^#([a-fA-F0-9]{3})$/,a=/^#([a-fA-F0-9]{6})$/,i=/^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/,n=/^rgba?\(\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/,o=/(\w+)/,r=[0,0,0],s=1,l=t.match(e);if(l){l=l[1];for(var u=0;u<r.length;u++)r[u]=parseInt(l[u]+l[u],16)}else if(l=t.match(a)){l=l[1];for(var u=0;u<r.length;u++)r[u]=parseInt(l.slice(2*u,2*u+2),16)}else if(l=t.match(i)){for(var u=0;u<r.length;u++)r[u]=parseInt(l[u+1]);s=parseFloat(l[4])}else if(l=t.match(n)){for(var u=0;u<r.length;u++)r[u]=Math.round(2.55*parseFloat(l[u+1]));s=parseFloat(l[4])}else if(l=t.match(o)){if("transparent"==l[1])return[0,0,0,0];if(r=y[l[1]],!r)return}for(var u=0;u<r.length;u++)r[u]=b(r[u],0,255);return s=s||0==s?b(s,0,1):1,r[3]=s,r}}function n(t){if(t){var e=/^hsla?\(\s*([+-]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)/,a=t.match(e);if(a){var i=parseFloat(a[4]),n=b(parseInt(a[1]),0,360),o=b(parseFloat(a[2]),0,100),r=b(parseFloat(a[3]),0,100),s=b(isNaN(i)?1:i,0,1);return[n,o,r,s]}}}function o(t){if(t){var e=/^hwb\(\s*([+-]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)/,a=t.match(e);if(a){var i=parseFloat(a[4]),n=b(parseInt(a[1]),0,360),o=b(parseFloat(a[2]),0,100),r=b(parseFloat(a[3]),0,100),s=b(isNaN(i)?1:i,0,1);return[n,o,r,s]}}}function r(t){var e=i(t);return e&&e.slice(0,3)}function s(t){var e=n(t);return e&&e.slice(0,3)}function l(t){var e=i(t);return e?e[3]:(e=n(t))?e[3]:(e=o(t))?e[3]:void 0}function u(t){return"#"+x(t[0])+x(t[1])+x(t[2])}function d(t,e){return e<1||t[3]&&t[3]<1?c(t,e):"rgb("+t[0]+", "+t[1]+", "+t[2]+")"}function c(t,e){return void 0===e&&(e=void 0!==t[3]?t[3]:1),"rgba("+t[0]+", "+t[1]+", "+t[2]+", "+e+")"}function h(t,e){if(e<1||t[3]&&t[3]<1)return f(t,e);var a=Math.round(t[0]/255*100),i=Math.round(t[1]/255*100),n=Math.round(t[2]/255*100);return"rgb("+a+"%, "+i+"%, "+n+"%)"}function f(t,e){var a=Math.round(t[0]/255*100),i=Math.round(t[1]/255*100),n=Math.round(t[2]/255*100);return"rgba("+a+"%, "+i+"%, "+n+"%, "+(e||t[3]||1)+")"}function g(t,e){return e<1||t[3]&&t[3]<1?p(t,e):"hsl("+t[0]+", "+t[1]+"%, "+t[2]+"%)"}function p(t,e){return void 0===e&&(e=void 0!==t[3]?t[3]:1),"hsla("+t[0]+", "+t[1]+"%, "+t[2]+"%, "+e+")"}function m(t,e){return void 0===e&&(e=void 0!==t[3]?t[3]:1),"hwb("+t[0]+", "+t[1]+"%, "+t[2]+"%"+(void 0!==e&&1!==e?", "+e:"")+")"}function v(t){return k[t.slice(0,3)]}function b(t,e,a){return Math.min(Math.max(e,t),a)}function x(t){var e=t.toString(16).toUpperCase();return e.length<2?"0"+e:e}var y=t(6);e.exports={getRgba:i,getHsla:n,getRgb:r,getHsl:s,getHwb:o,getAlpha:l,hexString:u,rgbString:d,rgbaString:c,percentString:h,percentaString:f,hslString:g,hslaString:p,hwbString:m,keyword:v};var k={};for(var S in y)k[y[S]]=S},{6:6}],3:[function(t,e,a){var i=t(5),n=t(2),o=function(t){if(t instanceof o)return t;if(!(this instanceof o))return new o(t);this.values={rgb:[0,0,0],hsl:[0,0,0],hsv:[0,0,0],hwb:[0,0,0],cmyk:[0,0,0,0],alpha:1};var e;if("string"==typeof t)if(e=n.getRgba(t))this.setValues("rgb",e);else if(e=n.getHsla(t))this.setValues("hsl",e);else{if(!(e=n.getHwb(t)))throw new Error('Unable to parse color from string "'+t+'"');this.setValues("hwb",e)}else if("object"==typeof t)if(e=t,void 0!==e.r||void 0!==e.red)this.setValues("rgb",e);else if(void 0!==e.l||void 0!==e.lightness)this.setValues("hsl",e);else if(void 0!==e.v||void 0!==e.value)this.setValues("hsv",e);else if(void 0!==e.w||void 0!==e.whiteness)this.setValues("hwb",e);else{if(void 0===e.c&&void 0===e.cyan)throw new Error("Unable to parse color from object "+JSON.stringify(t));this.setValues("cmyk",e)}};o.prototype={rgb:function(){return this.setSpace("rgb",arguments)},hsl:function(){return this.setSpace("hsl",arguments)},hsv:function(){return this.setSpace("hsv",arguments)},hwb:function(){return this.setSpace("hwb",arguments)},cmyk:function(){return this.setSpace("cmyk",arguments)},rgbArray:function(){return this.values.rgb},hslArray:function(){return this.values.hsl},hsvArray:function(){return this.values.hsv},hwbArray:function(){var t=this.values;return 1!==t.alpha?t.hwb.concat([t.alpha]):t.hwb},cmykArray:function(){return this.values.cmyk},rgbaArray:function(){var t=this.values;return t.rgb.concat([t.alpha])},hslaArray:function(){var t=this.values;return t.hsl.concat([t.alpha])},alpha:function(t){return void 0===t?this.values.alpha:(this.setValues("alpha",t),this)},red:function(t){return this.setChannel("rgb",0,t)},green:function(t){return this.setChannel("rgb",1,t)},blue:function(t){return this.setChannel("rgb",2,t)},hue:function(t){return t&&(t%=360,t=t<0?360+t:t),this.setChannel("hsl",0,t)},saturation:function(t){return this.setChannel("hsl",1,t)},lightness:function(t){return this.setChannel("hsl",2,t)},saturationv:function(t){return this.setChannel("hsv",1,t)},whiteness:function(t){return this.setChannel("hwb",1,t)},blackness:function(t){return this.setChannel("hwb",2,t)},value:function(t){return this.setChannel("hsv",2,t)},cyan:function(t){return this.setChannel("cmyk",0,t)},magenta:function(t){return this.setChannel("cmyk",1,t)},yellow:function(t){return this.setChannel("cmyk",2,t)},black:function(t){return this.setChannel("cmyk",3,t)},hexString:function(){return n.hexString(this.values.rgb)},rgbString:function(){return n.rgbString(this.values.rgb,this.values.alpha)},rgbaString:function(){return n.rgbaString(this.values.rgb,this.values.alpha)},percentString:function(){return n.percentString(this.values.rgb,this.values.alpha)},hslString:function(){return n.hslString(this.values.hsl,this.values.alpha)},hslaString:function(){return n.hslaString(this.values.hsl,this.values.alpha)},hwbString:function(){return n.hwbString(this.values.hwb,this.values.alpha)},keyword:function(){return n.keyword(this.values.rgb,this.values.alpha)},rgbNumber:function(){var t=this.values.rgb;return t[0]<<16|t[1]<<8|t[2]},luminosity:function(){for(var t=this.values.rgb,e=[],a=0;a<t.length;a++){var i=t[a]/255;e[a]=i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4)}return.2126*e[0]+.7152*e[1]+.0722*e[2]},contrast:function(t){var e=this.luminosity(),a=t.luminosity();return e>a?(e+.05)/(a+.05):(a+.05)/(e+.05)},level:function(t){var e=this.contrast(t);return e>=7.1?"AAA":e>=4.5?"AA":""},dark:function(){var t=this.values.rgb,e=(299*t[0]+587*t[1]+114*t[2])/1e3;return e<128},light:function(){return!this.dark()},negate:function(){for(var t=[],e=0;e<3;e++)t[e]=255-this.values.rgb[e];return this.setValues("rgb",t),this},lighten:function(t){var e=this.values.hsl;return e[2]+=e[2]*t,this.setValues("hsl",e),this},darken:function(t){var e=this.values.hsl;return e[2]-=e[2]*t,this.setValues("hsl",e),this},saturate:function(t){var e=this.values.hsl;return e[1]+=e[1]*t,this.setValues("hsl",e),this},desaturate:function(t){var e=this.values.hsl;return e[1]-=e[1]*t,this.setValues("hsl",e),this},whiten:function(t){var e=this.values.hwb;return e[1]+=e[1]*t,this.setValues("hwb",e),this},blacken:function(t){var e=this.values.hwb;return e[2]+=e[2]*t,this.setValues("hwb",e),this},greyscale:function(){var t=this.values.rgb,e=.3*t[0]+.59*t[1]+.11*t[2];return this.setValues("rgb",[e,e,e]),this},clearer:function(t){var e=this.values.alpha;return this.setValues("alpha",e-e*t),this},opaquer:function(t){var e=this.values.alpha;return this.setValues("alpha",e+e*t),this},rotate:function(t){var e=this.values.hsl,a=(e[0]+t)%360;return e[0]=a<0?360+a:a,this.setValues("hsl",e),this},mix:function(t,e){var a=this,i=t,n=void 0===e?.5:e,o=2*n-1,r=a.alpha()-i.alpha(),s=((o*r===-1?o:(o+r)/(1+o*r))+1)/2,l=1-s;return this.rgb(s*a.red()+l*i.red(),s*a.green()+l*i.green(),s*a.blue()+l*i.blue()).alpha(a.alpha()*n+i.alpha()*(1-n))},toJSON:function(){return this.rgb()},clone:function(){var t,e,a=new o,i=this.values,n=a.values;for(var r in i)i.hasOwnProperty(r)&&(t=i[r],e={}.toString.call(t),"[object Array]"===e?n[r]=t.slice(0):"[object Number]"===e?n[r]=t:console.error("unexpected color value:",t));return a}},o.prototype.spaces={rgb:["red","green","blue"],hsl:["hue","saturation","lightness"],hsv:["hue","saturation","value"],hwb:["hue","whiteness","blackness"],cmyk:["cyan","magenta","yellow","black"]},o.prototype.maxes={rgb:[255,255,255],hsl:[360,100,100],hsv:[360,100,100],hwb:[360,100,100],cmyk:[100,100,100,100]},o.prototype.getValues=function(t){for(var e=this.values,a={},i=0;i<t.length;i++)a[t.charAt(i)]=e[t][i];return 1!==e.alpha&&(a.a=e.alpha),a},o.prototype.setValues=function(t,e){var a,n=this.values,o=this.spaces,r=this.maxes,s=1;if("alpha"===t)s=e;else if(e.length)n[t]=e.slice(0,t.length),s=e[t.length];else if(void 0!==e[t.charAt(0)]){for(a=0;a<t.length;a++)n[t][a]=e[t.charAt(a)];s=e.a}else if(void 0!==e[o[t][0]]){var l=o[t];for(a=0;a<t.length;a++)n[t][a]=e[l[a]];s=e.alpha}if(n.alpha=Math.max(0,Math.min(1,void 0===s?n.alpha:s)),"alpha"===t)return!1;var u;for(a=0;a<t.length;a++)u=Math.max(0,Math.min(r[t][a],n[t][a])),n[t][a]=Math.round(u);for(var d in o)d!==t&&(n[d]=i[t][d](n[t]));return!0},o.prototype.setSpace=function(t,e){var a=e[0];return void 0===a?this.getValues(t):("number"==typeof a&&(a=Array.prototype.slice.call(e)),this.setValues(t,a),this)},o.prototype.setChannel=function(t,e,a){var i=this.values[t];return void 0===a?i[e]:a===i[e]?this:(i[e]=a,this.setValues(t,i),this)},"undefined"!=typeof window&&(window.Color=o),e.exports=o},{2:2,5:5}],4:[function(t,e,a){function i(t){var e,a,i,n=t[0]/255,o=t[1]/255,r=t[2]/255,s=Math.min(n,o,r),l=Math.max(n,o,r),u=l-s;return l==s?e=0:n==l?e=(o-r)/u:o==l?e=2+(r-n)/u:r==l&&(e=4+(n-o)/u),e=Math.min(60*e,360),e<0&&(e+=360),i=(s+l)/2,a=l==s?0:i<=.5?u/(l+s):u/(2-l-s),[e,100*a,100*i]}function n(t){var e,a,i,n=t[0],o=t[1],r=t[2],s=Math.min(n,o,r),l=Math.max(n,o,r),u=l-s;return a=0==l?0:u/l*1e3/10,l==s?e=0:n==l?e=(o-r)/u:o==l?e=2+(r-n)/u:r==l&&(e=4+(n-o)/u),e=Math.min(60*e,360),e<0&&(e+=360),i=l/255*1e3/10,[e,a,i]}function o(t){var e=t[0],a=t[1],n=t[2],o=i(t)[0],r=1/255*Math.min(e,Math.min(a,n)),n=1-1/255*Math.max(e,Math.max(a,n));return[o,100*r,100*n]}function s(t){var e,a,i,n,o=t[0]/255,r=t[1]/255,s=t[2]/255;return n=Math.min(1-o,1-r,1-s),e=(1-o-n)/(1-n)||0,a=(1-r-n)/(1-n)||0,i=(1-s-n)/(1-n)||0,[100*e,100*a,100*i,100*n]}function l(t){return Z[JSON.stringify(t)]}function u(t){var e=t[0]/255,a=t[1]/255,i=t[2]/255;e=e>.04045?Math.pow((e+.055)/1.055,2.4):e/12.92,a=a>.04045?Math.pow((a+.055)/1.055,2.4):a/12.92,i=i>.04045?Math.pow((i+.055)/1.055,2.4):i/12.92;var n=.4124*e+.3576*a+.1805*i,o=.2126*e+.7152*a+.0722*i,r=.0193*e+.1192*a+.9505*i;return[100*n,100*o,100*r]}function d(t){var e,a,i,n=u(t),o=n[0],r=n[1],s=n[2];return o/=95.047,r/=100,s/=108.883,o=o>.008856?Math.pow(o,1/3):7.787*o+16/116,r=r>.008856?Math.pow(r,1/3):7.787*r+16/116,s=s>.008856?Math.pow(s,1/3):7.787*s+16/116,e=116*r-16,a=500*(o-r),i=200*(r-s),[e,a,i]}function c(t){return z(d(t))}function h(t){var e,a,i,n,o,r=t[0]/360,s=t[1]/100,l=t[2]/100;if(0==s)return o=255*l,[o,o,o];a=l<.5?l*(1+s):l+s-l*s,e=2*l-a,n=[0,0,0];for(var u=0;u<3;u++)i=r+1/3*-(u-1),i<0&&i++,i>1&&i--,o=6*i<1?e+6*(a-e)*i:2*i<1?a:3*i<2?e+(a-e)*(2/3-i)*6:e,n[u]=255*o;return n}function f(t){var e,a,i=t[0],n=t[1]/100,o=t[2]/100;return 0===o?[0,0,0]:(o*=2,n*=o<=1?o:2-o,a=(o+n)/2,e=2*n/(o+n),[i,100*e,100*a])}function p(t){return o(h(t))}function m(t){return s(h(t))}function v(t){return l(h(t))}function x(t){var e=t[0]/60,a=t[1]/100,i=t[2]/100,n=Math.floor(e)%6,o=e-Math.floor(e),r=255*i*(1-a),s=255*i*(1-a*o),l=255*i*(1-a*(1-o)),i=255*i;switch(n){case 0:return[i,l,r];case 1:return[s,i,r];case 2:return[r,i,l];case 3:return[r,s,i];case 4:return[l,r,i];case 5:return[i,r,s]}}function y(t){var e,a,i=t[0],n=t[1]/100,o=t[2]/100;return a=(2-n)*o,e=n*o,e/=a<=1?a:2-a,e=e||0,a/=2,[i,100*e,100*a]}function k(t){return o(x(t))}function S(t){return s(x(t))}function M(t){return l(x(t))}function w(t){var e,a,i,n,o=t[0]/360,s=t[1]/100,l=t[2]/100,u=s+l;switch(u>1&&(s/=u,l/=u),e=Math.floor(6*o),a=1-l,i=6*o-e,0!=(1&e)&&(i=1-i),n=s+i*(a-s),e){default:case 6:case 0:r=a,g=n,b=s;break;case 1:r=n,g=a,b=s;break;case 2:r=s,g=a,b=n;break;case 3:r=s,g=n,b=a;break;case 4:r=n,g=s,b=a;break;case 5:r=a,g=s,b=n}return[255*r,255*g,255*b]}function C(t){return i(w(t))}function I(t){return n(w(t))}function D(t){return s(w(t))}function A(t){return l(w(t))}function T(t){var e,a,i,n=t[0]/100,o=t[1]/100,r=t[2]/100,s=t[3]/100;return e=1-Math.min(1,n*(1-s)+s),a=1-Math.min(1,o*(1-s)+s),i=1-Math.min(1,r*(1-s)+s),[255*e,255*a,255*i]}function P(t){return i(T(t))}function _(t){return n(T(t))}function F(t){return o(T(t))}function V(t){return l(T(t))}function R(t){var e,a,i,n=t[0]/100,o=t[1]/100,r=t[2]/100;return e=3.2406*n+o*-1.5372+r*-.4986,a=n*-.9689+1.8758*o+.0415*r,i=.0557*n+o*-.204+1.057*r,e=e>.0031308?1.055*Math.pow(e,1/2.4)-.055:e*=12.92,a=a>.0031308?1.055*Math.pow(a,1/2.4)-.055:a*=12.92,i=i>.0031308?1.055*Math.pow(i,1/2.4)-.055:i*=12.92,e=Math.min(Math.max(0,e),1),a=Math.min(Math.max(0,a),1),i=Math.min(Math.max(0,i),1),[255*e,255*a,255*i]}function O(t){var e,a,i,n=t[0],o=t[1],r=t[2];return n/=95.047,o/=100,r/=108.883,n=n>.008856?Math.pow(n,1/3):7.787*n+16/116,o=o>.008856?Math.pow(o,1/3):7.787*o+16/116,r=r>.008856?Math.pow(r,1/3):7.787*r+16/116,e=116*o-16,a=500*(n-o),i=200*(o-r),[e,a,i]}function L(t){return z(O(t))}function B(t){var e,a,i,n,o=t[0],r=t[1],s=t[2];return o<=8?(a=100*o/903.3,n=7.787*(a/100)+16/116):(a=100*Math.pow((o+16)/116,3),n=Math.pow(a/100,1/3)),e=e/95.047<=.008856?e=95.047*(r/500+n-16/116)/7.787:95.047*Math.pow(r/500+n,3),i=i/108.883<=.008859?i=108.883*(n-s/200-16/116)/7.787:108.883*Math.pow(n-s/200,3),[e,a,i]}function z(t){var e,a,i,n=t[0],o=t[1],r=t[2];return e=Math.atan2(r,o),a=360*e/2/Math.PI,a<0&&(a+=360),i=Math.sqrt(o*o+r*r),[n,i,a]}function W(t){return R(B(t))}function N(t){var e,a,i,n=t[0],o=t[1],r=t[2];return i=r/360*2*Math.PI,e=o*Math.cos(i),a=o*Math.sin(i),[n,e,a]}function E(t){return B(N(t))}function H(t){return W(N(t))}function j(t){return G[t]}function U(t){return i(j(t))}function q(t){return n(j(t))}function Y(t){return o(j(t))}function X(t){return s(j(t))}function K(t){return d(j(t))}function J(t){return u(j(t))}e.exports={rgb2hsl:i,rgb2hsv:n,rgb2hwb:o,rgb2cmyk:s,rgb2keyword:l,rgb2xyz:u,rgb2lab:d,rgb2lch:c,hsl2rgb:h,hsl2hsv:f,hsl2hwb:p,hsl2cmyk:m,hsl2keyword:v,hsv2rgb:x,hsv2hsl:y,hsv2hwb:k,hsv2cmyk:S,hsv2keyword:M,hwb2rgb:w,hwb2hsl:C,hwb2hsv:I,hwb2cmyk:D,hwb2keyword:A,cmyk2rgb:T,cmyk2hsl:P,cmyk2hsv:_,cmyk2hwb:F,cmyk2keyword:V,keyword2rgb:j,keyword2hsl:U,keyword2hsv:q,keyword2hwb:Y,keyword2cmyk:X,keyword2lab:K,keyword2xyz:J,xyz2rgb:R,xyz2lab:O,xyz2lch:L,lab2xyz:B,lab2rgb:W,lab2lch:z,lch2lab:N,lch2xyz:E,lch2rgb:H};var G={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]},Z={};for(var Q in G)Z[JSON.stringify(G[Q])]=Q},{}],5:[function(t,e,a){var i=t(4),n=function(){return new u};for(var o in i){n[o+"Raw"]=function(t){return function(e){return"number"==typeof e&&(e=Array.prototype.slice.call(arguments)),i[t](e)}}(o);var r=/(\w+)2(\w+)/.exec(o),s=r[1],l=r[2];n[s]=n[s]||{},n[s][l]=n[o]=function(t){return function(e){"number"==typeof e&&(e=Array.prototype.slice.call(arguments));var a=i[t](e);if("string"==typeof a||void 0===a)return a;for(var n=0;n<a.length;n++)a[n]=Math.round(a[n]);return a}}(o)}var u=function(){this.convs={}};u.prototype.routeSpace=function(t,e){var a=e[0];return void 0===a?this.getValues(t):("number"==typeof a&&(a=Array.prototype.slice.call(e)),this.setValues(t,a))},u.prototype.setValues=function(t,e){return this.space=t,this.convs={},this.convs[t]=e,this},u.prototype.getValues=function(t){var e=this.convs[t];if(!e){var a=this.space,i=this.convs[a];e=n[a][t](i),this.convs[t]=e}return e},["rgb","hsl","hsv","cmyk","keyword"].forEach(function(t){u.prototype[t]=function(e){return this.routeSpace(t,arguments)}}),e.exports=n},{4:4}],6:[function(t,e,a){e.exports={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]}},{}],7:[function(t,e,a){var i=t(28)();t(26)(i),t(42)(i),t(22)(i),t(31)(i),t(25)(i),t(21)(i),t(23)(i),t(24)(i),t(29)(i),t(33)(i),t(34)(i),t(32)(i),t(35)(i),t(30)(i),t(27)(i),t(36)(i),t(37)(i),t(38)(i),t(39)(i),t(40)(i),t(45)(i),t(43)(i),t(44)(i),t(46)(i),t(47)(i),t(48)(i),t(15)(i),t(16)(i),t(17)(i),t(18)(i),t(19)(i),t(20)(i),t(8)(i),t(9)(i),t(10)(i),t(11)(i),t(12)(i),t(13)(i),t(14)(i),window.Chart=e.exports=i},{10:10,11:11,12:12,13:13,14:14,15:15,16:16,17:17,18:18,19:19,20:20,21:21,22:22,23:23,24:24,25:25,26:26,27:27,28:28,29:29,30:30,31:31,32:32,33:33,34:34,35:35,36:36,37:37,38:38,39:39,40:40,42:42,43:43,44:44,45:45,46:46,47:47,48:48,8:8,9:9}],8:[function(t,e,a){"use strict";e.exports=function(t){t.Bar=function(e,a){return a.type="bar",new t(e,a)}}},{}],9:[function(t,e,a){"use strict";e.exports=function(t){t.Bubble=function(e,a){return a.type="bubble",new t(e,a)}}},{}],10:[function(t,e,a){"use strict";e.exports=function(t){t.Doughnut=function(e,a){return a.type="doughnut",new t(e,a)}}},{}],11:[function(t,e,a){"use strict";e.exports=function(t){t.Line=function(e,a){return a.type="line",new t(e,a)}}},{}],12:[function(t,e,a){"use strict";e.exports=function(t){t.PolarArea=function(e,a){return a.type="polarArea",new t(e,a)}}},{}],13:[function(t,e,a){"use strict";e.exports=function(t){t.Radar=function(e,a){return a.type="radar",new t(e,a)}}},{}],14:[function(t,e,a){"use strict";e.exports=function(t){var e={hover:{mode:"single"},scales:{xAxes:[{type:"linear",position:"bottom",id:"x-axis-1"}],yAxes:[{type:"linear",position:"left",id:"y-axis-1"}]},tooltips:{callbacks:{title:function(){return""},label:function(t){return"("+t.xLabel+", "+t.yLabel+")"}}}};t.defaults.scatter=e,t.controllers.scatter=t.controllers.line,t.Scatter=function(e,a){return a.type="scatter",new t(e,a)}}},{}],15:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.bar={hover:{mode:"label"},scales:{xAxes:[{type:"category",categoryPercentage:.8,barPercentage:.9,gridLines:{offsetGridLines:!0}}],yAxes:[{type:"linear"}]}},t.controllers.bar=t.DatasetController.extend({dataElementType:t.elements.Rectangle,initialize:function(e,a){t.DatasetController.prototype.initialize.call(this,e,a);var i=this,n=i.getMeta(),o=i.getDataset();n.stack=o.stack,n.bar=!0},getStackCount:function(){var t=this,a=t.getMeta(),i=t.getScaleForId(a.yAxisID),n=[];return e.each(t.chart.data.datasets,function(e,a){var o=t.chart.getDatasetMeta(a);o.bar&&t.chart.isDatasetVisible(a)&&(i.options.stacked===!1||i.options.stacked===!0&&n.indexOf(o.stack)===-1||void 0===i.options.stacked&&(void 0===o.stack||n.indexOf(o.stack)===-1))&&n.push(o.stack)},t),n.length},update:function(t){var a=this;e.each(a.getMeta().data,function(e,i){a.updateElement(e,i,t)},a)},updateElement:function(t,a,i){var n=this,o=n.getMeta(),r=n.getScaleForId(o.xAxisID),s=n.getScaleForId(o.yAxisID),l=s.getBasePixel(),u=n.chart.options.elements.rectangle,d=t.custom||{},c=n.getDataset();t._xScale=r,t._yScale=s,t._datasetIndex=n.index,t._index=a;var h=n.getRuler(a);t._model={x:n.calculateBarX(a,n.index,h),y:i?l:n.calculateBarY(a,n.index),label:n.chart.data.labels[a],datasetLabel:c.label,horizontal:!1,base:i?l:n.calculateBarBase(n.index,a),width:n.calculateBarWidth(h),backgroundColor:d.backgroundColor?d.backgroundColor:e.getValueAtIndexOrDefault(c.backgroundColor,a,u.backgroundColor),borderSkipped:d.borderSkipped?d.borderSkipped:u.borderSkipped,borderColor:d.borderColor?d.borderColor:e.getValueAtIndexOrDefault(c.borderColor,a,u.borderColor),borderWidth:d.borderWidth?d.borderWidth:e.getValueAtIndexOrDefault(c.borderWidth,a,u.borderWidth)},t.pivot()},calculateBarBase:function(t,e){var a=this,i=a.getMeta(),n=a.getScaleForId(i.yAxisID),o=n.getBaseValue(),r=o;if(n.options.stacked===!0||void 0===n.options.stacked&&void 0!==i.stack){for(var s=a.chart,l=s.data.datasets,u=Number(l[t].data[e]),d=0;d<t;d++){var c=l[d],h=s.getDatasetMeta(d);if(h.bar&&h.yAxisID===n.id&&s.isDatasetVisible(d)&&i.stack===h.stack){var f=Number(c.data[e]);o+=u<0?Math.min(f,r):Math.max(f,r)}}return n.getPixelForValue(o)}return n.getBasePixel()},getRuler:function(){var t=this,e=t.getMeta(),a=t.getScaleForId(e.xAxisID),i=t.getStackCount(),n=a.width/a.ticks.length,o=n*a.options.categoryPercentage,r=(n-n*a.options.categoryPercentage)/2,s=o/i,l=s*a.options.barPercentage,u=s-s*a.options.barPercentage;return{stackCount:i,tickWidth:n,categoryWidth:o,categorySpacing:r,fullBarWidth:s,barWidth:l,barSpacing:u}},calculateBarWidth:function(t){var e=this,a=e.getMeta(),i=e.getScaleForId(a.xAxisID);return i.options.barThickness?i.options.barThickness:t.barWidth},getStackIndex:function(t){var e,a,i=this,n=i.chart.getDatasetMeta(t),o=i.getScaleForId(n.yAxisID),r=[n.stack];for(a=0;a<t;++a)e=this.chart.getDatasetMeta(a),e.bar&&this.chart.isDatasetVisible(a)&&(o.options.stacked===!1||o.options.stacked===!0&&r.indexOf(e.stack)===-1||void 0===o.options.stacked&&(void 0===e.stack||r.indexOf(e.stack)===-1))&&r.push(e.stack);return r.length-1},calculateBarX:function(t,e,a){var i=this,n=i.getMeta(),o=i.getScaleForId(n.xAxisID),r=i.getStackIndex(e),s=o.getPixelForValue(null,t,e,i.chart.isCombo);return s-=i.chart.isCombo?a.tickWidth/2:0,s+a.barWidth/2+a.categorySpacing+a.barWidth*r+a.barSpacing/2+a.barSpacing*r},calculateBarY:function(t,e){var a=this,i=a.getMeta(),n=a.getScaleForId(i.yAxisID),o=Number(a.getDataset().data[t]);if(n.options.stacked||void 0===n.options.stacked&&void 0!==i.stack){for(var r=n.getBaseValue(),s=r,l=r,u=0;u<e;u++){var d=a.chart.data.datasets[u],c=a.chart.getDatasetMeta(u);if(c.bar&&c.yAxisID===n.id&&a.chart.isDatasetVisible(u)&&i.stack===c.stack){var h=Number(d.data[t]);h<0?l+=h||0:s+=h||0}}return o<0?n.getPixelForValue(l+o):n.getPixelForValue(s+o)}return n.getPixelForValue(o)},draw:function(e){var a,i,n=this,o=e||1,r=n.getMeta().data,s=n.getDataset();for(t.canvasHelpers.clipArea(n.chart.chart.ctx,n.chart.chartArea),a=0,i=r.length;a<i;++a){var l=s.data[a];null===l||void 0===l||isNaN(l)||r[a].transition(o).draw()}t.canvasHelpers.unclipArea(n.chart.chart.ctx)},setHoverStyle:function(t){var a=this.chart.data.datasets[t._datasetIndex],i=t._index,n=t.custom||{},o=t._model;o.backgroundColor=n.hoverBackgroundColor?n.hoverBackgroundColor:e.getValueAtIndexOrDefault(a.hoverBackgroundColor,i,e.getHoverColor(o.backgroundColor)),o.borderColor=n.hoverBorderColor?n.hoverBorderColor:e.getValueAtIndexOrDefault(a.hoverBorderColor,i,e.getHoverColor(o.borderColor)),o.borderWidth=n.hoverBorderWidth?n.hoverBorderWidth:e.getValueAtIndexOrDefault(a.hoverBorderWidth,i,o.borderWidth)},removeHoverStyle:function(t){var a=this.chart.data.datasets[t._datasetIndex],i=t._index,n=t.custom||{},o=t._model,r=this.chart.options.elements.rectangle;o.backgroundColor=n.backgroundColor?n.backgroundColor:e.getValueAtIndexOrDefault(a.backgroundColor,i,r.backgroundColor),o.borderColor=n.borderColor?n.borderColor:e.getValueAtIndexOrDefault(a.borderColor,i,r.borderColor),o.borderWidth=n.borderWidth?n.borderWidth:e.getValueAtIndexOrDefault(a.borderWidth,i,r.borderWidth)}}),t.defaults.horizontalBar={hover:{mode:"label"},scales:{xAxes:[{type:"linear",position:"bottom"}],yAxes:[{position:"left",type:"category",categoryPercentage:.8,barPercentage:.9,gridLines:{offsetGridLines:!0}}]},elements:{rectangle:{borderSkipped:"left"}},tooltips:{callbacks:{title:function(t,e){var a="";return t.length>0&&(t[0].yLabel?a=t[0].yLabel:e.labels.length>0&&t[0].index<e.labels.length&&(a=e.labels[t[0].index])),a},label:function(t,e){var a=e.datasets[t.datasetIndex].label||"";return a+": "+t.xLabel}}}},t.controllers.horizontalBar=t.controllers.bar.extend({getStackCount:function(){var t=this,a=t.getMeta(),i=t.getScaleForId(a.xAxisID),n=[];return e.each(t.chart.data.datasets,function(e,a){var o=t.chart.getDatasetMeta(a);o.bar&&t.chart.isDatasetVisible(a)&&(i.options.stacked===!1||i.options.stacked===!0&&n.indexOf(o.stack)===-1||void 0===i.options.stacked&&(void 0===o.stack||n.indexOf(o.stack)===-1))&&n.push(o.stack)},t),n.length},updateElement:function(t,a,i){var n=this,o=n.getMeta(),r=n.getScaleForId(o.xAxisID),s=n.getScaleForId(o.yAxisID),l=r.getBasePixel(),u=t.custom||{},d=n.getDataset(),c=n.chart.options.elements.rectangle;t._xScale=r,t._yScale=s,t._datasetIndex=n.index,t._index=a;var h=n.getRuler(a);t._model={x:i?l:n.calculateBarX(a,n.index),y:n.calculateBarY(a,n.index,h),label:n.chart.data.labels[a],datasetLabel:d.label,horizontal:!0,base:i?l:n.calculateBarBase(n.index,a),height:n.calculateBarHeight(h),backgroundColor:u.backgroundColor?u.backgroundColor:e.getValueAtIndexOrDefault(d.backgroundColor,a,c.backgroundColor),borderSkipped:u.borderSkipped?u.borderSkipped:c.borderSkipped,borderColor:u.borderColor?u.borderColor:e.getValueAtIndexOrDefault(d.borderColor,a,c.borderColor),
borderWidth:u.borderWidth?u.borderWidth:e.getValueAtIndexOrDefault(d.borderWidth,a,c.borderWidth)},t.pivot()},calculateBarBase:function(t,e){var a=this,i=a.getMeta(),n=a.getScaleForId(i.xAxisID),o=n.getBaseValue(),r=o;if(n.options.stacked||void 0===n.options.stacked&&void 0!==i.stack){for(var s=a.chart,l=s.data.datasets,u=Number(l[t].data[e]),d=0;d<t;d++){var c=l[d],h=s.getDatasetMeta(d);if(h.bar&&h.xAxisID===n.id&&s.isDatasetVisible(d)&&i.stack===h.stack){var f=Number(c.data[e]);o+=u<0?Math.min(f,r):Math.max(f,r)}}return n.getPixelForValue(o)}return n.getBasePixel()},getRuler:function(){var t=this,e=t.getMeta(),a=t.getScaleForId(e.yAxisID),i=t.getStackCount(),n=a.height/a.ticks.length,o=n*a.options.categoryPercentage,r=(n-n*a.options.categoryPercentage)/2,s=o/i,l=s*a.options.barPercentage,u=s-s*a.options.barPercentage;return{stackCount:i,tickHeight:n,categoryHeight:o,categorySpacing:r,fullBarHeight:s,barHeight:l,barSpacing:u}},calculateBarHeight:function(t){var e=this,a=e.getMeta(),i=e.getScaleForId(a.yAxisID);return i.options.barThickness?i.options.barThickness:t.barHeight},getStackIndex:function(t){var e,a,i=this,n=i.chart.getDatasetMeta(t),o=i.getScaleForId(n.xAxisID),r=[n.stack];for(a=0;a<t;++a)e=this.chart.getDatasetMeta(a),e.bar&&this.chart.isDatasetVisible(a)&&(o.options.stacked===!1||o.options.stacked===!0&&r.indexOf(e.stack)===-1||void 0===o.options.stacked&&(void 0===e.stack||r.indexOf(e.stack)===-1))&&r.push(e.stack);return r.length-1},calculateBarX:function(t,e){var a=this,i=a.getMeta(),n=a.getScaleForId(i.xAxisID),o=Number(a.getDataset().data[t]);if(n.options.stacked||void 0===n.options.stacked&&void 0!==i.stack){for(var r=n.getBaseValue(),s=r,l=r,u=0;u<e;u++){var d=a.chart.data.datasets[u],c=a.chart.getDatasetMeta(u);if(c.bar&&c.xAxisID===n.id&&a.chart.isDatasetVisible(u)&&i.stack===c.stack){var h=Number(d.data[t]);h<0?l+=h||0:s+=h||0}}return o<0?n.getPixelForValue(l+o):n.getPixelForValue(s+o)}return n.getPixelForValue(o)},calculateBarY:function(t,e,a){var i=this,n=i.getMeta(),o=i.getScaleForId(n.yAxisID),r=i.getStackIndex(e),s=o.getPixelForValue(null,t,e,i.chart.isCombo);return s-=i.chart.isCombo?a.tickHeight/2:0,s+a.barHeight/2+a.categorySpacing+a.barHeight*r+a.barSpacing/2+a.barSpacing*r}})}},{}],16:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.bubble={hover:{mode:"single"},scales:{xAxes:[{type:"linear",position:"bottom",id:"x-axis-0"}],yAxes:[{type:"linear",position:"left",id:"y-axis-0"}]},tooltips:{callbacks:{title:function(){return""},label:function(t,e){var a=e.datasets[t.datasetIndex].label||"",i=e.datasets[t.datasetIndex].data[t.index];return a+": ("+t.xLabel+", "+t.yLabel+", "+i.r+")"}}}},t.controllers.bubble=t.DatasetController.extend({dataElementType:t.elements.Point,update:function(t){var a=this,i=a.getMeta(),n=i.data;e.each(n,function(e,i){a.updateElement(e,i,t)})},updateElement:function(a,i,n){var o=this,r=o.getMeta(),s=o.getScaleForId(r.xAxisID),l=o.getScaleForId(r.yAxisID),u=a.custom||{},d=o.getDataset(),c=d.data[i],h=o.chart.options.elements.point,f=o.index;e.extend(a,{_xScale:s,_yScale:l,_datasetIndex:f,_index:i,_model:{x:n?s.getPixelForDecimal(.5):s.getPixelForValue("object"==typeof c?c:NaN,i,f,o.chart.isCombo),y:n?l.getBasePixel():l.getPixelForValue(c,i,f),radius:n?0:u.radius?u.radius:o.getRadius(c),hitRadius:u.hitRadius?u.hitRadius:e.getValueAtIndexOrDefault(d.hitRadius,i,h.hitRadius)}}),t.DatasetController.prototype.removeHoverStyle.call(o,a,h);var g=a._model;g.skip=u.skip?u.skip:isNaN(g.x)||isNaN(g.y),a.pivot()},getRadius:function(t){return t.r||this.chart.options.elements.point.radius},setHoverStyle:function(a){var i=this;t.DatasetController.prototype.setHoverStyle.call(i,a);var n=i.chart.data.datasets[a._datasetIndex],o=a._index,r=a.custom||{},s=a._model;s.radius=r.hoverRadius?r.hoverRadius:e.getValueAtIndexOrDefault(n.hoverRadius,o,i.chart.options.elements.point.hoverRadius)+i.getRadius(n.data[o])},removeHoverStyle:function(e){var a=this;t.DatasetController.prototype.removeHoverStyle.call(a,e,a.chart.options.elements.point);var i=a.chart.data.datasets[e._datasetIndex].data[e._index],n=e.custom||{},o=e._model;o.radius=n.radius?n.radius:a.getRadius(i)}})}},{}],17:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a=t.defaults;a.doughnut={animation:{animateRotate:!0,animateScale:!1},aspectRatio:1,hover:{mode:"single"},legendCallback:function(t){var e=[];e.push('<ul class="'+t.id+'-legend">');var a=t.data,i=a.datasets,n=a.labels;if(i.length)for(var o=0;o<i[0].data.length;++o)e.push('<li><span style="background-color:'+i[0].backgroundColor[o]+'"></span>'),n[o]&&e.push(n[o]),e.push("</li>");return e.push("</ul>"),e.join("")},legend:{labels:{generateLabels:function(t){var a=t.data;return a.labels.length&&a.datasets.length?a.labels.map(function(i,n){var o=t.getDatasetMeta(0),r=a.datasets[0],s=o.data[n],l=s&&s.custom||{},u=e.getValueAtIndexOrDefault,d=t.options.elements.arc,c=l.backgroundColor?l.backgroundColor:u(r.backgroundColor,n,d.backgroundColor),h=l.borderColor?l.borderColor:u(r.borderColor,n,d.borderColor),f=l.borderWidth?l.borderWidth:u(r.borderWidth,n,d.borderWidth);return{text:i,fillStyle:c,strokeStyle:h,lineWidth:f,hidden:isNaN(r.data[n])||o.data[n].hidden,index:n}}):[]}},onClick:function(t,e){var a,i,n,o=e.index,r=this.chart;for(a=0,i=(r.data.datasets||[]).length;a<i;++a)n=r.getDatasetMeta(a),n.data[o]&&(n.data[o].hidden=!n.data[o].hidden);r.update()}},cutoutPercentage:50,rotation:Math.PI*-.5,circumference:2*Math.PI,tooltips:{callbacks:{title:function(){return""},label:function(t,a){var i=a.labels[t.index],n=": "+a.datasets[t.datasetIndex].data[t.index];return e.isArray(i)?(i=i.slice(),i[0]+=n):i+=n,i}}}},a.pie=e.clone(a.doughnut),e.extend(a.pie,{cutoutPercentage:0}),t.controllers.doughnut=t.controllers.pie=t.DatasetController.extend({dataElementType:t.elements.Arc,linkScales:e.noop,getRingIndex:function(t){for(var e=0,a=0;a<t;++a)this.chart.isDatasetVisible(a)&&++e;return e},update:function(t){var a=this,i=a.chart,n=i.chartArea,o=i.options,r=o.elements.arc,s=n.right-n.left-r.borderWidth,l=n.bottom-n.top-r.borderWidth,u=Math.min(s,l),d={x:0,y:0},c=a.getMeta(),h=o.cutoutPercentage,f=o.circumference;if(f<2*Math.PI){var g=o.rotation%(2*Math.PI);g+=2*Math.PI*(g>=Math.PI?-1:g<-Math.PI?1:0);var p=g+f,m={x:Math.cos(g),y:Math.sin(g)},v={x:Math.cos(p),y:Math.sin(p)},b=g<=0&&0<=p||g<=2*Math.PI&&2*Math.PI<=p,x=g<=.5*Math.PI&&.5*Math.PI<=p||g<=2.5*Math.PI&&2.5*Math.PI<=p,y=g<=-Math.PI&&-Math.PI<=p||g<=Math.PI&&Math.PI<=p,k=g<=.5*-Math.PI&&.5*-Math.PI<=p||g<=1.5*Math.PI&&1.5*Math.PI<=p,S=h/100,M={x:y?-1:Math.min(m.x*(m.x<0?1:S),v.x*(v.x<0?1:S)),y:k?-1:Math.min(m.y*(m.y<0?1:S),v.y*(v.y<0?1:S))},w={x:b?1:Math.max(m.x*(m.x>0?1:S),v.x*(v.x>0?1:S)),y:x?1:Math.max(m.y*(m.y>0?1:S),v.y*(v.y>0?1:S))},C={width:.5*(w.x-M.x),height:.5*(w.y-M.y)};u=Math.min(s/C.width,l/C.height),d={x:(w.x+M.x)*-.5,y:(w.y+M.y)*-.5}}i.borderWidth=a.getMaxBorderWidth(c.data),i.outerRadius=Math.max((u-i.borderWidth)/2,0),i.innerRadius=Math.max(h?i.outerRadius/100*h:0,0),i.radiusLength=(i.outerRadius-i.innerRadius)/i.getVisibleDatasetCount(),i.offsetX=d.x*i.outerRadius,i.offsetY=d.y*i.outerRadius,c.total=a.calculateTotal(),a.outerRadius=i.outerRadius-i.radiusLength*a.getRingIndex(a.index),a.innerRadius=Math.max(a.outerRadius-i.radiusLength,0),e.each(c.data,function(e,i){a.updateElement(e,i,t)})},updateElement:function(t,a,i){var n=this,o=n.chart,r=o.chartArea,s=o.options,l=s.animation,u=(r.left+r.right)/2,d=(r.top+r.bottom)/2,c=s.rotation,h=s.rotation,f=n.getDataset(),g=i&&l.animateRotate?0:t.hidden?0:n.calculateCircumference(f.data[a])*(s.circumference/(2*Math.PI)),p=i&&l.animateScale?0:n.innerRadius,m=i&&l.animateScale?0:n.outerRadius,v=e.getValueAtIndexOrDefault;e.extend(t,{_datasetIndex:n.index,_index:a,_model:{x:u+o.offsetX,y:d+o.offsetY,startAngle:c,endAngle:h,circumference:g,outerRadius:m,innerRadius:p,label:v(f.label,a,o.data.labels[a])}});var b=t._model;this.removeHoverStyle(t),i&&l.animateRotate||(0===a?b.startAngle=s.rotation:b.startAngle=n.getMeta().data[a-1]._model.endAngle,b.endAngle=b.startAngle+b.circumference),t.pivot()},removeHoverStyle:function(e){t.DatasetController.prototype.removeHoverStyle.call(this,e,this.chart.options.elements.arc)},calculateTotal:function(){var t,a=this.getDataset(),i=this.getMeta(),n=0;return e.each(i.data,function(e,i){t=a.data[i],isNaN(t)||e.hidden||(n+=Math.abs(t))}),n},calculateCircumference:function(t){var e=this.getMeta().total;return e>0&&!isNaN(t)?2*Math.PI*(t/e):0},getMaxBorderWidth:function(t){for(var e,a,i=0,n=this.index,o=t.length,r=0;r<o;r++)e=t[r]._model?t[r]._model.borderWidth:0,a=t[r]._chart?t[r]._chart.config.data.datasets[n].hoverBorderWidth:0,i=e>i?e:i,i=a>i?a:i;return i}})}},{}],18:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){return a.getValueOrDefault(t.showLine,e.showLines)}var a=t.helpers;t.defaults.line={showLines:!0,spanGaps:!1,hover:{mode:"label"},scales:{xAxes:[{type:"category",id:"x-axis-0"}],yAxes:[{type:"linear",id:"y-axis-0"}]}},t.controllers.line=t.DatasetController.extend({datasetElementType:t.elements.Line,dataElementType:t.elements.Point,update:function(t){var i,n,o,r=this,s=r.getMeta(),l=s.dataset,u=s.data||[],d=r.chart.options,c=d.elements.line,h=r.getScaleForId(s.yAxisID),f=r.getDataset(),g=e(f,d);for(g&&(o=l.custom||{},void 0!==f.tension&&void 0===f.lineTension&&(f.lineTension=f.tension),l._scale=h,l._datasetIndex=r.index,l._children=u,l._model={spanGaps:f.spanGaps?f.spanGaps:d.spanGaps,tension:o.tension?o.tension:a.getValueOrDefault(f.lineTension,c.tension),backgroundColor:o.backgroundColor?o.backgroundColor:f.backgroundColor||c.backgroundColor,borderWidth:o.borderWidth?o.borderWidth:f.borderWidth||c.borderWidth,borderColor:o.borderColor?o.borderColor:f.borderColor||c.borderColor,borderCapStyle:o.borderCapStyle?o.borderCapStyle:f.borderCapStyle||c.borderCapStyle,borderDash:o.borderDash?o.borderDash:f.borderDash||c.borderDash,borderDashOffset:o.borderDashOffset?o.borderDashOffset:f.borderDashOffset||c.borderDashOffset,borderJoinStyle:o.borderJoinStyle?o.borderJoinStyle:f.borderJoinStyle||c.borderJoinStyle,fill:o.fill?o.fill:void 0!==f.fill?f.fill:c.fill,steppedLine:o.steppedLine?o.steppedLine:a.getValueOrDefault(f.steppedLine,c.stepped),cubicInterpolationMode:o.cubicInterpolationMode?o.cubicInterpolationMode:a.getValueOrDefault(f.cubicInterpolationMode,c.cubicInterpolationMode),scaleTop:h.top,scaleBottom:h.bottom,scaleZero:h.getBasePixel()},l.pivot()),i=0,n=u.length;i<n;++i)r.updateElement(u[i],i,t);for(g&&0!==l._model.tension&&r.updateBezierControlPoints(),i=0,n=u.length;i<n;++i)u[i].pivot()},getPointBackgroundColor:function(t,e){var i=this.chart.options.elements.point.backgroundColor,n=this.getDataset(),o=t.custom||{};return o.backgroundColor?i=o.backgroundColor:n.pointBackgroundColor?i=a.getValueAtIndexOrDefault(n.pointBackgroundColor,e,i):n.backgroundColor&&(i=n.backgroundColor),i},getPointBorderColor:function(t,e){var i=this.chart.options.elements.point.borderColor,n=this.getDataset(),o=t.custom||{};return o.borderColor?i=o.borderColor:n.pointBorderColor?i=a.getValueAtIndexOrDefault(n.pointBorderColor,e,i):n.borderColor&&(i=n.borderColor),i},getPointBorderWidth:function(t,e){var i=this.chart.options.elements.point.borderWidth,n=this.getDataset(),o=t.custom||{};return isNaN(o.borderWidth)?isNaN(n.pointBorderWidth)?isNaN(n.borderWidth)||(i=n.borderWidth):i=a.getValueAtIndexOrDefault(n.pointBorderWidth,e,i):i=o.borderWidth,i},updateElement:function(t,e,i){var n,o,r=this,s=r.getMeta(),l=t.custom||{},u=r.getDataset(),d=r.index,c=u.data[e],h=r.getScaleForId(s.yAxisID),f=r.getScaleForId(s.xAxisID),g=r.chart.options.elements.point,p=r.chart.data.labels||[],m=1===p.length||1===u.data.length||r.chart.isCombo;void 0!==u.radius&&void 0===u.pointRadius&&(u.pointRadius=u.radius),void 0!==u.hitRadius&&void 0===u.pointHitRadius&&(u.pointHitRadius=u.hitRadius),n=f.getPixelForValue("object"==typeof c?c:NaN,e,d,m),o=i?h.getBasePixel():r.calculatePointY(c,e,d),t._xScale=f,t._yScale=h,t._datasetIndex=d,t._index=e,t._model={x:n,y:o,skip:l.skip||isNaN(n)||isNaN(o),radius:l.radius||a.getValueAtIndexOrDefault(u.pointRadius,e,g.radius),pointStyle:l.pointStyle||a.getValueAtIndexOrDefault(u.pointStyle,e,g.pointStyle),backgroundColor:r.getPointBackgroundColor(t,e),borderColor:r.getPointBorderColor(t,e),borderWidth:r.getPointBorderWidth(t,e),tension:s.dataset._model?s.dataset._model.tension:0,steppedLine:!!s.dataset._model&&s.dataset._model.steppedLine,hitRadius:l.hitRadius||a.getValueAtIndexOrDefault(u.pointHitRadius,e,g.hitRadius)}},calculatePointY:function(t,e,a){var i,n,o,r=this,s=r.chart,l=r.getMeta(),u=r.getScaleForId(l.yAxisID),d=0,c=0;if(u.options.stacked){for(i=0;i<a;i++)if(n=s.data.datasets[i],o=s.getDatasetMeta(i),"line"===o.type&&o.yAxisID===u.id&&s.isDatasetVisible(i)){var h=Number(u.getRightValue(n.data[e]));h<0?c+=h||0:d+=h||0}var f=Number(u.getRightValue(t));return f<0?u.getPixelForValue(c+f):u.getPixelForValue(d+f)}return u.getPixelForValue(t)},updateBezierControlPoints:function(){function t(t,e,a){return Math.max(Math.min(t,a),e)}var e,i,n,o,r,s=this,l=s.getMeta(),u=s.chart.chartArea,d=l.data||[];if(l.dataset._model.spanGaps&&(d=d.filter(function(t){return!t._model.skip})),"monotone"===l.dataset._model.cubicInterpolationMode)a.splineCurveMonotone(d);else for(e=0,i=d.length;e<i;++e)n=d[e],o=n._model,r=a.splineCurve(a.previousItem(d,e)._model,o,a.nextItem(d,e)._model,l.dataset._model.tension),o.controlPointPreviousX=r.previous.x,o.controlPointPreviousY=r.previous.y,o.controlPointNextX=r.next.x,o.controlPointNextY=r.next.y;if(s.chart.options.elements.line.capBezierPoints)for(e=0,i=d.length;e<i;++e)o=d[e]._model,o.controlPointPreviousX=t(o.controlPointPreviousX,u.left,u.right),o.controlPointPreviousY=t(o.controlPointPreviousY,u.top,u.bottom),o.controlPointNextX=t(o.controlPointNextX,u.left,u.right),o.controlPointNextY=t(o.controlPointNextY,u.top,u.bottom)},draw:function(a){var i,n,o=this,r=o.getMeta(),s=r.data||[],l=a||1;for(i=0,n=s.length;i<n;++i)s[i].transition(l);for(t.canvasHelpers.clipArea(o.chart.chart.ctx,o.chart.chartArea),e(o.getDataset(),o.chart.options)&&r.dataset.transition(l).draw(),t.canvasHelpers.unclipArea(o.chart.chart.ctx),i=0,n=s.length;i<n;++i)s[i].draw(o.chart.chartArea)},setHoverStyle:function(t){var e=this.chart.data.datasets[t._datasetIndex],i=t._index,n=t.custom||{},o=t._model;o.radius=n.hoverRadius||a.getValueAtIndexOrDefault(e.pointHoverRadius,i,this.chart.options.elements.point.hoverRadius),o.backgroundColor=n.hoverBackgroundColor||a.getValueAtIndexOrDefault(e.pointHoverBackgroundColor,i,a.getHoverColor(o.backgroundColor)),o.borderColor=n.hoverBorderColor||a.getValueAtIndexOrDefault(e.pointHoverBorderColor,i,a.getHoverColor(o.borderColor)),o.borderWidth=n.hoverBorderWidth||a.getValueAtIndexOrDefault(e.pointHoverBorderWidth,i,o.borderWidth)},removeHoverStyle:function(t){var e=this,i=e.chart.data.datasets[t._datasetIndex],n=t._index,o=t.custom||{},r=t._model;void 0!==i.radius&&void 0===i.pointRadius&&(i.pointRadius=i.radius),r.radius=o.radius||a.getValueAtIndexOrDefault(i.pointRadius,n,e.chart.options.elements.point.radius),r.backgroundColor=e.getPointBackgroundColor(t,n),r.borderColor=e.getPointBorderColor(t,n),r.borderWidth=e.getPointBorderWidth(t,n)}})}},{}],19:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.polarArea={scale:{type:"radialLinear",lineArc:!0,ticks:{beginAtZero:!0}},animation:{animateRotate:!0,animateScale:!0},startAngle:-.5*Math.PI,aspectRatio:1,legendCallback:function(t){var e=[];e.push('<ul class="'+t.id+'-legend">');var a=t.data,i=a.datasets,n=a.labels;if(i.length)for(var o=0;o<i[0].data.length;++o)e.push('<li><span style="background-color:'+i[0].backgroundColor[o]+'"></span>'),n[o]&&e.push(n[o]),e.push("</li>");return e.push("</ul>"),e.join("")},legend:{labels:{generateLabels:function(t){var a=t.data;return a.labels.length&&a.datasets.length?a.labels.map(function(i,n){var o=t.getDatasetMeta(0),r=a.datasets[0],s=o.data[n],l=s.custom||{},u=e.getValueAtIndexOrDefault,d=t.options.elements.arc,c=l.backgroundColor?l.backgroundColor:u(r.backgroundColor,n,d.backgroundColor),h=l.borderColor?l.borderColor:u(r.borderColor,n,d.borderColor),f=l.borderWidth?l.borderWidth:u(r.borderWidth,n,d.borderWidth);return{text:i,fillStyle:c,strokeStyle:h,lineWidth:f,hidden:isNaN(r.data[n])||o.data[n].hidden,index:n}}):[]}},onClick:function(t,e){var a,i,n,o=e.index,r=this.chart;for(a=0,i=(r.data.datasets||[]).length;a<i;++a)n=r.getDatasetMeta(a),n.data[o].hidden=!n.data[o].hidden;r.update()}},tooltips:{callbacks:{title:function(){return""},label:function(t,e){return e.labels[t.index]+": "+t.yLabel}}}},t.controllers.polarArea=t.DatasetController.extend({dataElementType:t.elements.Arc,linkScales:e.noop,update:function(t){var a=this,i=a.chart,n=i.chartArea,o=a.getMeta(),r=i.options,s=r.elements.arc,l=Math.min(n.right-n.left,n.bottom-n.top);i.outerRadius=Math.max((l-s.borderWidth/2)/2,0),i.innerRadius=Math.max(r.cutoutPercentage?i.outerRadius/100*r.cutoutPercentage:1,0),i.radiusLength=(i.outerRadius-i.innerRadius)/i.getVisibleDatasetCount(),a.outerRadius=i.outerRadius-i.radiusLength*a.index,a.innerRadius=a.outerRadius-i.radiusLength,o.count=a.countVisibleElements(),e.each(o.data,function(e,i){a.updateElement(e,i,t)})},updateElement:function(t,a,i){for(var n=this,o=n.chart,r=n.getDataset(),s=o.options,l=s.animation,u=o.scale,d=e.getValueAtIndexOrDefault,c=o.data.labels,h=n.calculateCircumference(r.data[a]),f=u.xCenter,g=u.yCenter,p=0,m=n.getMeta(),v=0;v<a;++v)isNaN(r.data[v])||m.data[v].hidden||++p;var b=s.startAngle,x=t.hidden?0:u.getDistanceFromCenterForValue(r.data[a]),y=b+h*p,k=y+(t.hidden?0:h),S=l.animateScale?0:u.getDistanceFromCenterForValue(r.data[a]);e.extend(t,{_datasetIndex:n.index,_index:a,_scale:u,_model:{x:f,y:g,innerRadius:0,outerRadius:i?S:x,startAngle:i&&l.animateRotate?b:y,endAngle:i&&l.animateRotate?b:k,label:d(c,a,c[a])}}),n.removeHoverStyle(t),t.pivot()},removeHoverStyle:function(e){t.DatasetController.prototype.removeHoverStyle.call(this,e,this.chart.options.elements.arc)},countVisibleElements:function(){var t=this.getDataset(),a=this.getMeta(),i=0;return e.each(a.data,function(e,a){isNaN(t.data[a])||e.hidden||i++}),i},calculateCircumference:function(t){var e=this.getMeta().count;return e>0&&!isNaN(t)?2*Math.PI/e:0}})}},{}],20:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.radar={aspectRatio:1,scale:{type:"radialLinear"},elements:{line:{tension:0}}},t.controllers.radar=t.DatasetController.extend({datasetElementType:t.elements.Line,dataElementType:t.elements.Point,linkScales:e.noop,update:function(t){var a=this,i=a.getMeta(),n=i.dataset,o=i.data,r=n.custom||{},s=a.getDataset(),l=a.chart.options.elements.line,u=a.chart.scale;void 0!==s.tension&&void 0===s.lineTension&&(s.lineTension=s.tension),e.extend(i.dataset,{_datasetIndex:a.index,_children:o,_loop:!0,_model:{tension:r.tension?r.tension:e.getValueOrDefault(s.lineTension,l.tension),backgroundColor:r.backgroundColor?r.backgroundColor:s.backgroundColor||l.backgroundColor,borderWidth:r.borderWidth?r.borderWidth:s.borderWidth||l.borderWidth,borderColor:r.borderColor?r.borderColor:s.borderColor||l.borderColor,fill:r.fill?r.fill:void 0!==s.fill?s.fill:l.fill,borderCapStyle:r.borderCapStyle?r.borderCapStyle:s.borderCapStyle||l.borderCapStyle,borderDash:r.borderDash?r.borderDash:s.borderDash||l.borderDash,borderDashOffset:r.borderDashOffset?r.borderDashOffset:s.borderDashOffset||l.borderDashOffset,borderJoinStyle:r.borderJoinStyle?r.borderJoinStyle:s.borderJoinStyle||l.borderJoinStyle,scaleTop:u.top,scaleBottom:u.bottom,scaleZero:u.getBasePosition()}}),i.dataset.pivot(),e.each(o,function(e,i){a.updateElement(e,i,t)},a),a.updateBezierControlPoints()},updateElement:function(t,a,i){var n=this,o=t.custom||{},r=n.getDataset(),s=n.chart.scale,l=n.chart.options.elements.point,u=s.getPointPositionForValue(a,r.data[a]);e.extend(t,{_datasetIndex:n.index,_index:a,_scale:s,_model:{x:i?s.xCenter:u.x,y:i?s.yCenter:u.y,tension:o.tension?o.tension:e.getValueOrDefault(r.lineTension,n.chart.options.elements.line.tension),radius:o.radius?o.radius:e.getValueAtIndexOrDefault(r.pointRadius,a,l.radius),backgroundColor:o.backgroundColor?o.backgroundColor:e.getValueAtIndexOrDefault(r.pointBackgroundColor,a,l.backgroundColor),borderColor:o.borderColor?o.borderColor:e.getValueAtIndexOrDefault(r.pointBorderColor,a,l.borderColor),borderWidth:o.borderWidth?o.borderWidth:e.getValueAtIndexOrDefault(r.pointBorderWidth,a,l.borderWidth),pointStyle:o.pointStyle?o.pointStyle:e.getValueAtIndexOrDefault(r.pointStyle,a,l.pointStyle),hitRadius:o.hitRadius?o.hitRadius:e.getValueAtIndexOrDefault(r.hitRadius,a,l.hitRadius)}}),t._model.skip=o.skip?o.skip:isNaN(t._model.x)||isNaN(t._model.y)},updateBezierControlPoints:function(){var t=this.chart.chartArea,a=this.getMeta();e.each(a.data,function(i,n){var o=i._model,r=e.splineCurve(e.previousItem(a.data,n,!0)._model,o,e.nextItem(a.data,n,!0)._model,o.tension);o.controlPointPreviousX=Math.max(Math.min(r.previous.x,t.right),t.left),o.controlPointPreviousY=Math.max(Math.min(r.previous.y,t.bottom),t.top),o.controlPointNextX=Math.max(Math.min(r.next.x,t.right),t.left),o.controlPointNextY=Math.max(Math.min(r.next.y,t.bottom),t.top),i.pivot()})},draw:function(t){var a=this.getMeta(),i=t||1;e.each(a.data,function(t){t.transition(i)}),a.dataset.transition(i).draw(),e.each(a.data,function(t){t.draw()})},setHoverStyle:function(t){var a=this.chart.data.datasets[t._datasetIndex],i=t.custom||{},n=t._index,o=t._model;o.radius=i.hoverRadius?i.hoverRadius:e.getValueAtIndexOrDefault(a.pointHoverRadius,n,this.chart.options.elements.point.hoverRadius),o.backgroundColor=i.hoverBackgroundColor?i.hoverBackgroundColor:e.getValueAtIndexOrDefault(a.pointHoverBackgroundColor,n,e.getHoverColor(o.backgroundColor)),o.borderColor=i.hoverBorderColor?i.hoverBorderColor:e.getValueAtIndexOrDefault(a.pointHoverBorderColor,n,e.getHoverColor(o.borderColor)),o.borderWidth=i.hoverBorderWidth?i.hoverBorderWidth:e.getValueAtIndexOrDefault(a.pointHoverBorderWidth,n,o.borderWidth)},removeHoverStyle:function(t){var a=this.chart.data.datasets[t._datasetIndex],i=t.custom||{},n=t._index,o=t._model,r=this.chart.options.elements.point;o.radius=i.radius?i.radius:e.getValueAtIndexOrDefault(a.radius,n,r.radius),o.backgroundColor=i.backgroundColor?i.backgroundColor:e.getValueAtIndexOrDefault(a.pointBackgroundColor,n,r.backgroundColor),o.borderColor=i.borderColor?i.borderColor:e.getValueAtIndexOrDefault(a.pointBorderColor,n,r.borderColor),o.borderWidth=i.borderWidth?i.borderWidth:e.getValueAtIndexOrDefault(a.pointBorderWidth,n,r.borderWidth)}})}},{}],21:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.global.animation={duration:1e3,easing:"easeOutQuart",onProgress:e.noop,onComplete:e.noop},t.Animation=t.Element.extend({currentStep:null,numSteps:60,easing:"",render:null,onAnimationProgress:null,onAnimationComplete:null}),t.animationService={frameDuration:17,animations:[],dropFrames:0,request:null,addAnimation:function(t,e,a,i){var n=this;i||(t.animating=!0);for(var o=0;o<n.animations.length;++o)if(n.animations[o].chartInstance===t)return void(n.animations[o].animationObject=e);n.animations.push({chartInstance:t,animationObject:e}),1===n.animations.length&&n.requestAnimationFrame()},cancelAnimation:function(t){var a=e.findIndex(this.animations,function(e){return e.chartInstance===t});a!==-1&&(this.animations.splice(a,1),t.animating=!1)},requestAnimationFrame:function(){var t=this;null===t.request&&(t.request=e.requestAnimFrame.call(window,function(){t.request=null,t.startDigest()}))},startDigest:function(){var t=this,e=Date.now(),a=0;t.dropFrames>1&&(a=Math.floor(t.dropFrames),t.dropFrames=t.dropFrames%1);for(var i=0;i<t.animations.length;)null===t.animations[i].animationObject.currentStep&&(t.animations[i].animationObject.currentStep=0),t.animations[i].animationObject.currentStep+=1+a,t.animations[i].animationObject.currentStep>t.animations[i].animationObject.numSteps&&(t.animations[i].animationObject.currentStep=t.animations[i].animationObject.numSteps),t.animations[i].animationObject.render(t.animations[i].chartInstance,t.animations[i].animationObject),t.animations[i].animationObject.onAnimationProgress&&t.animations[i].animationObject.onAnimationProgress.call&&t.animations[i].animationObject.onAnimationProgress.call(t.animations[i].chartInstance,t.animations[i]),t.animations[i].animationObject.currentStep===t.animations[i].animationObject.numSteps?(t.animations[i].animationObject.onAnimationComplete&&t.animations[i].animationObject.onAnimationComplete.call&&t.animations[i].animationObject.onAnimationComplete.call(t.animations[i].chartInstance,t.animations[i]),t.animations[i].chartInstance.animating=!1,t.animations.splice(i,1)):++i;var n=Date.now(),o=(n-e)/t.frameDuration;t.dropFrames+=o,t.animations.length>0&&t.requestAnimationFrame()}}}},{}],22:[function(t,e,a){"use strict";e.exports=function(t){var e=t.canvasHelpers={};e.drawPoint=function(e,a,i,n,o){var r,s,l,u,d,c;if("object"==typeof a&&(r=a.toString(),"[object HTMLImageElement]"===r||"[object HTMLCanvasElement]"===r))return void e.drawImage(a,n-a.width/2,o-a.height/2);if(!(isNaN(i)||i<=0)){switch(a){default:e.beginPath(),e.arc(n,o,i,0,2*Math.PI),e.closePath(),e.fill();break;case"triangle":e.beginPath(),s=3*i/Math.sqrt(3),d=s*Math.sqrt(3)/2,e.moveTo(n-s/2,o+d/3),e.lineTo(n+s/2,o+d/3),e.lineTo(n,o-2*d/3),e.closePath(),e.fill();break;case"rect":c=1/Math.SQRT2*i,e.beginPath(),e.fillRect(n-c,o-c,2*c,2*c),e.strokeRect(n-c,o-c,2*c,2*c);break;case"rectRounded":var h=i/Math.SQRT2,f=n-h,g=o-h,p=Math.SQRT2*i;t.helpers.drawRoundedRectangle(e,f,g,p,p,i/2),e.fill();break;case"rectRot":c=1/Math.SQRT2*i,e.beginPath(),e.moveTo(n-c,o),e.lineTo(n,o+c),e.lineTo(n+c,o),e.lineTo(n,o-c),e.closePath(),e.fill();break;case"cross":e.beginPath(),e.moveTo(n,o+i),e.lineTo(n,o-i),e.moveTo(n-i,o),e.lineTo(n+i,o),e.closePath();break;case"crossRot":e.beginPath(),l=Math.cos(Math.PI/4)*i,u=Math.sin(Math.PI/4)*i,e.moveTo(n-l,o-u),e.lineTo(n+l,o+u),e.moveTo(n-l,o+u),e.lineTo(n+l,o-u),e.closePath();break;case"star":e.beginPath(),e.moveTo(n,o+i),e.lineTo(n,o-i),e.moveTo(n-i,o),e.lineTo(n+i,o),l=Math.cos(Math.PI/4)*i,u=Math.sin(Math.PI/4)*i,e.moveTo(n-l,o-u),e.lineTo(n+l,o+u),e.moveTo(n-l,o+u),e.lineTo(n+l,o-u),e.closePath();break;case"line":e.beginPath(),e.moveTo(n-i,o),e.lineTo(n+i,o),e.closePath();break;case"dash":e.beginPath(),e.moveTo(n,o),e.lineTo(n+i,o),e.closePath()}e.stroke()}},e.clipArea=function(t,e){t.save(),t.beginPath(),t.rect(e.left,e.top,e.right-e.left,e.bottom-e.top),t.clip()},e.unclipArea=function(t){t.restore()}}},{}],23:[function(t,e,a){"use strict";e.exports=function(t){function e(e){e=e||{};var a=e.data=e.data||{};return a.datasets=a.datasets||[],a.labels=a.labels||[],e.options=i.configMerge(t.defaults.global,t.defaults[e.type],e.options||{}),e}function a(t){var e=t.options;e.scale?t.scale.options=e.scale:e.scales&&e.scales.xAxes.concat(e.scales.yAxes).forEach(function(e){t.scales[e.id].options=e}),t.tooltip._options=e.tooltips}var i=t.helpers,n=t.plugins,o=t.platform;t.types={},t.instances={},t.controllers={},t.Controller=function(a,n,r){var s=this;n=e(n);var l=o.acquireContext(a,n),u=l&&l.canvas,d=u&&u.height,c=u&&u.width;return r.ctx=l,r.canvas=u,r.config=n,r.width=c,r.height=d,r.aspectRatio=d?c/d:null,s.id=i.uid(),s.chart=r,s.config=n,s.options=n.options,s._bufferedRender=!1,t.instances[s.id]=s,Object.defineProperty(s,"data",{get:function(){return s.config.data}}),l&&u?(s.initialize(),s.update(),s):(console.error("Failed to create chart: can't acquire context from the given item"),s)},i.extend(t.Controller.prototype,{initialize:function(){var t=this;return n.notify(t,"beforeInit"),i.retinaScale(t.chart),t.bindEvents(),t.options.responsive&&t.resize(!0),t.ensureScalesHaveIDs(),t.buildScales(),t.initToolTip(),n.notify(t,"afterInit"),t},clear:function(){return i.clear(this.chart),this},stop:function(){return t.animationService.cancelAnimation(this),this},resize:function(t){var e=this,a=e.chart,o=e.options,r=a.canvas,s=o.maintainAspectRatio&&a.aspectRatio||null,l=Math.floor(i.getMaximumWidth(r)),u=Math.floor(s?l/s:i.getMaximumHeight(r));if((a.width!==l||a.height!==u)&&(r.width=a.width=l,r.height=a.height=u,r.style.width=l+"px",r.style.height=u+"px",i.retinaScale(a),!t)){var d={width:l,height:u};n.notify(e,"resize",[d]),e.options.onResize&&e.options.onResize(e,d),e.stop(),e.update(e.options.responsiveAnimationDuration)}},ensureScalesHaveIDs:function(){var t=this.options,e=t.scales||{},a=t.scale;i.each(e.xAxes,function(t,e){t.id=t.id||"x-axis-"+e}),i.each(e.yAxes,function(t,e){t.id=t.id||"y-axis-"+e}),a&&(a.id=a.id||"scale")},buildScales:function(){var e=this,a=e.options,n=e.scales={},o=[];a.scales&&(o=o.concat((a.scales.xAxes||[]).map(function(t){return{options:t,dtype:"category"}}),(a.scales.yAxes||[]).map(function(t){return{options:t,dtype:"linear"}}))),a.scale&&o.push({options:a.scale,dtype:"radialLinear",isDefault:!0}),i.each(o,function(a){var o=a.options,r=i.getValueOrDefault(o.type,a.dtype),s=t.scaleService.getScaleConstructor(r);if(s){var l=new s({id:o.id,options:o,ctx:e.chart.ctx,chart:e});n[l.id]=l,a.isDefault&&(e.scale=l)}}),t.scaleService.addScalesToLayout(this)},buildOrUpdateControllers:function(){var e=this,a=[],n=[];if(i.each(e.data.datasets,function(i,o){var r=e.getDatasetMeta(o);r.type||(r.type=i.type||e.config.type),a.push(r.type),r.controller?r.controller.updateIndex(o):(r.controller=new t.controllers[r.type](e,o),n.push(r.controller))},e),a.length>1)for(var o=1;o<a.length;o++)if(a[o]!==a[o-1]){e.isCombo=!0;break}return n},resetElements:function(){var t=this;i.each(t.data.datasets,function(e,a){t.getDatasetMeta(a).controller.reset()},t)},reset:function(){this.resetElements(),this.tooltip.initialize()},update:function(t,e){var o=this;if(a(o),n.notify(o,"beforeUpdate")!==!1){o.tooltip._data=o.data;var r=o.buildOrUpdateControllers();i.each(o.data.datasets,function(t,e){o.getDatasetMeta(e).controller.buildOrUpdateElements()},o),o.updateLayout(),i.each(r,function(t){t.reset()}),o.updateDatasets(),n.notify(o,"afterUpdate"),o._bufferedRender?o._bufferedRequest={lazy:e,duration:t}:o.render(t,e)}},updateLayout:function(){var e=this;n.notify(e,"beforeLayout")!==!1&&(t.layoutService.update(this,this.chart.width,this.chart.height),n.notify(e,"afterScaleUpdate"),n.notify(e,"afterLayout"))},updateDatasets:function(){var t=this;if(n.notify(t,"beforeDatasetsUpdate")!==!1){for(var e=0,a=t.data.datasets.length;e<a;++e)t.getDatasetMeta(e).controller.update();n.notify(t,"afterDatasetsUpdate")}},render:function(e,a){var o=this;if(n.notify(o,"beforeRender")!==!1){var r=o.options.animation,s=function(){n.notify(o,"afterRender");var t=r&&r.onComplete;t&&t.call&&t.call(o)};if(r&&("undefined"!=typeof e&&0!==e||"undefined"==typeof e&&0!==r.duration)){var l=new t.Animation;l.numSteps=(e||r.duration)/16.66,l.easing=r.easing,l.render=function(t,e){var a=i.easingEffects[e.easing],n=e.currentStep/e.numSteps,o=a(n);t.draw(o,n,e.currentStep)},l.onAnimationProgress=r.onProgress,l.onAnimationComplete=s,t.animationService.addAnimation(o,l,e,a)}else o.draw(),s();return o}},draw:function(t){var e=this;e.clear(),void 0!==t&&null!==t||(t=1),n.notify(e,"beforeDraw",[t])!==!1&&(i.each(e.boxes,function(t){t.draw(e.chartArea)},e),e.scale&&e.scale.draw(),e.drawDatasets(t),e.tooltip.transition(t).draw(),n.notify(e,"afterDraw",[t]))},drawDatasets:function(t){var e=this;n.notify(e,"beforeDatasetsDraw",[t])!==!1&&(i.each(e.data.datasets,function(a,i){e.isDatasetVisible(i)&&e.getDatasetMeta(i).controller.draw(t)},e,!0),n.notify(e,"afterDatasetsDraw",[t]))},getElementAtEvent:function(e){return t.Interaction.modes.single(this,e)},getElementsAtEvent:function(e){return t.Interaction.modes.label(this,e,{intersect:!0})},getElementsAtXAxis:function(e){return t.Interaction.modes["x-axis"](this,e,{intersect:!0})},getElementsAtEventForMode:function(e,a,i){
var n=t.Interaction.modes[a];return"function"==typeof n?n(this,e,i):[]},getDatasetAtEvent:function(e){return t.Interaction.modes.dataset(this,e,{intersect:!0})},getDatasetMeta:function(t){var e=this,a=e.data.datasets[t];a._meta||(a._meta={});var i=a._meta[e.id];return i||(i=a._meta[e.id]={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null}),i},getVisibleDatasetCount:function(){for(var t=0,e=0,a=this.data.datasets.length;e<a;++e)this.isDatasetVisible(e)&&t++;return t},isDatasetVisible:function(t){var e=this.getDatasetMeta(t);return"boolean"==typeof e.hidden?!e.hidden:!this.data.datasets[t].hidden},generateLegend:function(){return this.options.legendCallback(this)},destroy:function(){var e,a,r,s=this,l=s.chart.canvas;for(s.stop(),a=0,r=s.data.datasets.length;a<r;++a)e=s.getDatasetMeta(a),e.controller&&(e.controller.destroy(),e.controller=null);l&&(s.unbindEvents(),i.clear(s.chart),o.releaseContext(s.chart.ctx),s.chart.canvas=null,s.chart.ctx=null),n.notify(s,"destroy"),delete t.instances[s.id]},toBase64Image:function(){return this.chart.canvas.toDataURL.apply(this.chart.canvas,arguments)},initToolTip:function(){var e=this;e.tooltip=new t.Tooltip({_chart:e.chart,_chartInstance:e,_data:e.data,_options:e.options.tooltips},e),e.tooltip.initialize()},bindEvents:function(){var t=this,e=t._listeners={},a=function(){t.eventHandler.apply(t,arguments)};i.each(t.options.events,function(i){o.addEventListener(t,i,a),e[i]=a}),t.options.responsive&&(a=function(){t.resize()},o.addEventListener(t,"resize",a),e.resize=a)},unbindEvents:function(){var t=this,e=t._listeners;e&&(delete t._listeners,i.each(e,function(e,a){o.removeEventListener(t,a,e)}))},updateHoverStyle:function(t,e,a){var i,n,o,r=a?"setHoverStyle":"removeHoverStyle";for(n=0,o=t.length;n<o;++n)i=t[n],i&&this.getDatasetMeta(i._datasetIndex).controller[r](i)},eventHandler:function(t){var e=this,a=e.tooltip;if(n.notify(e,"beforeEvent",[t])!==!1){e._bufferedRender=!0,e._bufferedRequest=null;var i=e.handleEvent(t);i|=a&&a.handleEvent(t),n.notify(e,"afterEvent",[t]);var o=e._bufferedRequest;return o?e.render(o.duration,o.lazy):i&&!e.animating&&(e.stop(),e.render(e.options.hover.animationDuration,!0)),e._bufferedRender=!1,e._bufferedRequest=null,e}},handleEvent:function(t){var e=this,a=e.options||{},n=a.hover,o=!1;return e.lastActive=e.lastActive||[],"mouseout"===t.type?e.active=[]:e.active=e.getElementsAtEventForMode(t,n.mode,n),n.onHover&&n.onHover.call(e,t.native,e.active),"mouseup"!==t.type&&"click"!==t.type||a.onClick&&a.onClick.call(e,t.native,e.active),e.lastActive.length&&e.updateHoverStyle(e.lastActive,n.mode,!1),e.active.length&&n.mode&&e.updateHoverStyle(e.active,n.mode,!0),o=!i.arrayEquals(e.active,e.lastActive),e.lastActive=e.active,o}})}},{}],24:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){return t._chartjs?void t._chartjs.listeners.push(e):(Object.defineProperty(t,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[e]}}),void n.forEach(function(e){var a="onData"+e.charAt(0).toUpperCase()+e.slice(1),n=t[e];Object.defineProperty(t,e,{configurable:!0,enumerable:!1,value:function(){var e=Array.prototype.slice.call(arguments),o=n.apply(this,e);return i.each(t._chartjs.listeners,function(t){"function"==typeof t[a]&&t[a].apply(t,e)}),o}})}))}function a(t,e){var a=t._chartjs;if(a){var i=a.listeners,o=i.indexOf(e);o!==-1&&i.splice(o,1),i.length>0||(n.forEach(function(e){delete t[e]}),delete t._chartjs)}}var i=t.helpers,n=["push","pop","shift","splice","unshift"];t.DatasetController=function(t,e){this.initialize(t,e)},i.extend(t.DatasetController.prototype,{datasetElementType:null,dataElementType:null,initialize:function(t,e){var a=this;a.chart=t,a.index=e,a.linkScales(),a.addElements()},updateIndex:function(t){this.index=t},linkScales:function(){var t=this,e=t.getMeta(),a=t.getDataset();null===e.xAxisID&&(e.xAxisID=a.xAxisID||t.chart.options.scales.xAxes[0].id),null===e.yAxisID&&(e.yAxisID=a.yAxisID||t.chart.options.scales.yAxes[0].id)},getDataset:function(){return this.chart.data.datasets[this.index]},getMeta:function(){return this.chart.getDatasetMeta(this.index)},getScaleForId:function(t){return this.chart.scales[t]},reset:function(){this.update(!0)},destroy:function(){this._data&&a(this._data,this)},createMetaDataset:function(){var t=this,e=t.datasetElementType;return e&&new e({_chart:t.chart.chart,_datasetIndex:t.index})},createMetaData:function(t){var e=this,a=e.dataElementType;return a&&new a({_chart:e.chart.chart,_datasetIndex:e.index,_index:t})},addElements:function(){var t,e,a=this,i=a.getMeta(),n=a.getDataset().data||[],o=i.data;for(t=0,e=n.length;t<e;++t)o[t]=o[t]||a.createMetaData(t);i.dataset=i.dataset||a.createMetaDataset()},addElementAndReset:function(t){var e=this.createMetaData(t);this.getMeta().data.splice(t,0,e),this.updateElement(e,t,!0)},buildOrUpdateElements:function(){var t=this,i=t.getDataset(),n=i.data||(i.data=[]);t._data!==n&&(t._data&&a(t._data,t),e(n,t),t._data=n),t.resyncElements()},update:i.noop,draw:function(t){var e,a,i=t||1,n=this.getMeta().data;for(e=0,a=n.length;e<a;++e)n[e].transition(i).draw()},removeHoverStyle:function(t,e){var a=this.chart.data.datasets[t._datasetIndex],n=t._index,o=t.custom||{},r=i.getValueAtIndexOrDefault,s=t._model;s.backgroundColor=o.backgroundColor?o.backgroundColor:r(a.backgroundColor,n,e.backgroundColor),s.borderColor=o.borderColor?o.borderColor:r(a.borderColor,n,e.borderColor),s.borderWidth=o.borderWidth?o.borderWidth:r(a.borderWidth,n,e.borderWidth)},setHoverStyle:function(t){var e=this.chart.data.datasets[t._datasetIndex],a=t._index,n=t.custom||{},o=i.getValueAtIndexOrDefault,r=i.getHoverColor,s=t._model;s.backgroundColor=n.hoverBackgroundColor?n.hoverBackgroundColor:o(e.hoverBackgroundColor,a,r(s.backgroundColor)),s.borderColor=n.hoverBorderColor?n.hoverBorderColor:o(e.hoverBorderColor,a,r(s.borderColor)),s.borderWidth=n.hoverBorderWidth?n.hoverBorderWidth:o(e.hoverBorderWidth,a,s.borderWidth)},resyncElements:function(){var t=this,e=t.getMeta(),a=t.getDataset().data,i=e.data.length,n=a.length;n<i?e.data.splice(n,i-n):n>i&&t.insertElements(i,n-i)},insertElements:function(t,e){for(var a=0;a<e;++a)this.addElementAndReset(t+a)},onDataPush:function(){this.insertElements(this.getDataset().data.length-1,arguments.length)},onDataPop:function(){this.getMeta().data.pop()},onDataShift:function(){this.getMeta().data.shift()},onDataSplice:function(t,e){this.getMeta().data.splice(t,e),this.insertElements(t,arguments.length-2)},onDataUnshift:function(){this.insertElements(0,arguments.length)}}),t.DatasetController.extend=i.inherits}},{}],25:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.elements={},t.Element=function(t){e.extend(this,t),this.initialize.apply(this,arguments)},e.extend(t.Element.prototype,{initialize:function(){this.hidden=!1},pivot:function(){var t=this;return t._view||(t._view=e.clone(t._model)),t._start=e.clone(t._view),t},transition:function(t){var a=this;return a._view||(a._view=e.clone(a._model)),1===t?(a._view=a._model,a._start=null,a):(a._start||a.pivot(),e.each(a._model,function(i,n){if("_"===n[0]);else if(a._view.hasOwnProperty(n))if(i===a._view[n]);else if("string"==typeof i)try{var o=e.color(a._model[n]).mix(e.color(a._start[n]),t);a._view[n]=o.rgbString()}catch(t){a._view[n]=i}else if("number"==typeof i){var r=void 0!==a._start[n]&&isNaN(a._start[n])===!1?a._start[n]:0;a._view[n]=(a._model[n]-r)*t+r}else a._view[n]=i;else"number"!=typeof i||isNaN(a._view[n])?a._view[n]=i:a._view[n]=i*t},a),a)},tooltipPosition:function(){return{x:this._model.x,y:this._model.y}},hasValue:function(){return e.isNumber(this._model.x)&&e.isNumber(this._model.y)}}),t.Element.extend=e.inherits}},{}],26:[function(t,e,a){"use strict";var i=t(3);e.exports=function(t){function e(t,e,a){var i;return"string"==typeof t?(i=parseInt(t,10),t.indexOf("%")!==-1&&(i=i/100*e.parentNode[a])):i=t,i}function a(t){return void 0!==t&&null!==t&&"none"!==t}function n(t,i,n){var o=document.defaultView,r=t.parentNode,s=o.getComputedStyle(t)[i],l=o.getComputedStyle(r)[i],u=a(s),d=a(l),c=Number.POSITIVE_INFINITY;return u||d?Math.min(u?e(s,t,n):c,d?e(l,r,n):c):"none"}var o=t.helpers={};o.each=function(t,e,a,i){var n,r;if(o.isArray(t))if(r=t.length,i)for(n=r-1;n>=0;n--)e.call(a,t[n],n);else for(n=0;n<r;n++)e.call(a,t[n],n);else if("object"==typeof t){var s=Object.keys(t);for(r=s.length,n=0;n<r;n++)e.call(a,t[s[n]],s[n])}},o.clone=function(t){var e={};return o.each(t,function(t,a){o.isArray(t)?e[a]=t.slice(0):"object"==typeof t&&null!==t?e[a]=o.clone(t):e[a]=t}),e},o.extend=function(t){for(var e=function(e,a){t[a]=e},a=1,i=arguments.length;a<i;a++)o.each(arguments[a],e);return t},o.configMerge=function(e){var a=o.clone(e);return o.each(Array.prototype.slice.call(arguments,1),function(e){o.each(e,function(e,i){var n=a.hasOwnProperty(i),r=n?a[i]:{};"scales"===i?a[i]=o.scaleMerge(r,e):"scale"===i?a[i]=o.configMerge(r,t.scaleService.getScaleDefaults(e.type),e):!n||"object"!=typeof r||o.isArray(r)||null===r||"object"!=typeof e||o.isArray(e)?a[i]=e:a[i]=o.configMerge(r,e)})}),a},o.scaleMerge=function(e,a){var i=o.clone(e);return o.each(a,function(e,a){"xAxes"===a||"yAxes"===a?i.hasOwnProperty(a)?o.each(e,function(e,n){var r=o.getValueOrDefault(e.type,"xAxes"===a?"category":"linear"),s=t.scaleService.getScaleDefaults(r);n>=i[a].length||!i[a][n].type?i[a].push(o.configMerge(s,e)):e.type&&e.type!==i[a][n].type?i[a][n]=o.configMerge(i[a][n],s,e):i[a][n]=o.configMerge(i[a][n],e)}):(i[a]=[],o.each(e,function(e){var n=o.getValueOrDefault(e.type,"xAxes"===a?"category":"linear");i[a].push(o.configMerge(t.scaleService.getScaleDefaults(n),e))})):i.hasOwnProperty(a)&&"object"==typeof i[a]&&null!==i[a]&&"object"==typeof e?i[a]=o.configMerge(i[a],e):i[a]=e}),i},o.getValueAtIndexOrDefault=function(t,e,a){return void 0===t||null===t?a:o.isArray(t)?e<t.length?t[e]:a:t},o.getValueOrDefault=function(t,e){return void 0===t?e:t},o.indexOf=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var a=0,i=t.length;a<i;++a)if(t[a]===e)return a;return-1},o.where=function(t,e){if(o.isArray(t)&&Array.prototype.filter)return t.filter(e);var a=[];return o.each(t,function(t){e(t)&&a.push(t)}),a},o.findIndex=Array.prototype.findIndex?function(t,e,a){return t.findIndex(e,a)}:function(t,e,a){a=void 0===a?t:a;for(var i=0,n=t.length;i<n;++i)if(e.call(a,t[i],i,t))return i;return-1},o.findNextWhere=function(t,e,a){void 0!==a&&null!==a||(a=-1);for(var i=a+1;i<t.length;i++){var n=t[i];if(e(n))return n}},o.findPreviousWhere=function(t,e,a){void 0!==a&&null!==a||(a=t.length);for(var i=a-1;i>=0;i--){var n=t[i];if(e(n))return n}},o.inherits=function(t){var e=this,a=t&&t.hasOwnProperty("constructor")?t.constructor:function(){return e.apply(this,arguments)},i=function(){this.constructor=a};return i.prototype=e.prototype,a.prototype=new i,a.extend=o.inherits,t&&o.extend(a.prototype,t),a.__super__=e.prototype,a},o.noop=function(){},o.uid=function(){var t=0;return function(){return t++}}(),o.isNumber=function(t){return!isNaN(parseFloat(t))&&isFinite(t)},o.almostEquals=function(t,e,a){return Math.abs(t-e)<a},o.almostWhole=function(t,e){var a=Math.round(t);return a-e<t&&a+e>t},o.max=function(t){return t.reduce(function(t,e){return isNaN(e)?t:Math.max(t,e)},Number.NEGATIVE_INFINITY)},o.min=function(t){return t.reduce(function(t,e){return isNaN(e)?t:Math.min(t,e)},Number.POSITIVE_INFINITY)},o.sign=Math.sign?function(t){return Math.sign(t)}:function(t){return t=+t,0===t||isNaN(t)?t:t>0?1:-1},o.log10=Math.log10?function(t){return Math.log10(t)}:function(t){return Math.log(t)/Math.LN10},o.toRadians=function(t){return t*(Math.PI/180)},o.toDegrees=function(t){return t*(180/Math.PI)},o.getAngleFromPoint=function(t,e){var a=e.x-t.x,i=e.y-t.y,n=Math.sqrt(a*a+i*i),o=Math.atan2(i,a);return o<-.5*Math.PI&&(o+=2*Math.PI),{angle:o,distance:n}},o.distanceBetweenPoints=function(t,e){return Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))},o.aliasPixel=function(t){return t%2===0?0:.5},o.splineCurve=function(t,e,a,i){var n=t.skip?e:t,o=e,r=a.skip?e:a,s=Math.sqrt(Math.pow(o.x-n.x,2)+Math.pow(o.y-n.y,2)),l=Math.sqrt(Math.pow(r.x-o.x,2)+Math.pow(r.y-o.y,2)),u=s/(s+l),d=l/(s+l);u=isNaN(u)?0:u,d=isNaN(d)?0:d;var c=i*u,h=i*d;return{previous:{x:o.x-c*(r.x-n.x),y:o.y-c*(r.y-n.y)},next:{x:o.x+h*(r.x-n.x),y:o.y+h*(r.y-n.y)}}},o.EPSILON=Number.EPSILON||1e-14,o.splineCurveMonotone=function(t){var e,a,i,n,r=(t||[]).map(function(t){return{model:t._model,deltaK:0,mK:0}}),s=r.length;for(e=0;e<s;++e)if(i=r[e],!i.model.skip){if(a=e>0?r[e-1]:null,n=e<s-1?r[e+1]:null,n&&!n.model.skip){var l=n.model.x-i.model.x;i.deltaK=0!==l?(n.model.y-i.model.y)/l:0}!a||a.model.skip?i.mK=i.deltaK:!n||n.model.skip?i.mK=a.deltaK:this.sign(a.deltaK)!==this.sign(i.deltaK)?i.mK=0:i.mK=(a.deltaK+i.deltaK)/2}var u,d,c,h;for(e=0;e<s-1;++e)i=r[e],n=r[e+1],i.model.skip||n.model.skip||(o.almostEquals(i.deltaK,0,this.EPSILON)?i.mK=n.mK=0:(u=i.mK/i.deltaK,d=n.mK/i.deltaK,h=Math.pow(u,2)+Math.pow(d,2),h<=9||(c=3/Math.sqrt(h),i.mK=u*c*i.deltaK,n.mK=d*c*i.deltaK)));var f;for(e=0;e<s;++e)i=r[e],i.model.skip||(a=e>0?r[e-1]:null,n=e<s-1?r[e+1]:null,a&&!a.model.skip&&(f=(i.model.x-a.model.x)/3,i.model.controlPointPreviousX=i.model.x-f,i.model.controlPointPreviousY=i.model.y-f*i.mK),n&&!n.model.skip&&(f=(n.model.x-i.model.x)/3,i.model.controlPointNextX=i.model.x+f,i.model.controlPointNextY=i.model.y+f*i.mK))},o.nextItem=function(t,e,a){return a?e>=t.length-1?t[0]:t[e+1]:e>=t.length-1?t[t.length-1]:t[e+1]},o.previousItem=function(t,e,a){return a?e<=0?t[t.length-1]:t[e-1]:e<=0?t[0]:t[e-1]},o.niceNum=function(t,e){var a,i=Math.floor(o.log10(t)),n=t/Math.pow(10,i);return a=e?n<1.5?1:n<3?2:n<7?5:10:n<=1?1:n<=2?2:n<=5?5:10,a*Math.pow(10,i)};var r=o.easingEffects={linear:function(t){return t},easeInQuad:function(t){return t*t},easeOutQuad:function(t){return-1*t*(t-2)},easeInOutQuad:function(t){return(t/=.5)<1?.5*t*t:-.5*(--t*(t-2)-1)},easeInCubic:function(t){return t*t*t},easeOutCubic:function(t){return 1*((t=t/1-1)*t*t+1)},easeInOutCubic:function(t){return(t/=.5)<1?.5*t*t*t:.5*((t-=2)*t*t+2)},easeInQuart:function(t){return t*t*t*t},easeOutQuart:function(t){return-1*((t=t/1-1)*t*t*t-1)},easeInOutQuart:function(t){return(t/=.5)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2)},easeInQuint:function(t){return 1*(t/=1)*t*t*t*t},easeOutQuint:function(t){return 1*((t=t/1-1)*t*t*t*t+1)},easeInOutQuint:function(t){return(t/=.5)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2)},easeInSine:function(t){return-1*Math.cos(t/1*(Math.PI/2))+1},easeOutSine:function(t){return 1*Math.sin(t/1*(Math.PI/2))},easeInOutSine:function(t){return-.5*(Math.cos(Math.PI*t/1)-1)},easeInExpo:function(t){return 0===t?1:1*Math.pow(2,10*(t/1-1))},easeOutExpo:function(t){return 1===t?1:1*(-Math.pow(2,-10*t/1)+1)},easeInOutExpo:function(t){return 0===t?0:1===t?1:(t/=.5)<1?.5*Math.pow(2,10*(t-1)):.5*(-Math.pow(2,-10*--t)+2)},easeInCirc:function(t){return t>=1?t:-1*(Math.sqrt(1-(t/=1)*t)-1)},easeOutCirc:function(t){return 1*Math.sqrt(1-(t=t/1-1)*t)},easeInOutCirc:function(t){return(t/=.5)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)},easeInElastic:function(t){var e=1.70158,a=0,i=1;return 0===t?0:1===(t/=1)?1:(a||(a=.3),i<Math.abs(1)?(i=1,e=a/4):e=a/(2*Math.PI)*Math.asin(1/i),-(i*Math.pow(2,10*(t-=1))*Math.sin((1*t-e)*(2*Math.PI)/a)))},easeOutElastic:function(t){var e=1.70158,a=0,i=1;return 0===t?0:1===(t/=1)?1:(a||(a=.3),i<Math.abs(1)?(i=1,e=a/4):e=a/(2*Math.PI)*Math.asin(1/i),i*Math.pow(2,-10*t)*Math.sin((1*t-e)*(2*Math.PI)/a)+1)},easeInOutElastic:function(t){var e=1.70158,a=0,i=1;return 0===t?0:2===(t/=.5)?1:(a||(a=1*(.3*1.5)),i<Math.abs(1)?(i=1,e=a/4):e=a/(2*Math.PI)*Math.asin(1/i),t<1?-.5*(i*Math.pow(2,10*(t-=1))*Math.sin((1*t-e)*(2*Math.PI)/a)):i*Math.pow(2,-10*(t-=1))*Math.sin((1*t-e)*(2*Math.PI)/a)*.5+1)},easeInBack:function(t){var e=1.70158;return 1*(t/=1)*t*((e+1)*t-e)},easeOutBack:function(t){var e=1.70158;return 1*((t=t/1-1)*t*((e+1)*t+e)+1)},easeInOutBack:function(t){var e=1.70158;return(t/=.5)<1?.5*(t*t*(((e*=1.525)+1)*t-e)):.5*((t-=2)*t*(((e*=1.525)+1)*t+e)+2)},easeInBounce:function(t){return 1-r.easeOutBounce(1-t)},easeOutBounce:function(t){return(t/=1)<1/2.75?1*(7.5625*t*t):t<2/2.75?1*(7.5625*(t-=1.5/2.75)*t+.75):t<2.5/2.75?1*(7.5625*(t-=2.25/2.75)*t+.9375):1*(7.5625*(t-=2.625/2.75)*t+.984375)},easeInOutBounce:function(t){return t<.5?.5*r.easeInBounce(2*t):.5*r.easeOutBounce(2*t-1)+.5}};o.requestAnimFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(t){return window.setTimeout(t,1e3/60)}}(),o.getRelativePosition=function(t,e){var a,i,n=t.originalEvent||t,r=t.currentTarget||t.srcElement,s=r.getBoundingClientRect(),l=n.touches;l&&l.length>0?(a=l[0].clientX,i=l[0].clientY):(a=n.clientX,i=n.clientY);var u=parseFloat(o.getStyle(r,"padding-left")),d=parseFloat(o.getStyle(r,"padding-top")),c=parseFloat(o.getStyle(r,"padding-right")),h=parseFloat(o.getStyle(r,"padding-bottom")),f=s.right-s.left-u-c,g=s.bottom-s.top-d-h;return a=Math.round((a-s.left-u)/f*r.width/e.currentDevicePixelRatio),i=Math.round((i-s.top-d)/g*r.height/e.currentDevicePixelRatio),{x:a,y:i}},o.addEvent=function(t,e,a){t.addEventListener?t.addEventListener(e,a):t.attachEvent?t.attachEvent("on"+e,a):t["on"+e]=a},o.removeEvent=function(t,e,a){t.removeEventListener?t.removeEventListener(e,a,!1):t.detachEvent?t.detachEvent("on"+e,a):t["on"+e]=o.noop},o.getConstraintWidth=function(t){return n(t,"max-width","clientWidth")},o.getConstraintHeight=function(t){return n(t,"max-height","clientHeight")},o.getMaximumWidth=function(t){var e=t.parentNode,a=parseInt(o.getStyle(e,"padding-left"),10),i=parseInt(o.getStyle(e,"padding-right"),10),n=e.clientWidth-a-i,r=o.getConstraintWidth(t);return isNaN(r)?n:Math.min(n,r)},o.getMaximumHeight=function(t){var e=t.parentNode,a=parseInt(o.getStyle(e,"padding-top"),10),i=parseInt(o.getStyle(e,"padding-bottom"),10),n=e.clientHeight-a-i,r=o.getConstraintHeight(t);return isNaN(r)?n:Math.min(n,r)},o.getStyle=function(t,e){return t.currentStyle?t.currentStyle[e]:document.defaultView.getComputedStyle(t,null).getPropertyValue(e)},o.retinaScale=function(t){var e=t.currentDevicePixelRatio=window.devicePixelRatio||1;if(1!==e){var a=t.canvas,i=t.height,n=t.width;a.height=i*e,a.width=n*e,t.ctx.scale(e,e),a.style.height=i+"px",a.style.width=n+"px"}},o.clear=function(t){t.ctx.clearRect(0,0,t.width,t.height)},o.fontString=function(t,e,a){return e+" "+t+"px "+a},o.longestText=function(t,e,a,i){i=i||{};var n=i.data=i.data||{},r=i.garbageCollect=i.garbageCollect||[];i.font!==e&&(n=i.data={},r=i.garbageCollect=[],i.font=e),t.font=e;var s=0;o.each(a,function(e){void 0!==e&&null!==e&&o.isArray(e)!==!0?s=o.measureText(t,n,r,s,e):o.isArray(e)&&o.each(e,function(e){void 0===e||null===e||o.isArray(e)||(s=o.measureText(t,n,r,s,e))})});var l=r.length/2;if(l>a.length){for(var u=0;u<l;u++)delete n[r[u]];r.splice(0,l)}return s},o.measureText=function(t,e,a,i,n){var o=e[n];return o||(o=e[n]=t.measureText(n).width,a.push(n)),o>i&&(i=o),i},o.numberOfLabelLines=function(t){var e=1;return o.each(t,function(t){o.isArray(t)&&t.length>e&&(e=t.length)}),e},o.drawRoundedRectangle=function(t,e,a,i,n,o){t.beginPath(),t.moveTo(e+o,a),t.lineTo(e+i-o,a),t.quadraticCurveTo(e+i,a,e+i,a+o),t.lineTo(e+i,a+n-o),t.quadraticCurveTo(e+i,a+n,e+i-o,a+n),t.lineTo(e+o,a+n),t.quadraticCurveTo(e,a+n,e,a+n-o),t.lineTo(e,a+o),t.quadraticCurveTo(e,a,e+o,a),t.closePath()},o.color=function(e){return i?i(e instanceof CanvasGradient?t.defaults.global.defaultColor:e):(console.error("Color.js not found!"),e)},o.isArray=Array.isArray?function(t){return Array.isArray(t)}:function(t){return"[object Array]"===Object.prototype.toString.call(t)},o.arrayEquals=function(t,e){var a,i,n,r;if(!t||!e||t.length!==e.length)return!1;for(a=0,i=t.length;a<i;++a)if(n=t[a],r=e[a],n instanceof Array&&r instanceof Array){if(!o.arrayEquals(n,r))return!1}else if(n!==r)return!1;return!0},o.callCallback=function(t,e,a){t&&"function"==typeof t.call&&t.apply(a,e)},o.getHoverColor=function(t){return t instanceof CanvasPattern?t:o.color(t).saturate(.5).darken(.1).rgbString()}}},{3:3}],27:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){return t.native?{x:t.x,y:t.y}:r.getRelativePosition(t,e)}function a(t,e){var a,i,n,o,r,s=t.data.datasets;for(i=0,o=s.length;i<o;++i)if(t.isDatasetVisible(i))for(a=t.getDatasetMeta(i),n=0,r=a.data.length;n<r;++n){var l=a.data[n];l._view.skip||e(l)}}function i(t,e){var i=[];return a(t,function(t){t.inRange(e.x,e.y)&&i.push(t)}),i}function n(t,e,i,n){var o=Number.POSITIVE_INFINITY,s=[];return n||(n=r.distanceBetweenPoints),a(t,function(t){if(!i||t.inRange(e.x,e.y)){var a=t.getCenterPoint(),r=n(e,a);r<o?(s=[t],o=r):r===o&&s.push(t)}}),s}function o(t,a,o){var r=e(a,t.chart),s=function(t,e){return Math.abs(t.x-e.x)},l=o.intersect?i(t,r):n(t,r,!1,s),u=[];return l.length?(t.data.datasets.forEach(function(e,a){if(t.isDatasetVisible(a)){var i=t.getDatasetMeta(a),n=i.data[l[0]._index];n&&!n._view.skip&&u.push(n)}}),u):[]}var r=t.helpers;t.Interaction={modes:{single:function(t,i){var n=e(i,t.chart),o=[];return a(t,function(t){if(t.inRange(n.x,n.y))return o.push(t),o}),o.slice(0,1)},label:o,index:o,dataset:function(t,a,o){var r=e(a,t.chart),s=o.intersect?i(t,r):n(t,r,!1);return s.length>0&&(s=t.getDatasetMeta(s[0]._datasetIndex).data),s},"x-axis":function(t,e){return o(t,e,!0)},point:function(t,a){var n=e(a,t.chart);return i(t,n)},nearest:function(t,a,i){var o=e(a,t.chart),r=n(t,o,i.intersect);return r.length>1&&r.sort(function(t,e){var a=t.getArea(),i=e.getArea(),n=a-i;return 0===n&&(n=t._datasetIndex-e._datasetIndex),n}),r.slice(0,1)},x:function(t,i,n){var o=e(i,t.chart),r=[],s=!1;return a(t,function(t){t.inXRange(o.x)&&r.push(t),t.inRange(o.x,o.y)&&(s=!0)}),n.intersect&&!s&&(r=[]),r},y:function(t,i,n){var o=e(i,t.chart),r=[],s=!1;return a(t,function(t){t.inYRange(o.y)&&r.push(t),t.inRange(o.x,o.y)&&(s=!0)}),n.intersect&&!s&&(r=[]),r}}}}},{}],28:[function(t,e,a){"use strict";e.exports=function(){var t=function(e,a){return this.controller=new t.Controller(e,a,this),this.controller};return t.defaults={global:{responsive:!0,responsiveAnimationDuration:0,maintainAspectRatio:!0,events:["mousemove","mouseout","click","touchstart","touchmove"],hover:{onHover:null,mode:"nearest",intersect:!0,animationDuration:400},onClick:null,defaultColor:"rgba(0,0,0,0.1)",defaultFontColor:"#666",defaultFontFamily:"'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",defaultFontSize:12,defaultFontStyle:"normal",showLines:!0,elements:{},legendCallback:function(t){var e=[];e.push('<ul class="'+t.id+'-legend">');for(var a=0;a<t.data.datasets.length;a++)e.push('<li><span style="background-color:'+t.data.datasets[a].backgroundColor+'"></span>'),t.data.datasets[a].label&&e.push(t.data.datasets[a].label),e.push("</li>");return e.push("</ul>"),e.join("")}}},t.Chart=t,t}},{}],29:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.layoutService={defaults:{},addBox:function(t,e){t.boxes||(t.boxes=[]),t.boxes.push(e)},removeBox:function(t,e){t.boxes&&t.boxes.splice(t.boxes.indexOf(e),1)},update:function(t,a,i){function n(t){var e,a=t.isHorizontal();a?(e=t.update(t.options.fullWidth?x:C,w),I-=e.height):(e=t.update(M,S),C-=e.width),D.push({horizontal:a,minSize:e,box:t})}function o(t){var a=e.findNextWhere(D,function(e){return e.box===t});if(a)if(t.isHorizontal()){var i={left:Math.max(F,A),right:Math.max(V,T),top:0,bottom:0};t.update(t.options.fullWidth?x:C,y/2,i)}else t.update(a.minSize.width,I)}function r(t){var a=e.findNextWhere(D,function(e){return e.box===t}),i={left:0,right:0,top:R,bottom:O};a&&t.update(a.minSize.width,I,i)}function s(t){t.isHorizontal()?(t.left=t.options.fullWidth?d:F,t.right=t.options.fullWidth?a-c:F+C,t.top=E,t.bottom=E+t.height,E=t.bottom):(t.left=N,t.right=N+t.width,t.top=R,t.bottom=R+I,N=t.right)}if(t){var l=t.options.layout,u=l?l.padding:null,d=0,c=0,h=0,f=0;isNaN(u)?(d=u.left||0,c=u.right||0,h=u.top||0,f=u.bottom||0):(d=u,c=u,h=u,f=u);var g=e.where(t.boxes,function(t){return"left"===t.options.position}),p=e.where(t.boxes,function(t){return"right"===t.options.position}),m=e.where(t.boxes,function(t){return"top"===t.options.position}),v=e.where(t.boxes,function(t){return"bottom"===t.options.position}),b=e.where(t.boxes,function(t){return"chartArea"===t.options.position});m.sort(function(t,e){return(e.options.fullWidth?1:0)-(t.options.fullWidth?1:0)}),v.sort(function(t,e){return(t.options.fullWidth?1:0)-(e.options.fullWidth?1:0)});var x=a-d-c,y=i-h-f,k=x/2,S=y/2,M=(a-k)/(g.length+p.length),w=(i-S)/(m.length+v.length),C=x,I=y,D=[];e.each(g.concat(p,m,v),n);var A=0,T=0,P=0,_=0;e.each(m.concat(v),function(t){if(t.getPadding){var e=t.getPadding();A=Math.max(A,e.left),T=Math.max(T,e.right)}}),e.each(g.concat(p),function(t){if(t.getPadding){var e=t.getPadding();P=Math.max(P,e.top),_=Math.max(_,e.bottom)}});var F=d,V=c,R=h,O=f;e.each(g.concat(p),o),e.each(g,function(t){F+=t.width}),e.each(p,function(t){V+=t.width}),e.each(m.concat(v),o),e.each(m,function(t){R+=t.height}),e.each(v,function(t){O+=t.height}),e.each(g.concat(p),r),F=d,V=c,R=h,O=f,e.each(g,function(t){F+=t.width}),e.each(p,function(t){V+=t.width}),e.each(m,function(t){R+=t.height}),e.each(v,function(t){O+=t.height});var L=Math.max(A-F,0);F+=L,V+=Math.max(T-V,0);var B=Math.max(P-R,0);R+=B,O+=Math.max(_-O,0);var z=i-R-O,W=a-F-V;W===C&&z===I||(e.each(g,function(t){t.height=z}),e.each(p,function(t){t.height=z}),e.each(m,function(t){t.options.fullWidth||(t.width=W)}),e.each(v,function(t){t.options.fullWidth||(t.width=W)}),I=z,C=W);var N=d+L,E=h+B;e.each(g.concat(m),s),N+=C,E+=I,e.each(p,s),e.each(v,s),t.chartArea={left:F,top:R,right:F+C,bottom:R+I},e.each(b,function(e){e.left=t.chartArea.left,e.top=t.chartArea.top,e.right=t.chartArea.right,e.bottom=t.chartArea.bottom,e.update(C,I)})}}}}},{}],30:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){return t.usePointStyle?e*Math.SQRT2:t.boxWidth}function a(e,a){var i=new t.Legend({ctx:e.chart.ctx,options:a,chart:e});e.legend=i,t.layoutService.addBox(e,i)}var i=t.helpers,n=i.noop;t.defaults.global.legend={display:!0,position:"top",fullWidth:!0,reverse:!1,onClick:function(t,e){var a=e.datasetIndex,i=this.chart,n=i.getDatasetMeta(a);n.hidden=null===n.hidden?!i.data.datasets[a].hidden:null,i.update()},onHover:null,labels:{boxWidth:40,padding:10,generateLabels:function(t){var e=t.data;return i.isArray(e.datasets)?e.datasets.map(function(e,a){return{text:e.label,fillStyle:i.isArray(e.backgroundColor)?e.backgroundColor[0]:e.backgroundColor,hidden:!t.isDatasetVisible(a),lineCap:e.borderCapStyle,lineDash:e.borderDash,lineDashOffset:e.borderDashOffset,lineJoin:e.borderJoinStyle,lineWidth:e.borderWidth,strokeStyle:e.borderColor,pointStyle:e.pointStyle,datasetIndex:a}},this):[]}}},t.Legend=t.Element.extend({initialize:function(t){i.extend(this,t),this.legendHitBoxes=[],this.doughnutMode=!1},beforeUpdate:n,update:function(t,e,a){var i=this;return i.beforeUpdate(),i.maxWidth=t,i.maxHeight=e,i.margins=a,i.beforeSetDimensions(),i.setDimensions(),i.afterSetDimensions(),i.beforeBuildLabels(),i.buildLabels(),i.afterBuildLabels(),i.beforeFit(),i.fit(),i.afterFit(),i.afterUpdate(),i.minSize},afterUpdate:n,beforeSetDimensions:n,setDimensions:function(){var t=this;t.isHorizontal()?(t.width=t.maxWidth,t.left=0,t.right=t.width):(t.height=t.maxHeight,t.top=0,t.bottom=t.height),t.paddingLeft=0,t.paddingTop=0,t.paddingRight=0,t.paddingBottom=0,t.minSize={width:0,height:0}},afterSetDimensions:n,beforeBuildLabels:n,buildLabels:function(){var t=this,e=t.options.labels,a=e.generateLabels.call(t,t.chart);e.filter&&(a=a.filter(function(a){return e.filter(a,t.chart.data)})),t.options.reverse&&a.reverse(),t.legendItems=a},afterBuildLabels:n,beforeFit:n,fit:function(){var a=this,n=a.options,o=n.labels,r=n.display,s=a.ctx,l=t.defaults.global,u=i.getValueOrDefault,d=u(o.fontSize,l.defaultFontSize),c=u(o.fontStyle,l.defaultFontStyle),h=u(o.fontFamily,l.defaultFontFamily),f=i.fontString(d,c,h),g=a.legendHitBoxes=[],p=a.minSize,m=a.isHorizontal();if(m?(p.width=a.maxWidth,p.height=r?10:0):(p.width=r?10:0,p.height=a.maxHeight),r)if(s.font=f,m){var v=a.lineWidths=[0],b=a.legendItems.length?d+o.padding:0;s.textAlign="left",s.textBaseline="top",i.each(a.legendItems,function(t,i){var n=e(o,d),r=n+d/2+s.measureText(t.text).width;v[v.length-1]+r+o.padding>=a.width&&(b+=d+o.padding,v[v.length]=a.left),g[i]={left:0,top:0,width:r,height:d},v[v.length-1]+=r+o.padding}),p.height+=b}else{var x=o.padding,y=a.columnWidths=[],k=o.padding,S=0,M=0,w=d+x;i.each(a.legendItems,function(t,a){var i=e(o,d),n=i+d/2+s.measureText(t.text).width;M+w>p.height&&(k+=S+o.padding,y.push(S),S=0,M=0),S=Math.max(S,n),M+=w,g[a]={left:0,top:0,width:n,height:d}}),k+=S,y.push(S),p.width+=k}a.width=p.width,a.height=p.height},afterFit:n,isHorizontal:function(){return"top"===this.options.position||"bottom"===this.options.position},draw:function(){var a=this,n=a.options,o=n.labels,r=t.defaults.global,s=r.elements.line,l=a.width,u=a.lineWidths;if(n.display){var d,c=a.ctx,h=i.getValueOrDefault,f=h(o.fontColor,r.defaultFontColor),g=h(o.fontSize,r.defaultFontSize),p=h(o.fontStyle,r.defaultFontStyle),m=h(o.fontFamily,r.defaultFontFamily),v=i.fontString(g,p,m);c.textAlign="left",c.textBaseline="top",c.lineWidth=.5,c.strokeStyle=f,c.fillStyle=f,c.font=v;var b=e(o,g),x=a.legendHitBoxes,y=function(e,a,i){if(!(isNaN(b)||b<=0)){c.save(),c.fillStyle=h(i.fillStyle,r.defaultColor),c.lineCap=h(i.lineCap,s.borderCapStyle),c.lineDashOffset=h(i.lineDashOffset,s.borderDashOffset),c.lineJoin=h(i.lineJoin,s.borderJoinStyle),c.lineWidth=h(i.lineWidth,s.borderWidth),c.strokeStyle=h(i.strokeStyle,r.defaultColor);var o=0===h(i.lineWidth,s.borderWidth);if(c.setLineDash&&c.setLineDash(h(i.lineDash,s.borderDash)),n.labels&&n.labels.usePointStyle){var l=g*Math.SQRT2/2,u=l/Math.SQRT2,d=e+u,f=a+u;t.canvasHelpers.drawPoint(c,i.pointStyle,l,d,f)}else o||c.strokeRect(e,a,b,g),c.fillRect(e,a,b,g);c.restore()}},k=function(t,e,a,i){c.fillText(a.text,b+g/2+t,e),a.hidden&&(c.beginPath(),c.lineWidth=2,c.moveTo(b+g/2+t,e+g/2),c.lineTo(b+g/2+t+i,e+g/2),c.stroke())},S=a.isHorizontal();d=S?{x:a.left+(l-u[0])/2,y:a.top+o.padding,line:0}:{x:a.left+o.padding,y:a.top+o.padding,line:0};var M=g+o.padding;i.each(a.legendItems,function(t,e){var i=c.measureText(t.text).width,n=b+g/2+i,r=d.x,s=d.y;S?r+n>=l&&(s=d.y+=M,d.line++,r=d.x=a.left+(l-u[d.line])/2):s+M>a.bottom&&(r=d.x=r+a.columnWidths[d.line]+o.padding,s=d.y=a.top+o.padding,d.line++),y(r,s,t),x[e].left=r,x[e].top=s,k(r,s,t,i),S?d.x+=n+o.padding:d.y+=M})}},handleEvent:function(t){var e=this,a=e.options,i="mouseup"===t.type?"click":t.type,n=!1;if("mousemove"===i){if(!a.onHover)return}else{if("click"!==i)return;if(!a.onClick)return}var o=t.x,r=t.y;if(o>=e.left&&o<=e.right&&r>=e.top&&r<=e.bottom)for(var s=e.legendHitBoxes,l=0;l<s.length;++l){var u=s[l];if(o>=u.left&&o<=u.left+u.width&&r>=u.top&&r<=u.top+u.height){if("click"===i){a.onClick.call(e,t.native,e.legendItems[l]),n=!0;break}if("mousemove"===i){a.onHover.call(e,t.native,e.legendItems[l]),n=!0;break}}}return n}}),t.plugins.register({beforeInit:function(t){var e=t.options.legend;e&&a(t,e)},beforeUpdate:function(e){var n=e.options.legend;n?(n=i.configMerge(t.defaults.global.legend,n),e.legend?e.legend.options=n:a(e,n)):(t.layoutService.removeBox(e,e.legend),delete e.legend)},afterEvent:function(t,e){var a=t.legend;a&&a.handleEvent(e)}})}},{}],31:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.defaults.global.plugins={},t.plugins={_plugins:[],_cacheId:0,register:function(t){var e=this._plugins;[].concat(t).forEach(function(t){e.indexOf(t)===-1&&e.push(t)}),this._cacheId++},unregister:function(t){var e=this._plugins;[].concat(t).forEach(function(t){var a=e.indexOf(t);a!==-1&&e.splice(a,1)}),this._cacheId++},clear:function(){this._plugins=[],this._cacheId++},count:function(){return this._plugins.length;
},getAll:function(){return this._plugins},notify:function(t,e,a){var i,n,o,r,s,l=this.descriptors(t),u=l.length;for(i=0;i<u;++i)if(n=l[i],o=n.plugin,s=o[e],"function"==typeof s&&(r=[t].concat(a||[]),r.push(n.options),s.apply(o,r)===!1))return!1;return!0},descriptors:function(a){var i=a._plugins||(a._plugins={});if(i.id===this._cacheId)return i.descriptors;var n=[],o=[],r=a&&a.config||{},s=t.defaults.global.plugins,l=r.options&&r.options.plugins||{};return this._plugins.concat(r.plugins||[]).forEach(function(t){var a=n.indexOf(t);if(a===-1){var i=t.id,r=l[i];r!==!1&&(r===!0&&(r=e.clone(s[i])),n.push(t),o.push({plugin:t,options:r||{}}))}}),i.descriptors=o,i.id=this._cacheId,o}},t.pluginService=t.plugins,t.PluginBase=e.inherits({})}},{}],32:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e,a){return i.isArray(e)?i.longestText(t,a,e):t.measureText(e).width}function a(e){var a=i.getValueOrDefault,n=t.defaults.global,o=a(e.fontSize,n.defaultFontSize),r=a(e.fontStyle,n.defaultFontStyle),s=a(e.fontFamily,n.defaultFontFamily);return{size:o,style:r,family:s,font:i.fontString(o,r,s)}}var i=t.helpers;t.defaults.scale={display:!0,position:"left",gridLines:{display:!0,color:"rgba(0, 0, 0, 0.1)",lineWidth:1,drawBorder:!0,drawOnChartArea:!0,drawTicks:!0,tickMarkLength:10,zeroLineWidth:1,zeroLineColor:"rgba(0,0,0,0.25)",offsetGridLines:!1,borderDash:[],borderDashOffset:0},scaleLabel:{labelString:"",display:!1},ticks:{beginAtZero:!1,minRotation:0,maxRotation:50,mirror:!1,padding:0,reverse:!1,display:!0,autoSkip:!0,autoSkipPadding:0,labelOffset:0,callback:t.Ticks.formatters.values}},t.Scale=t.Element.extend({getPadding:function(){var t=this;return{left:t.paddingLeft||0,top:t.paddingTop||0,right:t.paddingRight||0,bottom:t.paddingBottom||0}},beforeUpdate:function(){i.callCallback(this.options.beforeUpdate,[this])},update:function(t,e,a){var n=this;return n.beforeUpdate(),n.maxWidth=t,n.maxHeight=e,n.margins=i.extend({left:0,right:0,top:0,bottom:0},a),n.longestTextCache=n.longestTextCache||{},n.beforeSetDimensions(),n.setDimensions(),n.afterSetDimensions(),n.beforeDataLimits(),n.determineDataLimits(),n.afterDataLimits(),n.beforeBuildTicks(),n.buildTicks(),n.afterBuildTicks(),n.beforeTickToLabelConversion(),n.convertTicksToLabels(),n.afterTickToLabelConversion(),n.beforeCalculateTickRotation(),n.calculateTickRotation(),n.afterCalculateTickRotation(),n.beforeFit(),n.fit(),n.afterFit(),n.afterUpdate(),n.minSize},afterUpdate:function(){i.callCallback(this.options.afterUpdate,[this])},beforeSetDimensions:function(){i.callCallback(this.options.beforeSetDimensions,[this])},setDimensions:function(){var t=this;t.isHorizontal()?(t.width=t.maxWidth,t.left=0,t.right=t.width):(t.height=t.maxHeight,t.top=0,t.bottom=t.height),t.paddingLeft=0,t.paddingTop=0,t.paddingRight=0,t.paddingBottom=0},afterSetDimensions:function(){i.callCallback(this.options.afterSetDimensions,[this])},beforeDataLimits:function(){i.callCallback(this.options.beforeDataLimits,[this])},determineDataLimits:i.noop,afterDataLimits:function(){i.callCallback(this.options.afterDataLimits,[this])},beforeBuildTicks:function(){i.callCallback(this.options.beforeBuildTicks,[this])},buildTicks:i.noop,afterBuildTicks:function(){i.callCallback(this.options.afterBuildTicks,[this])},beforeTickToLabelConversion:function(){i.callCallback(this.options.beforeTickToLabelConversion,[this])},convertTicksToLabels:function(){var t=this,e=t.options.ticks;t.ticks=t.ticks.map(e.userCallback||e.callback)},afterTickToLabelConversion:function(){i.callCallback(this.options.afterTickToLabelConversion,[this])},beforeCalculateTickRotation:function(){i.callCallback(this.options.beforeCalculateTickRotation,[this])},calculateTickRotation:function(){var t=this,e=t.ctx,n=t.options.ticks,o=a(n);e.font=o.font;var r=n.minRotation||0;if(t.options.display&&t.isHorizontal())for(var s,l,u=i.longestText(e,o.font,t.ticks,t.longestTextCache),d=u,c=t.getPixelForTick(1)-t.getPixelForTick(0)-6;d>c&&r<n.maxRotation;){var h=i.toRadians(r);if(s=Math.cos(h),l=Math.sin(h),l*u>t.maxHeight){r--;break}r++,d=s*u}t.labelRotation=r},afterCalculateTickRotation:function(){i.callCallback(this.options.afterCalculateTickRotation,[this])},beforeFit:function(){i.callCallback(this.options.beforeFit,[this])},fit:function(){var t=this,n=t.minSize={width:0,height:0},o=t.options,r=o.ticks,s=o.scaleLabel,l=o.gridLines,u=o.display,d=t.isHorizontal(),c=a(r),h=1.5*a(s).size,f=o.gridLines.tickMarkLength;if(d?n.width=t.isFullWidth()?t.maxWidth-t.margins.left-t.margins.right:t.maxWidth:n.width=u&&l.drawTicks?f:0,d?n.height=u&&l.drawTicks?f:0:n.height=t.maxHeight,s.display&&u&&(d?n.height+=h:n.width+=h),r.display&&u){var g=i.longestText(t.ctx,c.font,t.ticks,t.longestTextCache),p=i.numberOfLabelLines(t.ticks),m=.5*c.size;if(d){t.longestLabelWidth=g;var v=i.toRadians(t.labelRotation),b=Math.cos(v),x=Math.sin(v),y=x*g+c.size*p+m*p;n.height=Math.min(t.maxHeight,n.height+y),t.ctx.font=c.font;var k=t.ticks[0],S=e(t.ctx,k,c.font),M=t.ticks[t.ticks.length-1],w=e(t.ctx,M,c.font);0!==t.labelRotation?(t.paddingLeft="bottom"===o.position?b*S+3:b*m+3,t.paddingRight="bottom"===o.position?b*m+3:b*w+3):(t.paddingLeft=S/2+3,t.paddingRight=w/2+3)}else r.mirror?g=0:g+=t.options.ticks.padding,n.width+=g,t.paddingTop=c.size/2,t.paddingBottom=c.size/2}t.handleMargins(),t.width=n.width,t.height=n.height},handleMargins:function(){var t=this;t.margins&&(t.paddingLeft=Math.max(t.paddingLeft-t.margins.left,0),t.paddingTop=Math.max(t.paddingTop-t.margins.top,0),t.paddingRight=Math.max(t.paddingRight-t.margins.right,0),t.paddingBottom=Math.max(t.paddingBottom-t.margins.bottom,0))},afterFit:function(){i.callCallback(this.options.afterFit,[this])},isHorizontal:function(){return"top"===this.options.position||"bottom"===this.options.position},isFullWidth:function(){return this.options.fullWidth},getRightValue:function(t){return null===t||"undefined"==typeof t?NaN:"number"!=typeof t||isFinite(t)?"object"==typeof t?t instanceof Date||t.isValid?t:this.getRightValue(this.isHorizontal()?t.x:t.y):t:NaN},getLabelForIndex:i.noop,getPixelForValue:i.noop,getValueForPixel:i.noop,getPixelForTick:function(t,e){var a=this;if(a.isHorizontal()){var i=a.width-(a.paddingLeft+a.paddingRight),n=i/Math.max(a.ticks.length-(a.options.gridLines.offsetGridLines?0:1),1),o=n*t+a.paddingLeft;e&&(o+=n/2);var r=a.left+Math.round(o);return r+=a.isFullWidth()?a.margins.left:0}var s=a.height-(a.paddingTop+a.paddingBottom);return a.top+t*(s/(a.ticks.length-1))},getPixelForDecimal:function(t){var e=this;if(e.isHorizontal()){var a=e.width-(e.paddingLeft+e.paddingRight),i=a*t+e.paddingLeft,n=e.left+Math.round(i);return n+=e.isFullWidth()?e.margins.left:0}return e.top+t*e.height},getBasePixel:function(){return this.getPixelForValue(this.getBaseValue())},getBaseValue:function(){var t=this,e=t.min,a=t.max;return t.beginAtZero?0:e<0&&a<0?a:e>0&&a>0?e:0},draw:function(e){var n=this,o=n.options;if(o.display){var r,s,l=n.ctx,u=t.defaults.global,d=o.ticks,c=o.gridLines,h=o.scaleLabel,f=0!==n.labelRotation,g=d.autoSkip,p=n.isHorizontal();d.maxTicksLimit&&(s=d.maxTicksLimit);var m=i.getValueOrDefault(d.fontColor,u.defaultFontColor),v=a(d),b=c.drawTicks?c.tickMarkLength:0,x=i.getValueOrDefault(c.borderDash,u.borderDash),y=i.getValueOrDefault(c.borderDashOffset,u.borderDashOffset),k=i.getValueOrDefault(h.fontColor,u.defaultFontColor),S=a(h),M=i.toRadians(n.labelRotation),w=Math.cos(M),C=n.longestLabelWidth*w;l.fillStyle=m;var I=[];if(p){if(r=!1,f&&(C/=2),(C+d.autoSkipPadding)*n.ticks.length>n.width-(n.paddingLeft+n.paddingRight)&&(r=1+Math.floor((C+d.autoSkipPadding)*n.ticks.length/(n.width-(n.paddingLeft+n.paddingRight)))),s&&n.ticks.length>s)for(;!r||n.ticks.length/(r||1)>s;)r||(r=1),r+=1;g||(r=!1)}var D="right"===o.position?n.left:n.right-b,A="right"===o.position?n.left+b:n.right,T="bottom"===o.position?n.top:n.bottom-b,P="bottom"===o.position?n.top+b:n.bottom;if(i.each(n.ticks,function(t,a){if(void 0!==t&&null!==t){var s=n.ticks.length===a+1,l=r>1&&a%r>0||a%r===0&&a+r>=n.ticks.length;if((!l||s)&&void 0!==t&&null!==t){var u,h;a===("undefined"!=typeof n.zeroLineIndex?n.zeroLineIndex:0)?(u=c.zeroLineWidth,h=c.zeroLineColor):(u=i.getValueAtIndexOrDefault(c.lineWidth,a),h=i.getValueAtIndexOrDefault(c.color,a));var g,m,v,k,S,w,C,_,F,V,R="middle",O="middle";if(p){"bottom"===o.position?(O=f?"middle":"top",R=f?"right":"center",V=n.top+b):(O=f?"middle":"bottom",R=f?"left":"center",V=n.bottom-b);var L=n.getPixelForTick(a)+i.aliasPixel(u);F=n.getPixelForTick(a,c.offsetGridLines)+d.labelOffset,g=v=S=C=L,m=T,k=P,w=e.top,_=e.bottom}else{var B,z="left"===o.position,W=d.padding;d.mirror?(R=z?"left":"right",B=W):(R=z?"right":"left",B=b+W),F=z?n.right-B:n.left+B;var N=n.getPixelForTick(a);N+=i.aliasPixel(u),V=n.getPixelForTick(a,c.offsetGridLines),g=D,v=A,S=e.left,C=e.right,m=k=w=_=N}I.push({tx1:g,ty1:m,tx2:v,ty2:k,x1:S,y1:w,x2:C,y2:_,labelX:F,labelY:V,glWidth:u,glColor:h,glBorderDash:x,glBorderDashOffset:y,rotation:-1*M,label:t,textBaseline:O,textAlign:R})}}}),i.each(I,function(t){if(c.display&&(l.save(),l.lineWidth=t.glWidth,l.strokeStyle=t.glColor,l.setLineDash&&(l.setLineDash(t.glBorderDash),l.lineDashOffset=t.glBorderDashOffset),l.beginPath(),c.drawTicks&&(l.moveTo(t.tx1,t.ty1),l.lineTo(t.tx2,t.ty2)),c.drawOnChartArea&&(l.moveTo(t.x1,t.y1),l.lineTo(t.x2,t.y2)),l.stroke(),l.restore()),d.display){l.save(),l.translate(t.labelX,t.labelY),l.rotate(t.rotation),l.font=v.font,l.textBaseline=t.textBaseline,l.textAlign=t.textAlign;var e=t.label;if(i.isArray(e))for(var a=0,n=0;a<e.length;++a)l.fillText(""+e[a],0,n),n+=1.5*v.size;else l.fillText(e,0,0);l.restore()}}),h.display){var _,F,V=0;if(p)_=n.left+(n.right-n.left)/2,F="bottom"===o.position?n.bottom-S.size/2:n.top+S.size/2;else{var R="left"===o.position;_=R?n.left+S.size/2:n.right-S.size/2,F=n.top+(n.bottom-n.top)/2,V=R?-.5*Math.PI:.5*Math.PI}l.save(),l.translate(_,F),l.rotate(V),l.textAlign="center",l.textBaseline="middle",l.fillStyle=k,l.font=S.font,l.fillText(h.labelString,0,0),l.restore()}if(c.drawBorder){l.lineWidth=i.getValueAtIndexOrDefault(c.lineWidth,0),l.strokeStyle=i.getValueAtIndexOrDefault(c.color,0);var O=n.left,L=n.right,B=n.top,z=n.bottom,W=i.aliasPixel(l.lineWidth);p?(B=z="top"===o.position?n.bottom:n.top,B+=W,z+=W):(O=L="left"===o.position?n.right:n.left,O+=W,L+=W),l.beginPath(),l.moveTo(O,B),l.lineTo(L,z),l.stroke()}}}})}},{}],33:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.scaleService={constructors:{},defaults:{},registerScaleType:function(t,a,i){this.constructors[t]=a,this.defaults[t]=e.clone(i)},getScaleConstructor:function(t){return this.constructors.hasOwnProperty(t)?this.constructors[t]:void 0},getScaleDefaults:function(a){return this.defaults.hasOwnProperty(a)?e.scaleMerge(t.defaults.scale,this.defaults[a]):{}},updateScaleDefaults:function(t,a){var i=this.defaults;i.hasOwnProperty(t)&&(i[t]=e.extend(i[t],a))},addScalesToLayout:function(a){e.each(a.scales,function(e){t.layoutService.addBox(a,e)})}}}},{}],34:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers;t.Ticks={generators:{linear:function(t,a){var i,n=[];if(t.stepSize&&t.stepSize>0)i=t.stepSize;else{var o=e.niceNum(a.max-a.min,!1);i=e.niceNum(o/(t.maxTicks-1),!0)}var r=Math.floor(a.min/i)*i,s=Math.ceil(a.max/i)*i;t.min&&t.max&&t.stepSize&&e.almostWhole((t.max-t.min)/t.stepSize,i/1e3)&&(r=t.min,s=t.max);var l=(s-r)/i;l=e.almostEquals(l,Math.round(l),i/1e3)?Math.round(l):Math.ceil(l),n.push(void 0!==t.min?t.min:r);for(var u=1;u<l;++u)n.push(r+u*i);return n.push(void 0!==t.max?t.max:s),n},logarithmic:function(t,a){var i,n,o=[],r=e.getValueOrDefault,s=r(t.min,Math.pow(10,Math.floor(e.log10(a.min)))),l=Math.floor(e.log10(a.max)),u=Math.ceil(a.max/Math.pow(10,l));0===s?(i=Math.floor(e.log10(a.minNotZero)),n=Math.floor(a.minNotZero/Math.pow(10,i)),o.push(s),s=n*Math.pow(10,i)):(i=Math.floor(e.log10(s)),n=Math.floor(s/Math.pow(10,i)));do o.push(s),++n,10===n&&(n=1,++i),s=n*Math.pow(10,i);while(i<l||i===l&&n<u);var d=r(t.max,s);return o.push(d),o}},formatters:{values:function(t){return e.isArray(t)?t:""+t},linear:function(t,a,i){var n=i.length>3?i[2]-i[1]:i[1]-i[0];Math.abs(n)>1&&t!==Math.floor(t)&&(n=t-Math.floor(t));var o=e.log10(Math.abs(n)),r="";if(0!==t){var s=-1*Math.floor(o);s=Math.max(Math.min(s,20),0),r=t.toFixed(s)}else r="0";return r},logarithmic:function(t,a,i){var n=t/Math.pow(10,Math.floor(e.log10(t)));return 0===t?"0":1===n||2===n||5===n||0===a||a===i.length-1?t.toExponential():""}}}}},{}],35:[function(t,e,a){"use strict";e.exports=function(t){function e(e,a){var i=new t.Title({ctx:e.chart.ctx,options:a,chart:e});e.titleBlock=i,t.layoutService.addBox(e,i)}var a=t.helpers;t.defaults.global.title={display:!1,position:"top",fullWidth:!0,fontStyle:"bold",padding:10,text:""};var i=a.noop;t.Title=t.Element.extend({initialize:function(t){var e=this;a.extend(e,t),e.legendHitBoxes=[]},beforeUpdate:i,update:function(t,e,a){var i=this;return i.beforeUpdate(),i.maxWidth=t,i.maxHeight=e,i.margins=a,i.beforeSetDimensions(),i.setDimensions(),i.afterSetDimensions(),i.beforeBuildLabels(),i.buildLabels(),i.afterBuildLabels(),i.beforeFit(),i.fit(),i.afterFit(),i.afterUpdate(),i.minSize},afterUpdate:i,beforeSetDimensions:i,setDimensions:function(){var t=this;t.isHorizontal()?(t.width=t.maxWidth,t.left=0,t.right=t.width):(t.height=t.maxHeight,t.top=0,t.bottom=t.height),t.paddingLeft=0,t.paddingTop=0,t.paddingRight=0,t.paddingBottom=0,t.minSize={width:0,height:0}},afterSetDimensions:i,beforeBuildLabels:i,buildLabels:i,afterBuildLabels:i,beforeFit:i,fit:function(){var e=this,i=a.getValueOrDefault,n=e.options,o=t.defaults.global,r=n.display,s=i(n.fontSize,o.defaultFontSize),l=e.minSize;e.isHorizontal()?(l.width=e.maxWidth,l.height=r?s+2*n.padding:0):(l.width=r?s+2*n.padding:0,l.height=e.maxHeight),e.width=l.width,e.height=l.height},afterFit:i,isHorizontal:function(){var t=this.options.position;return"top"===t||"bottom"===t},draw:function(){var e=this,i=e.ctx,n=a.getValueOrDefault,o=e.options,r=t.defaults.global;if(o.display){var s,l,u,d=n(o.fontSize,r.defaultFontSize),c=n(o.fontStyle,r.defaultFontStyle),h=n(o.fontFamily,r.defaultFontFamily),f=a.fontString(d,c,h),g=0,p=e.top,m=e.left,v=e.bottom,b=e.right;i.fillStyle=n(o.fontColor,r.defaultFontColor),i.font=f,e.isHorizontal()?(s=m+(b-m)/2,l=p+(v-p)/2,u=b-m):(s="left"===o.position?m+d/2:b-d/2,l=p+(v-p)/2,u=v-p,g=Math.PI*("left"===o.position?-.5:.5)),i.save(),i.translate(s,l),i.rotate(g),i.textAlign="center",i.textBaseline="middle",i.fillText(o.text,0,0,u),i.restore()}}}),t.plugins.register({beforeInit:function(t){var a=t.options.title;a&&e(t,a)},beforeUpdate:function(i){var n=i.options.title;n?(n=a.configMerge(t.defaults.global.title,n),i.titleBlock?i.titleBlock.options=n:e(i,n)):(t.layoutService.removeBox(i,i.titleBlock),delete i.titleBlock)}})}},{}],36:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){var a=l.color(t);return a.alpha(e*a.alpha()).rgbaString()}function a(t,e){return e&&(l.isArray(e)?Array.prototype.push.apply(t,e):t.push(e)),t}function i(t){var e=t._xScale,a=t._yScale||t._scale,i=t._index,n=t._datasetIndex;return{xLabel:e?e.getLabelForIndex(i,n):"",yLabel:a?a.getLabelForIndex(i,n):"",index:i,datasetIndex:n,x:t._model.x,y:t._model.y}}function n(e){var a=t.defaults.global,i=l.getValueOrDefault;return{xPadding:e.xPadding,yPadding:e.yPadding,xAlign:e.xAlign,yAlign:e.yAlign,bodyFontColor:e.bodyFontColor,_bodyFontFamily:i(e.bodyFontFamily,a.defaultFontFamily),_bodyFontStyle:i(e.bodyFontStyle,a.defaultFontStyle),_bodyAlign:e.bodyAlign,bodyFontSize:i(e.bodyFontSize,a.defaultFontSize),bodySpacing:e.bodySpacing,titleFontColor:e.titleFontColor,_titleFontFamily:i(e.titleFontFamily,a.defaultFontFamily),_titleFontStyle:i(e.titleFontStyle,a.defaultFontStyle),titleFontSize:i(e.titleFontSize,a.defaultFontSize),_titleAlign:e.titleAlign,titleSpacing:e.titleSpacing,titleMarginBottom:e.titleMarginBottom,footerFontColor:e.footerFontColor,_footerFontFamily:i(e.footerFontFamily,a.defaultFontFamily),_footerFontStyle:i(e.footerFontStyle,a.defaultFontStyle),footerFontSize:i(e.footerFontSize,a.defaultFontSize),_footerAlign:e.footerAlign,footerSpacing:e.footerSpacing,footerMarginTop:e.footerMarginTop,caretSize:e.caretSize,cornerRadius:e.cornerRadius,backgroundColor:e.backgroundColor,opacity:0,legendColorBackground:e.multiKeyBackground,displayColors:e.displayColors}}function o(t,e){var a=t._chart.ctx,i=2*e.yPadding,n=0,o=e.body,r=o.reduce(function(t,e){return t+e.before.length+e.lines.length+e.after.length},0);r+=e.beforeBody.length+e.afterBody.length;var s=e.title.length,u=e.footer.length,d=e.titleFontSize,c=e.bodyFontSize,h=e.footerFontSize;i+=s*d,i+=s?(s-1)*e.titleSpacing:0,i+=s?e.titleMarginBottom:0,i+=r*c,i+=r?(r-1)*e.bodySpacing:0,i+=u?e.footerMarginTop:0,i+=u*h,i+=u?(u-1)*e.footerSpacing:0;var f=0,g=function(t){n=Math.max(n,a.measureText(t).width+f)};return a.font=l.fontString(d,e._titleFontStyle,e._titleFontFamily),l.each(e.title,g),a.font=l.fontString(c,e._bodyFontStyle,e._bodyFontFamily),l.each(e.beforeBody.concat(e.afterBody),g),f=e.displayColors?c+2:0,l.each(o,function(t){l.each(t.before,g),l.each(t.lines,g),l.each(t.after,g)}),f=0,a.font=l.fontString(h,e._footerFontStyle,e._footerFontFamily),l.each(e.footer,g),n+=2*e.xPadding,{width:n,height:i}}function r(t,e){var a=t._model,i=t._chart,n=t._chartInstance.chartArea,o="center",r="center";a.y<e.height?r="top":a.y>i.height-e.height&&(r="bottom");var s,l,u,d,c,h=(n.left+n.right)/2,f=(n.top+n.bottom)/2;"center"===r?(s=function(t){return t<=h},l=function(t){return t>h}):(s=function(t){return t<=e.width/2},l=function(t){return t>=i.width-e.width/2}),u=function(t){return t+e.width>i.width},d=function(t){return t-e.width<0},c=function(t){return t<=f?"top":"bottom"},s(a.x)?(o="left",u(a.x)&&(o="center",r=c(a.y))):l(a.x)&&(o="right",d(a.x)&&(o="center",r=c(a.y)));var g=t._options;return{xAlign:g.xAlign?g.xAlign:o,yAlign:g.yAlign?g.yAlign:r}}function s(t,e,a){var i=t.x,n=t.y,o=t.caretSize,r=t.caretPadding,s=t.cornerRadius,l=a.xAlign,u=a.yAlign,d=o+r,c=s+r;return"right"===l?i-=e.width:"center"===l&&(i-=e.width/2),"top"===u?n+=d:n-="bottom"===u?e.height+d:e.height/2,"center"===u?"left"===l?i+=d:"right"===l&&(i-=d):"left"===l?i-=c:"right"===l&&(i+=c),{x:i,y:n}}var l=t.helpers;t.defaults.global.tooltips={enabled:!0,custom:null,mode:"nearest",position:"average",intersect:!0,backgroundColor:"rgba(0,0,0,0.8)",titleFontStyle:"bold",titleSpacing:2,titleMarginBottom:6,titleFontColor:"#fff",titleAlign:"left",bodySpacing:2,bodyFontColor:"#fff",bodyAlign:"left",footerFontStyle:"bold",footerSpacing:2,footerMarginTop:6,footerFontColor:"#fff",footerAlign:"left",yPadding:6,xPadding:6,caretSize:5,cornerRadius:6,multiKeyBackground:"#fff",displayColors:!0,callbacks:{beforeTitle:l.noop,title:function(t,e){var a="",i=e.labels,n=i?i.length:0;if(t.length>0){var o=t[0];o.xLabel?a=o.xLabel:n>0&&o.index<n&&(a=i[o.index])}return a},afterTitle:l.noop,beforeBody:l.noop,beforeLabel:l.noop,label:function(t,e){var a=e.datasets[t.datasetIndex].label||"";return a+": "+t.yLabel},labelColor:function(t,e){var a=e.getDatasetMeta(t.datasetIndex),i=a.data[t.index],n=i._view;return{borderColor:n.borderColor,backgroundColor:n.backgroundColor}},afterLabel:l.noop,afterBody:l.noop,beforeFooter:l.noop,footer:l.noop,afterFooter:l.noop}},t.Tooltip=t.Element.extend({initialize:function(){this._model=n(this._options)},getTitle:function(){var t=this,e=t._options,i=e.callbacks,n=i.beforeTitle.apply(t,arguments),o=i.title.apply(t,arguments),r=i.afterTitle.apply(t,arguments),s=[];return s=a(s,n),s=a(s,o),s=a(s,r)},getBeforeBody:function(){var t=this._options.callbacks.beforeBody.apply(this,arguments);return l.isArray(t)?t:void 0!==t?[t]:[]},getBody:function(t,e){var i=this,n=i._options.callbacks,o=[];return l.each(t,function(t){var r={before:[],lines:[],after:[]};a(r.before,n.beforeLabel.call(i,t,e)),a(r.lines,n.label.call(i,t,e)),a(r.after,n.afterLabel.call(i,t,e)),o.push(r)}),o},getAfterBody:function(){var t=this._options.callbacks.afterBody.apply(this,arguments);return l.isArray(t)?t:void 0!==t?[t]:[]},getFooter:function(){var t=this,e=t._options.callbacks,i=e.beforeFooter.apply(t,arguments),n=e.footer.apply(t,arguments),o=e.afterFooter.apply(t,arguments),r=[];return r=a(r,i),r=a(r,n),r=a(r,o)},update:function(e){var a,u,d=this,c=d._options,h=d._model,f=d._model=n(c),g=d._active,p=d._data,m=d._chartInstance,v={xAlign:h.xAlign,yAlign:h.yAlign},b={x:h.x,y:h.y},x={width:h.width,height:h.height},y={x:h.caretX,y:h.caretY};if(g.length){f.opacity=1;var k=[];y=t.Tooltip.positioners[c.position](g,d._eventPosition);var S=[];for(a=0,u=g.length;a<u;++a)S.push(i(g[a]));c.filter&&(S=S.filter(function(t){return c.filter(t,p)})),c.itemSort&&(S=S.sort(function(t,e){return c.itemSort(t,e,p)})),l.each(S,function(t){k.push(c.callbacks.labelColor.call(d,t,m))}),f.title=d.getTitle(S,p),f.beforeBody=d.getBeforeBody(S,p),f.body=d.getBody(S,p),f.afterBody=d.getAfterBody(S,p),f.footer=d.getFooter(S,p),f.x=Math.round(y.x),f.y=Math.round(y.y),f.caretPadding=l.getValueOrDefault(y.padding,2),f.labelColors=k,f.dataPoints=S,x=o(this,f),v=r(this,x),b=s(f,x,v)}else f.opacity=0;return f.xAlign=v.xAlign,f.yAlign=v.yAlign,f.x=b.x,f.y=b.y,f.width=x.width,f.height=x.height,f.caretX=y.x,f.caretY=y.y,d._model=f,e&&c.custom&&c.custom.call(d,f),d},drawCaret:function(t,a,i){var n,o,r,s,l,u,d=this._view,c=this._chart.ctx,h=d.caretSize,f=d.cornerRadius,g=d.xAlign,p=d.yAlign,m=t.x,v=t.y,b=a.width,x=a.height;"center"===p?("left"===g?(n=m,o=n-h,r=n):(n=m+b,o=n+h,r=n),l=v+x/2,s=l-h,u=l+h):("left"===g?(n=m+f,o=n+h,r=o+h):"right"===g?(n=m+b-f,o=n-h,r=o-h):(o=m+b/2,n=o-h,r=o+h),"top"===p?(s=v,l=s-h,u=s):(s=v+x,l=s+h,u=s)),c.fillStyle=e(d.backgroundColor,i),c.beginPath(),c.moveTo(n,s),c.lineTo(o,l),c.lineTo(r,u),c.closePath(),c.fill()},drawTitle:function(t,a,i,n){var o=a.title;if(o.length){i.textAlign=a._titleAlign,i.textBaseline="top";var r=a.titleFontSize,s=a.titleSpacing;i.fillStyle=e(a.titleFontColor,n),i.font=l.fontString(r,a._titleFontStyle,a._titleFontFamily);var u,d;for(u=0,d=o.length;u<d;++u)i.fillText(o[u],t.x,t.y),t.y+=r+s,u+1===o.length&&(t.y+=a.titleMarginBottom-s)}},drawBody:function(t,a,i,n){var o=a.bodyFontSize,r=a.bodySpacing,s=a.body;i.textAlign=a._bodyAlign,i.textBaseline="top";var u=e(a.bodyFontColor,n);i.fillStyle=u,i.font=l.fontString(o,a._bodyFontStyle,a._bodyFontFamily);var d=0,c=function(e){i.fillText(e,t.x+d,t.y),t.y+=o+r};l.each(a.beforeBody,c);var h=a.displayColors;d=h?o+2:0,l.each(s,function(r,s){l.each(r.before,c),l.each(r.lines,function(r){h&&(i.fillStyle=e(a.legendColorBackground,n),i.fillRect(t.x,t.y,o,o),i.strokeStyle=e(a.labelColors[s].borderColor,n),i.strokeRect(t.x,t.y,o,o),i.fillStyle=e(a.labelColors[s].backgroundColor,n),i.fillRect(t.x+1,t.y+1,o-2,o-2),i.fillStyle=u),c(r)}),l.each(r.after,c)}),d=0,l.each(a.afterBody,c),t.y-=r},drawFooter:function(t,a,i,n){var o=a.footer;o.length&&(t.y+=a.footerMarginTop,i.textAlign=a._footerAlign,i.textBaseline="top",i.fillStyle=e(a.footerFontColor,n),i.font=l.fontString(a.footerFontSize,a._footerFontStyle,a._footerFontFamily),l.each(o,function(e){i.fillText(e,t.x,t.y),t.y+=a.footerFontSize+a.footerSpacing}))},drawBackground:function(t,a,i,n,o){i.fillStyle=e(a.backgroundColor,o),l.drawRoundedRectangle(i,t.x,t.y,n.width,n.height,a.cornerRadius),i.fill()},draw:function(){var t=this._chart.ctx,e=this._view;if(0!==e.opacity){var a={width:e.width,height:e.height},i={x:e.x,y:e.y},n=Math.abs(e.opacity<.001)?0:e.opacity;this._options.enabled&&(this.drawBackground(i,e,t,a,n),this.drawCaret(i,a,n),i.x+=e.xPadding,i.y+=e.yPadding,this.drawTitle(i,e,t,n),this.drawBody(i,e,t,n),this.drawFooter(i,e,t,n))}},handleEvent:function(t){var e=this,a=e._options,i=!1;if(e._lastActive=e._lastActive||[],"mouseout"===t.type?e._active=[]:e._active=e._chartInstance.getElementsAtEventForMode(t,a.mode,a),i=!l.arrayEquals(e._active,e._lastActive),e._lastActive=e._active,a.enabled||a.custom){e._eventPosition={x:t.x,y:t.y};var n=e._model;e.update(!0),e.pivot(),i|=n.x!==e._model.x||n.y!==e._model.y}return i}}),t.Tooltip.positioners={average:function(t){if(!t.length)return!1;var e,a,i=0,n=0,o=0;for(e=0,a=t.length;e<a;++e){var r=t[e];if(r&&r.hasValue()){var s=r.tooltipPosition();i+=s.x,n+=s.y,++o}}return{x:Math.round(i/o),y:Math.round(n/o)}},nearest:function(t,e){var a,i,n,o=e.x,r=e.y,s=Number.POSITIVE_INFINITY;for(i=0,n=t.length;i<n;++i){var u=t[i];if(u&&u.hasValue()){var d=u.getCenterPoint(),c=l.distanceBetweenPoints(e,d);c<s&&(s=c,a=u)}}if(a){var h=a.tooltipPosition();o=h.x,r=h.y}return{x:o,y:r}}}}},{}],37:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a=t.defaults.global;a.elements.arc={backgroundColor:a.defaultColor,borderColor:"#fff",borderWidth:2},t.elements.Arc=t.Element.extend({inLabelRange:function(t){var e=this._view;return!!e&&Math.pow(t-e.x,2)<Math.pow(e.radius+e.hoverRadius,2)},inRange:function(t,a){var i=this._view;if(i){for(var n=e.getAngleFromPoint(i,{x:t,y:a}),o=n.angle,r=n.distance,s=i.startAngle,l=i.endAngle;l<s;)l+=2*Math.PI;for(;o>l;)o-=2*Math.PI;for(;o<s;)o+=2*Math.PI;var u=o>=s&&o<=l,d=r>=i.innerRadius&&r<=i.outerRadius;return u&&d}return!1},getCenterPoint:function(){var t=this._view,e=(t.startAngle+t.endAngle)/2,a=(t.innerRadius+t.outerRadius)/2;return{x:t.x+Math.cos(e)*a,y:t.y+Math.sin(e)*a}},getArea:function(){var t=this._view;return Math.PI*((t.endAngle-t.startAngle)/(2*Math.PI))*(Math.pow(t.outerRadius,2)-Math.pow(t.innerRadius,2))},tooltipPosition:function(){var t=this._view,e=t.startAngle+(t.endAngle-t.startAngle)/2,a=(t.outerRadius-t.innerRadius)/2+t.innerRadius;return{x:t.x+Math.cos(e)*a,y:t.y+Math.sin(e)*a}},draw:function(){var t=this._chart.ctx,e=this._view,a=e.startAngle,i=e.endAngle;t.beginPath(),t.arc(e.x,e.y,e.outerRadius,a,i),t.arc(e.x,e.y,e.innerRadius,i,a,!0),t.closePath(),t.strokeStyle=e.borderColor,t.lineWidth=e.borderWidth,t.fillStyle=e.backgroundColor,t.fill(),t.lineJoin="bevel",e.borderWidth&&t.stroke()}})}},{}],38:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a=t.defaults.global;t.defaults.global.elements.line={tension:.4,backgroundColor:a.defaultColor,borderWidth:3,borderColor:a.defaultColor,borderCapStyle:"butt",borderDash:[],borderDashOffset:0,borderJoinStyle:"miter",capBezierPoints:!0,fill:!0},t.elements.Line=t.Element.extend({draw:function(){function t(t,e){var a=e._view;e._view.steppedLine===!0?(l.lineTo(a.x,t._view.y),l.lineTo(a.x,a.y)):0===e._view.tension?l.lineTo(a.x,a.y):l.bezierCurveTo(t._view.controlPointNextX,t._view.controlPointNextY,a.controlPointPreviousX,a.controlPointPreviousY,a.x,a.y)}var i=this,n=i._view,o=n.spanGaps,r=n.scaleZero,s=i._loop;s||("top"===n.fill?r=n.scaleTop:"bottom"===n.fill&&(r=n.scaleBottom));var l=i._chart.ctx;l.save();var u=i._children.slice(),d=-1;s&&u.length&&u.push(u[0]);var c,h,f,g;if(u.length&&n.fill){for(l.beginPath(),c=0;c<u.length;++c)h=u[c],f=e.previousItem(u,c),g=h._view,0===c?(s?l.moveTo(r.x,r.y):l.moveTo(g.x,r),g.skip||(d=c,l.lineTo(g.x,g.y))):(f=d===-1?f:u[d],g.skip?o||d!==c-1||(s?l.lineTo(r.x,r.y):l.lineTo(f._view.x,r)):(d!==c-1?o&&d!==-1?t(f,h):s?l.lineTo(g.x,g.y):(l.lineTo(g.x,r),l.lineTo(g.x,g.y)):t(f,h),d=c));s||d===-1||l.lineTo(u[d]._view.x,r),l.fillStyle=n.backgroundColor||a.defaultColor,l.closePath(),l.fill()}var p=a.elements.line;for(l.lineCap=n.borderCapStyle||p.borderCapStyle,l.setLineDash&&l.setLineDash(n.borderDash||p.borderDash),l.lineDashOffset=n.borderDashOffset||p.borderDashOffset,l.lineJoin=n.borderJoinStyle||p.borderJoinStyle,l.lineWidth=n.borderWidth||p.borderWidth,l.strokeStyle=n.borderColor||a.defaultColor,l.beginPath(),d=-1,c=0;c<u.length;++c)h=u[c],f=e.previousItem(u,c),g=h._view,0===c?g.skip||(l.moveTo(g.x,g.y),d=c):(f=d===-1?f:u[d],g.skip||(d!==c-1&&!o||d===-1?l.moveTo(g.x,g.y):t(f,h),d=c));l.stroke(),l.restore()}})}},{}],39:[function(t,e,a){"use strict";e.exports=function(t){function e(t){var e=this._view;return!!e&&Math.pow(t-e.x,2)<Math.pow(e.radius+e.hitRadius,2)}function a(t){var e=this._view;return!!e&&Math.pow(t-e.y,2)<Math.pow(e.radius+e.hitRadius,2)}var i=t.helpers,n=t.defaults.global,o=n.defaultColor;n.elements.point={radius:3,pointStyle:"circle",backgroundColor:o,borderWidth:1,borderColor:o,hitRadius:1,hoverRadius:4,hoverBorderWidth:1},t.elements.Point=t.Element.extend({inRange:function(t,e){var a=this._view;return!!a&&Math.pow(t-a.x,2)+Math.pow(e-a.y,2)<Math.pow(a.hitRadius+a.radius,2)},inLabelRange:e,inXRange:e,inYRange:a,getCenterPoint:function(){var t=this._view;return{x:t.x,y:t.y}},getArea:function(){return Math.PI*Math.pow(this._view.radius,2)},tooltipPosition:function(){var t=this._view;return{x:t.x,y:t.y,padding:t.radius+t.borderWidth}},draw:function(e){var a=this._view,r=this._model,s=this._chart.ctx,l=a.pointStyle,u=a.radius,d=a.x,c=a.y,h=t.helpers.color,f=1.01,g=0;a.skip||(s.strokeStyle=a.borderColor||o,s.lineWidth=i.getValueOrDefault(a.borderWidth,n.elements.point.borderWidth),s.fillStyle=a.backgroundColor||o,void 0!==e&&(r.x<e.left||e.right*f<r.x||r.y<e.top||e.bottom*f<r.y)&&(r.x<e.left?g=(d-r.x)/(e.left-r.x):e.right*f<r.x?g=(r.x-d)/(r.x-e.right):r.y<e.top?g=(c-r.y)/(e.top-r.y):e.bottom*f<r.y&&(g=(r.y-c)/(r.y-e.bottom)),g=Math.round(100*g)/100,s.strokeStyle=h(s.strokeStyle).alpha(g).rgbString(),s.fillStyle=h(s.fillStyle).alpha(g).rgbString()),t.canvasHelpers.drawPoint(s,l,u,d,c))}})}},{}],40:[function(t,e,a){"use strict";e.exports=function(t){function e(t){return void 0!==t._view.width}function a(t){var a,i,n,o,r=t._view;if(e(t)){var s=r.width/2;a=r.x-s,i=r.x+s,n=Math.min(r.y,r.base),o=Math.max(r.y,r.base)}else{var l=r.height/2;a=Math.min(r.x,r.base),i=Math.max(r.x,r.base),n=r.y-l,o=r.y+l}return{left:a,top:n,right:i,bottom:o}}var i=t.defaults.global;i.elements.rectangle={backgroundColor:i.defaultColor,borderWidth:0,borderColor:i.defaultColor,borderSkipped:"bottom"},t.elements.Rectangle=t.Element.extend({draw:function(){function t(t){return v[(x+t)%4]}var e,a,i,n,o,r,s,l=this._chart.ctx,u=this._view,d=u.borderWidth;if(u.horizontal?(e=u.base,a=u.x,i=u.y-u.height/2,n=u.y+u.height/2,o=a>e?1:-1,r=1,s=u.borderSkipped||"left"):(e=u.x-u.width/2,a=u.x+u.width/2,i=u.y,n=u.base,o=1,r=n>i?1:-1,s=u.borderSkipped||"bottom"),d){var c=Math.min(Math.abs(e-a),Math.abs(i-n));d=d>c?c:d;var h=d/2,f=e+("left"!==s?h*o:0),g=a+("right"!==s?-h*o:0),p=i+("top"!==s?h*r:0),m=n+("bottom"!==s?-h*r:0);f!==g&&(i=p,n=m),p!==m&&(e=f,a=g)}l.beginPath(),l.fillStyle=u.backgroundColor,l.strokeStyle=u.borderColor,l.lineWidth=d;var v=[[e,n],[e,i],[a,i],[a,n]],b=["bottom","left","top","right"],x=b.indexOf(s,0);x===-1&&(x=0);var y=t(0);l.moveTo(y[0],y[1]);for(var k=1;k<4;k++)y=t(k),l.lineTo(y[0],y[1]);l.fill(),d&&l.stroke()},height:function(){var t=this._view;return t.base-t.y},inRange:function(t,e){var i=!1;if(this._view){var n=a(this);i=t>=n.left&&t<=n.right&&e>=n.top&&e<=n.bottom}return i},inLabelRange:function(t,i){var n=this;if(!n._view)return!1;var o=!1,r=a(n);return o=e(n)?t>=r.left&&t<=r.right:i>=r.top&&i<=r.bottom},inXRange:function(t){var e=a(this);return t>=e.left&&t<=e.right},inYRange:function(t){var e=a(this);return t>=e.top&&t<=e.bottom},getCenterPoint:function(){var t,a,i=this._view;return e(this)?(t=i.x,a=(i.y+i.base)/2):(t=(i.x+i.base)/2,a=i.y),{x:t,y:a}},getArea:function(){var t=this._view;return t.width*Math.abs(t.y-t.base)},tooltipPosition:function(){var t=this._view;return{x:t.x,y:t.y}}})}},{}],41:[function(t,e,a){"use strict";e.exports=function(t){function e(t,e){var a=l.getStyle(t,e),i=a&&a.match(/(\d+)px/);return i?Number(i[1]):void 0}function a(t,a){var i=t.style,n=t.getAttribute("height"),o=t.getAttribute("width");if(t._chartjs={initial:{height:n,width:o,style:{display:i.display,height:i.height,width:i.width}}},i.display=i.display||"block",null===o||""===o){var r=e(t,"width");void 0!==r&&(t.width=r)}if(null===n||""===n)if(""===t.style.height)t.height=t.width/(a.options.aspectRatio||2);else{var s=e(t,"height");void 0!==r&&(t.height=s)}return t}function i(t,e,a,i,n){return{type:t,chart:e,native:n||null,x:void 0!==a?a:null,y:void 0!==i?i:null}}function n(t,e){
var a=u[t.type]||t.type,n=l.getRelativePosition(t,e);return i(a,e,n.x,n.y,t)}function o(t){var e=document.createElement("iframe");return e.className="chartjs-hidden-iframe",e.style.cssText="display:block;overflow:hidden;border:0;margin:0;top:0;left:0;bottom:0;right:0;height:100%;width:100%;position:absolute;pointer-events:none;z-index:-1;",e.tabIndex=-1,l.addEvent(e,"load",function(){l.addEvent(e.contentWindow||e,"resize",t),t()}),e}function r(t,e,a){var n=t._chartjs={ticking:!1},r=function(){n.ticking||(n.ticking=!0,l.requestAnimFrame.call(window,function(){if(n.resizer)return n.ticking=!1,e(i("resize",a))}))};n.resizer=o(r),t.insertBefore(n.resizer,t.firstChild)}function s(t){if(t&&t._chartjs){var e=t._chartjs.resizer;e&&(e.parentNode.removeChild(e),t._chartjs.resizer=null),delete t._chartjs}}var l=t.helpers,u={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup",pointerenter:"mouseenter",pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup",pointerleave:"mouseout",pointerout:"mouseout"};return{acquireContext:function(t,e){if("string"==typeof t?t=document.getElementById(t):t.length&&(t=t[0]),t&&t.canvas&&(t=t.canvas),t instanceof HTMLCanvasElement){var i=t.getContext&&t.getContext("2d");if(i instanceof CanvasRenderingContext2D)return a(t,e),i}return null},releaseContext:function(t){var e=t.canvas;if(e._chartjs){var a=e._chartjs.initial;["height","width"].forEach(function(t){var i=a[t];void 0===i||null===i?e.removeAttribute(t):e.setAttribute(t,i)}),l.each(a.style||{},function(t,a){e.style[a]=t}),e.width=e.width,delete e._chartjs}},addEventListener:function(t,e,a){var i=t.chart.canvas;if("resize"===e)return void r(i.parentNode,a,t.chart);var o=a._chartjs||(a._chartjs={}),s=o.proxies||(o.proxies={}),u=s[t.id+"_"+e]=function(e){a(n(e,t.chart))};l.addEvent(i,e,u)},removeEventListener:function(t,e,a){var i=t.chart.canvas;if("resize"===e)return void s(i.parentNode,a);var n=a._chartjs||{},o=n.proxies||{},r=o[t.id+"_"+e];r&&l.removeEvent(i,e,r)}}}},{}],42:[function(t,e,a){"use strict";var i=t(41);e.exports=function(t){t.platform={acquireContext:function(){},releaseContext:function(){},addEventListener:function(){},removeEventListener:function(){}},t.helpers.extend(t.platform,i(t))}},{41:41}],43:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a={position:"bottom"},i=t.Scale.extend({getLabels:function(){var t=this.chart.data;return(this.isHorizontal()?t.xLabels:t.yLabels)||t.labels},determineDataLimits:function(){var t=this,a=t.getLabels();t.minIndex=0,t.maxIndex=a.length-1;var i;void 0!==t.options.ticks.min&&(i=e.indexOf(a,t.options.ticks.min),t.minIndex=i!==-1?i:t.minIndex),void 0!==t.options.ticks.max&&(i=e.indexOf(a,t.options.ticks.max),t.maxIndex=i!==-1?i:t.maxIndex),t.min=a[t.minIndex],t.max=a[t.maxIndex]},buildTicks:function(){var t=this,e=t.getLabels();t.ticks=0===t.minIndex&&t.maxIndex===e.length-1?e:e.slice(t.minIndex,t.maxIndex+1)},getLabelForIndex:function(t,e){var a=this,i=a.chart.data,n=a.isHorizontal();return i.yLabels&&!n?a.getRightValue(i.datasets[e].data[t]):a.ticks[t-a.minIndex]},getPixelForValue:function(t,e,a,i){var n=this,o=Math.max(n.maxIndex+1-n.minIndex-(n.options.gridLines.offsetGridLines?0:1),1);if(void 0!==t&&isNaN(e)){var r=n.getLabels(),s=r.indexOf(t);e=s!==-1?s:e}if(n.isHorizontal()){var l=n.width/o,u=l*(e-n.minIndex);return(n.options.gridLines.offsetGridLines&&i||n.maxIndex===n.minIndex&&i)&&(u+=l/2),n.left+Math.round(u)}var d=n.height/o,c=d*(e-n.minIndex);return n.options.gridLines.offsetGridLines&&i&&(c+=d/2),n.top+Math.round(c)},getPixelForTick:function(t,e){return this.getPixelForValue(this.ticks[t],t+this.minIndex,null,e)},getValueForPixel:function(t){var e,a=this,i=Math.max(a.ticks.length-(a.options.gridLines.offsetGridLines?0:1),1),n=a.isHorizontal(),o=(n?a.width:a.height)/i;return t-=n?a.left:a.top,a.options.gridLines.offsetGridLines&&(t-=o/2),e=t<=0?0:Math.round(t/o)},getBasePixel:function(){return this.bottom}});t.scaleService.registerScaleType("category",i,a)}},{}],44:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a={position:"left",ticks:{callback:t.Ticks.formatters.linear}},i=t.LinearScaleBase.extend({determineDataLimits:function(){function t(t){return s?t.xAxisID===a.id:t.yAxisID===a.id}var a=this,i=a.options,n=a.chart,o=n.data,r=o.datasets,s=a.isHorizontal();a.min=null,a.max=null;var l=i.stacked;if(void 0===l&&e.each(r,function(e,a){if(!l){var i=n.getDatasetMeta(a);n.isDatasetVisible(a)&&t(i)&&void 0!==i.stack&&(l=!0)}}),i.stacked||l){var u={};e.each(r,function(o,r){var s=n.getDatasetMeta(r),l=[s.type,void 0===i.stacked&&void 0===s.stack?r:"",s.stack].join(".");void 0===u[l]&&(u[l]={positiveValues:[],negativeValues:[]});var d=u[l].positiveValues,c=u[l].negativeValues;n.isDatasetVisible(r)&&t(s)&&e.each(o.data,function(t,e){var n=+a.getRightValue(t);isNaN(n)||s.data[e].hidden||(d[e]=d[e]||0,c[e]=c[e]||0,i.relativePoints?d[e]=100:n<0?c[e]+=n:d[e]+=n)})}),e.each(u,function(t){var i=t.positiveValues.concat(t.negativeValues),n=e.min(i),o=e.max(i);a.min=null===a.min?n:Math.min(a.min,n),a.max=null===a.max?o:Math.max(a.max,o)})}else e.each(r,function(i,o){var r=n.getDatasetMeta(o);n.isDatasetVisible(o)&&t(r)&&e.each(i.data,function(t,e){var i=+a.getRightValue(t);isNaN(i)||r.data[e].hidden||(null===a.min?a.min=i:i<a.min&&(a.min=i),null===a.max?a.max=i:i>a.max&&(a.max=i))})});this.handleTickRangeOptions()},getTickLimit:function(){var a,i=this,n=i.options.ticks;if(i.isHorizontal())a=Math.min(n.maxTicksLimit?n.maxTicksLimit:11,Math.ceil(i.width/50));else{var o=e.getValueOrDefault(n.fontSize,t.defaults.global.defaultFontSize);a=Math.min(n.maxTicksLimit?n.maxTicksLimit:11,Math.ceil(i.height/(2*o)))}return a},handleDirectionalChanges:function(){this.isHorizontal()||this.ticks.reverse()},getLabelForIndex:function(t,e){return+this.getRightValue(this.chart.data.datasets[e].data[t])},getPixelForValue:function(t){var e,a=this,i=a.start,n=+a.getRightValue(t),o=a.end-i;return a.isHorizontal()?(e=a.left+a.width/o*(n-i),Math.round(e)):(e=a.bottom-a.height/o*(n-i),Math.round(e))},getValueForPixel:function(t){var e=this,a=e.isHorizontal(),i=a?e.width:e.height,n=(a?t-e.left:e.bottom-t)/i;return e.start+(e.end-e.start)*n},getPixelForTick:function(t){return this.getPixelForValue(this.ticksAsNumbers[t])}});t.scaleService.registerScaleType("linear",i,a)}},{}],45:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a=e.noop;t.LinearScaleBase=t.Scale.extend({handleTickRangeOptions:function(){var t=this,a=t.options,i=a.ticks;if(i.beginAtZero){var n=e.sign(t.min),o=e.sign(t.max);n<0&&o<0?t.max=0:n>0&&o>0&&(t.min=0)}void 0!==i.min?t.min=i.min:void 0!==i.suggestedMin&&(t.min=Math.min(t.min,i.suggestedMin)),void 0!==i.max?t.max=i.max:void 0!==i.suggestedMax&&(t.max=Math.max(t.max,i.suggestedMax)),t.min===t.max&&(t.max++,i.beginAtZero||t.min--)},getTickLimit:a,handleDirectionalChanges:a,buildTicks:function(){var a=this,i=a.options,n=i.ticks,o=a.getTickLimit();o=Math.max(2,o);var r={maxTicks:o,min:n.min,max:n.max,stepSize:e.getValueOrDefault(n.fixedStepSize,n.stepSize)},s=a.ticks=t.Ticks.generators.linear(r,a);a.handleDirectionalChanges(),a.max=e.max(s),a.min=e.min(s),n.reverse?(s.reverse(),a.start=a.max,a.end=a.min):(a.start=a.min,a.end=a.max)},convertTicksToLabels:function(){var e=this;e.ticksAsNumbers=e.ticks.slice(),e.zeroLineIndex=e.ticks.indexOf(0),t.Scale.prototype.convertTicksToLabels.call(e)}})}},{}],46:[function(t,e,a){"use strict";e.exports=function(t){var e=t.helpers,a={position:"left",ticks:{callback:t.Ticks.formatters.logarithmic}},i=t.Scale.extend({determineDataLimits:function(){function t(t){return u?t.xAxisID===a.id:t.yAxisID===a.id}var a=this,i=a.options,n=i.ticks,o=a.chart,r=o.data,s=r.datasets,l=e.getValueOrDefault,u=a.isHorizontal();a.min=null,a.max=null,a.minNotZero=null;var d=i.stacked;if(void 0===d&&e.each(s,function(e,a){if(!d){var i=o.getDatasetMeta(a);o.isDatasetVisible(a)&&t(i)&&void 0!==i.stack&&(d=!0)}}),i.stacked||d){var c={};e.each(s,function(n,r){var s=o.getDatasetMeta(r),l=[s.type,void 0===i.stacked&&void 0===s.stack?r:"",s.stack].join(".");o.isDatasetVisible(r)&&t(s)&&(void 0===c[l]&&(c[l]=[]),e.each(n.data,function(t,e){var n=c[l],o=+a.getRightValue(t);isNaN(o)||s.data[e].hidden||(n[e]=n[e]||0,i.relativePoints?n[e]=100:n[e]+=o)}))}),e.each(c,function(t){var i=e.min(t),n=e.max(t);a.min=null===a.min?i:Math.min(a.min,i),a.max=null===a.max?n:Math.max(a.max,n)})}else e.each(s,function(i,n){var r=o.getDatasetMeta(n);o.isDatasetVisible(n)&&t(r)&&e.each(i.data,function(t,e){var i=+a.getRightValue(t);isNaN(i)||r.data[e].hidden||(null===a.min?a.min=i:i<a.min&&(a.min=i),null===a.max?a.max=i:i>a.max&&(a.max=i),0!==i&&(null===a.minNotZero||i<a.minNotZero)&&(a.minNotZero=i))})});a.min=l(n.min,a.min),a.max=l(n.max,a.max),a.min===a.max&&(0!==a.min&&null!==a.min?(a.min=Math.pow(10,Math.floor(e.log10(a.min))-1),a.max=Math.pow(10,Math.floor(e.log10(a.max))+1)):(a.min=1,a.max=10))},buildTicks:function(){var a=this,i=a.options,n=i.ticks,o={min:n.min,max:n.max},r=a.ticks=t.Ticks.generators.logarithmic(o,a);a.isHorizontal()||r.reverse(),a.max=e.max(r),a.min=e.min(r),n.reverse?(r.reverse(),a.start=a.max,a.end=a.min):(a.start=a.min,a.end=a.max)},convertTicksToLabels:function(){this.tickValues=this.ticks.slice(),t.Scale.prototype.convertTicksToLabels.call(this)},getLabelForIndex:function(t,e){return+this.getRightValue(this.chart.data.datasets[e].data[t])},getPixelForTick:function(t){return this.getPixelForValue(this.tickValues[t])},getPixelForValue:function(t){var a,i,n,o=this,r=o.start,s=+o.getRightValue(t),l=o.options,u=l.ticks;return o.isHorizontal()?(n=e.log10(o.end)-e.log10(r),0===s?i=o.left:(a=o.width,i=o.left+a/n*(e.log10(s)-e.log10(r)))):(a=o.height,0!==r||u.reverse?0===o.end&&u.reverse?(n=e.log10(o.start)-e.log10(o.minNotZero),i=s===o.end?o.top:s===o.minNotZero?o.top+.02*a:o.top+.02*a+.98*a/n*(e.log10(s)-e.log10(o.minNotZero))):(n=e.log10(o.end)-e.log10(r),a=o.height,i=o.bottom-a/n*(e.log10(s)-e.log10(r))):(n=e.log10(o.end)-e.log10(o.minNotZero),i=s===r?o.bottom:s===o.minNotZero?o.bottom-.02*a:o.bottom-.02*a-.98*a/n*(e.log10(s)-e.log10(o.minNotZero)))),i},getValueForPixel:function(t){var a,i,n=this,o=e.log10(n.end)-e.log10(n.start);return n.isHorizontal()?(i=n.width,a=n.start*Math.pow(10,(t-n.left)*o/i)):(i=n.height,a=Math.pow(10,(n.bottom-t)*o/i)/n.start),a}});t.scaleService.registerScaleType("logarithmic",i,a)}},{}],47:[function(t,e,a){"use strict";e.exports=function(t){function e(t){return t.options.lineArc?0:t.chart.data.labels.length}function a(t){var e=t.options.pointLabels,a=f.getValueOrDefault(e.fontSize,g.defaultFontSize),i=f.getValueOrDefault(e.fontStyle,g.defaultFontStyle),n=f.getValueOrDefault(e.fontFamily,g.defaultFontFamily),o=f.fontString(a,i,n);return{size:a,style:i,family:n,font:o}}function i(t,e,a){return f.isArray(a)?{w:f.longestText(t,t.font,a),h:a.length*e+1.5*(a.length-1)*e}:{w:t.measureText(a).width,h:e}}function n(t,e,a,i,n){return t===i||t===n?{start:e-a/2,end:e+a/2}:t<i||t>n?{start:e-a-5,end:e}:{start:e,end:e+a+5}}function o(t){var o,r,s,l=a(t),u=Math.min(t.height/2,t.width/2),d={l:t.width,r:0,t:t.height,b:0},c={};t.ctx.font=l.font,t._pointLabelSizes=[];var h=e(t);for(o=0;o<h;o++){s=t.getPointPosition(o,u),r=i(t.ctx,l.size,t.pointLabels[o]||""),t._pointLabelSizes[o]=r;var g=t.getIndexAngle(o),p=f.toDegrees(g)%360,m=n(p,s.x,r.w,0,180),v=n(p,s.y,r.h,90,270);m.start<d.l&&(d.l=m.start,c.l=g),m.end>d.r&&(d.r=m.end,c.r=g),v.start<d.t&&(d.t=v.start,c.t=g),v.end>d.b&&(d.b=v.end,c.b=g)}t.setReductions(u,d,c)}function r(t){var e=Math.min(t.height/2,t.width/2);t.drawingArea=Math.round(e),t.setCenterPoint(0,0,0,0)}function s(t){return 0===t||180===t?"center":t<180?"left":"right"}function l(t,e,a,i){if(f.isArray(e))for(var n=a.y,o=1.5*i,r=0;r<e.length;++r)t.fillText(e[r],a.x,n),n+=o;else t.fillText(e,a.x,a.y)}function u(t,e,a){90===t||270===t?a.y-=e.h/2:(t>270||t<90)&&(a.y-=e.h)}function d(t){var i=t.ctx,n=f.getValueOrDefault,o=t.options,r=o.angleLines,d=o.pointLabels;i.lineWidth=r.lineWidth,i.strokeStyle=r.color;var c=t.getDistanceFromCenterForValue(o.reverse?t.min:t.max),h=a(t);i.textBaseline="top";for(var p=e(t)-1;p>=0;p--){if(r.display){var m=t.getPointPosition(p,c);i.beginPath(),i.moveTo(t.xCenter,t.yCenter),i.lineTo(m.x,m.y),i.stroke(),i.closePath()}var v=t.getPointPosition(p,c+5),b=n(d.fontColor,g.defaultFontColor);i.font=h.font,i.fillStyle=b;var x=t.getIndexAngle(p),y=f.toDegrees(x);i.textAlign=s(y),u(y,t._pointLabelSizes[p],v),l(i,t.pointLabels[p]||"",v,h.size)}}function c(t,a,i,n){var o=t.ctx;if(o.strokeStyle=f.getValueAtIndexOrDefault(a.color,n-1),o.lineWidth=f.getValueAtIndexOrDefault(a.lineWidth,n-1),t.options.lineArc)o.beginPath(),o.arc(t.xCenter,t.yCenter,i,0,2*Math.PI),o.closePath(),o.stroke();else{var r=e(t);if(0===r)return;o.beginPath();var s=t.getPointPosition(0,i);o.moveTo(s.x,s.y);for(var l=1;l<r;l++)s=t.getPointPosition(l,i),o.lineTo(s.x,s.y);o.closePath(),o.stroke()}}function h(t){return f.isNumber(t)?t:0}var f=t.helpers,g=t.defaults.global,p={display:!0,animate:!0,lineArc:!1,position:"chartArea",angleLines:{display:!0,color:"rgba(0, 0, 0, 0.1)",lineWidth:1},ticks:{showLabelBackdrop:!0,backdropColor:"rgba(255,255,255,0.75)",backdropPaddingY:2,backdropPaddingX:2,callback:t.Ticks.formatters.linear},pointLabels:{fontSize:10,callback:function(t){return t}}},m=t.LinearScaleBase.extend({setDimensions:function(){var t=this,e=t.options,a=e.ticks;t.width=t.maxWidth,t.height=t.maxHeight,t.xCenter=Math.round(t.width/2),t.yCenter=Math.round(t.height/2);var i=f.min([t.height,t.width]),n=f.getValueOrDefault(a.fontSize,g.defaultFontSize);t.drawingArea=e.display?i/2-(n/2+a.backdropPaddingY):i/2},determineDataLimits:function(){var t=this,e=t.chart,a=Number.POSITIVE_INFINITY,i=Number.NEGATIVE_INFINITY;f.each(e.data.datasets,function(n,o){if(e.isDatasetVisible(o)){var r=e.getDatasetMeta(o);f.each(n.data,function(e,n){var o=+t.getRightValue(e);isNaN(o)||r.data[n].hidden||(a=Math.min(o,a),i=Math.max(o,i))})}}),t.min=a===Number.POSITIVE_INFINITY?0:a,t.max=i===Number.NEGATIVE_INFINITY?0:i,t.handleTickRangeOptions()},getTickLimit:function(){var t=this.options.ticks,e=f.getValueOrDefault(t.fontSize,g.defaultFontSize);return Math.min(t.maxTicksLimit?t.maxTicksLimit:11,Math.ceil(this.drawingArea/(1.5*e)))},convertTicksToLabels:function(){var e=this;t.LinearScaleBase.prototype.convertTicksToLabels.call(e),e.pointLabels=e.chart.data.labels.map(e.options.pointLabels.callback,e)},getLabelForIndex:function(t,e){return+this.getRightValue(this.chart.data.datasets[e].data[t])},fit:function(){this.options.lineArc?r(this):o(this)},setReductions:function(t,e,a){var i=this,n=e.l/Math.sin(a.l),o=Math.max(e.r-i.width,0)/Math.sin(a.r),r=-e.t/Math.cos(a.t),s=-Math.max(e.b-i.height,0)/Math.cos(a.b);n=h(n),o=h(o),r=h(r),s=h(s),i.drawingArea=Math.min(Math.round(t-(n+o)/2),Math.round(t-(r+s)/2)),i.setCenterPoint(n,o,r,s)},setCenterPoint:function(t,e,a,i){var n=this,o=n.width-e-n.drawingArea,r=t+n.drawingArea,s=a+n.drawingArea,l=n.height-i-n.drawingArea;n.xCenter=Math.round((r+o)/2+n.left),n.yCenter=Math.round((s+l)/2+n.top)},getIndexAngle:function(t){var a=2*Math.PI/e(this),i=this.chart.options&&this.chart.options.startAngle?this.chart.options.startAngle:0,n=i*Math.PI*2/360;return t*a+n},getDistanceFromCenterForValue:function(t){var e=this;if(null===t)return 0;var a=e.drawingArea/(e.max-e.min);return e.options.reverse?(e.max-t)*a:(t-e.min)*a},getPointPosition:function(t,e){var a=this,i=a.getIndexAngle(t)-Math.PI/2;return{x:Math.round(Math.cos(i)*e)+a.xCenter,y:Math.round(Math.sin(i)*e)+a.yCenter}},getPointPositionForValue:function(t,e){return this.getPointPosition(t,this.getDistanceFromCenterForValue(e))},getBasePosition:function(){var t=this,e=t.min,a=t.max;return t.getPointPositionForValue(0,t.beginAtZero?0:e<0&&a<0?a:e>0&&a>0?e:0)},draw:function(){var t=this,e=t.options,a=e.gridLines,i=e.ticks,n=f.getValueOrDefault;if(e.display){var o=t.ctx,r=n(i.fontSize,g.defaultFontSize),s=n(i.fontStyle,g.defaultFontStyle),l=n(i.fontFamily,g.defaultFontFamily),u=f.fontString(r,s,l);f.each(t.ticks,function(s,l){if(l>0||e.reverse){var d=t.getDistanceFromCenterForValue(t.ticksAsNumbers[l]),h=t.yCenter-d;if(a.display&&0!==l&&c(t,a,d,l),i.display){var f=n(i.fontColor,g.defaultFontColor);if(o.font=u,i.showLabelBackdrop){var p=o.measureText(s).width;o.fillStyle=i.backdropColor,o.fillRect(t.xCenter-p/2-i.backdropPaddingX,h-r/2-i.backdropPaddingY,p+2*i.backdropPaddingX,r+2*i.backdropPaddingY)}o.textAlign="center",o.textBaseline="middle",o.fillStyle=f,o.fillText(s,t.xCenter,h)}}}),e.lineArc||d(t)}}});t.scaleService.registerScaleType("radialLinear",m,p)}},{}],48:[function(t,e,a){"use strict";var i=t(1);i="function"==typeof i?i:window.moment,e.exports=function(t){var e=t.helpers,a={units:[{name:"millisecond",steps:[1,2,5,10,20,50,100,250,500]},{name:"second",steps:[1,2,5,10,30]},{name:"minute",steps:[1,2,5,10,30]},{name:"hour",steps:[1,2,3,6,12]},{name:"day",steps:[1,2,5]},{name:"week",maxStep:4},{name:"month",maxStep:3},{name:"quarter",maxStep:4},{name:"year",maxStep:!1}]},n={position:"bottom",time:{parser:!1,format:!1,unit:!1,round:!1,displayFormat:!1,isoWeekday:!1,minUnit:"millisecond",displayFormats:{millisecond:"h:mm:ss.SSS a",second:"h:mm:ss a",minute:"h:mm:ss a",hour:"MMM D, hA",day:"ll",week:"ll",month:"MMM YYYY",quarter:"[Q]Q - YYYY",year:"YYYY"}},ticks:{autoSkip:!1}},o=t.Scale.extend({initialize:function(){if(!i)throw new Error("Chart.js - Moment.js could not be found! You must include it before Chart.js to use the time scale. Download at https://momentjs.com");t.Scale.prototype.initialize.call(this)},getLabelMoment:function(t,e){return null===t||null===e?null:"undefined"!=typeof this.labelMoments[t]?this.labelMoments[t][e]:null},getLabelDiff:function(t,e){var a=this;return null===t||null===e?null:(void 0===a.labelDiffs&&a.buildLabelDiffs(),"undefined"!=typeof a.labelDiffs[t]?a.labelDiffs[t][e]:null)},getMomentStartOf:function(t){var e=this;return"week"===e.options.time.unit&&e.options.time.isoWeekday!==!1?t.clone().startOf("isoWeek").isoWeekday(e.options.time.isoWeekday):t.clone().startOf(e.tickUnit)},determineDataLimits:function(){var t=this;t.labelMoments=[];var a=[];t.chart.data.labels&&t.chart.data.labels.length>0?(e.each(t.chart.data.labels,function(e){var i=t.parseTime(e);i.isValid()&&(t.options.time.round&&i.startOf(t.options.time.round),a.push(i))},t),t.firstTick=i.min.call(t,a),t.lastTick=i.max.call(t,a)):(t.firstTick=null,t.lastTick=null),e.each(t.chart.data.datasets,function(n,o){var r=[],s=t.chart.isDatasetVisible(o);"object"==typeof n.data[0]&&null!==n.data[0]?e.each(n.data,function(e){var a=t.parseTime(t.getRightValue(e));a.isValid()&&(t.options.time.round&&a.startOf(t.options.time.round),r.push(a),s&&(t.firstTick=null!==t.firstTick?i.min(t.firstTick,a):a,t.lastTick=null!==t.lastTick?i.max(t.lastTick,a):a))},t):r=a,t.labelMoments.push(r)},t),t.options.time.min&&(t.firstTick=t.parseTime(t.options.time.min)),t.options.time.max&&(t.lastTick=t.parseTime(t.options.time.max)),t.firstTick=(t.firstTick||i()).clone(),t.lastTick=(t.lastTick||i()).clone()},buildLabelDiffs:function(){var t=this;t.labelDiffs=[];var a=[];t.chart.data.labels&&t.chart.data.labels.length>0&&e.each(t.chart.data.labels,function(e){var i=t.parseTime(e);i.isValid()&&(t.options.time.round&&i.startOf(t.options.time.round),a.push(i.diff(t.firstTick,t.tickUnit,!0)))},t),e.each(t.chart.data.datasets,function(i){var n=[];"object"==typeof i.data[0]&&null!==i.data[0]?e.each(i.data,function(e){var a=t.parseTime(t.getRightValue(e));a.isValid()&&(t.options.time.round&&a.startOf(t.options.time.round),n.push(a.diff(t.firstTick,t.tickUnit,!0)))},t):n=a,t.labelDiffs.push(n)},t)},buildTicks:function(){var i=this;i.ctx.save();var n=e.getValueOrDefault(i.options.ticks.fontSize,t.defaults.global.defaultFontSize),o=e.getValueOrDefault(i.options.ticks.fontStyle,t.defaults.global.defaultFontStyle),r=e.getValueOrDefault(i.options.ticks.fontFamily,t.defaults.global.defaultFontFamily),s=e.fontString(n,o,r);if(i.ctx.font=s,i.ticks=[],i.unitScale=1,i.scaleSizeInUnits=0,i.options.time.unit)i.tickUnit=i.options.time.unit||"day",i.displayFormat=i.options.time.displayFormats[i.tickUnit],i.scaleSizeInUnits=i.lastTick.diff(i.firstTick,i.tickUnit,!0),i.unitScale=e.getValueOrDefault(i.options.time.unitStepSize,1);else{var l=i.isHorizontal()?i.width:i.height,u=i.tickFormatFunction(i.firstTick,0,[]),d=i.ctx.measureText(u).width,c=Math.cos(e.toRadians(i.options.ticks.maxRotation)),h=Math.sin(e.toRadians(i.options.ticks.maxRotation));d=d*c+n*h;var f=l/d;i.tickUnit=i.options.time.minUnit,i.scaleSizeInUnits=i.lastTick.diff(i.firstTick,i.tickUnit,!0),i.displayFormat=i.options.time.displayFormats[i.tickUnit];for(var g=0,p=a.units[g];g<a.units.length;){if(i.unitScale=1,e.isArray(p.steps)&&Math.ceil(i.scaleSizeInUnits/f)<e.max(p.steps)){for(var m=0;m<p.steps.length;++m)if(p.steps[m]>=Math.ceil(i.scaleSizeInUnits/f)){i.unitScale=e.getValueOrDefault(i.options.time.unitStepSize,p.steps[m]);break}break}if(p.maxStep===!1||Math.ceil(i.scaleSizeInUnits/f)<p.maxStep){i.unitScale=e.getValueOrDefault(i.options.time.unitStepSize,Math.ceil(i.scaleSizeInUnits/f));break}++g,p=a.units[g],i.tickUnit=p.name;var v=i.firstTick.diff(i.getMomentStartOf(i.firstTick),i.tickUnit,!0),b=i.getMomentStartOf(i.lastTick.clone().add(1,i.tickUnit)).diff(i.lastTick,i.tickUnit,!0);i.scaleSizeInUnits=i.lastTick.diff(i.firstTick,i.tickUnit,!0)+v+b,i.displayFormat=i.options.time.displayFormats[p.name]}}var x;if(i.options.time.min?x=i.getMomentStartOf(i.firstTick):(i.firstTick=i.getMomentStartOf(i.firstTick),x=i.firstTick),!i.options.time.max){var y=i.getMomentStartOf(i.lastTick),k=y.diff(i.lastTick,i.tickUnit,!0);k<0?i.lastTick=i.getMomentStartOf(i.lastTick.add(1,i.tickUnit)):k>=0&&(i.lastTick=y),i.scaleSizeInUnits=i.lastTick.diff(i.firstTick,i.tickUnit,!0)}i.options.time.displayFormat&&(i.displayFormat=i.options.time.displayFormat),i.ticks.push(i.firstTick.clone());for(var S=i.unitScale;S<=i.scaleSizeInUnits;S+=i.unitScale){var M=x.clone().add(S,i.tickUnit);if(i.options.time.max&&M.diff(i.lastTick,i.tickUnit,!0)>=0)break;i.ticks.push(M)}var w=i.ticks[i.ticks.length-1].diff(i.lastTick,i.tickUnit);0===w&&0!==i.scaleSizeInUnits||(i.options.time.max?(i.ticks.push(i.lastTick.clone()),i.scaleSizeInUnits=i.lastTick.diff(i.ticks[0],i.tickUnit,!0)):(i.ticks.push(i.lastTick.clone()),i.scaleSizeInUnits=i.lastTick.diff(i.firstTick,i.tickUnit,!0))),i.ctx.restore(),i.labelDiffs=void 0},getLabelForIndex:function(t,e){var a=this,i=a.chart.data.labels&&t<a.chart.data.labels.length?a.chart.data.labels[t]:"",n=a.chart.data.datasets[e].data[t];return null!==n&&"object"==typeof n&&(i=a.getRightValue(n)),a.options.time.tooltipFormat&&(i=a.parseTime(i).format(a.options.time.tooltipFormat)),i},tickFormatFunction:function(t,a,i){var n=t.format(this.displayFormat),o=this.options.ticks,r=e.getValueOrDefault(o.callback,o.userCallback);return r?r(n,a,i):n},convertTicksToLabels:function(){var t=this;t.tickMoments=t.ticks,t.ticks=t.ticks.map(t.tickFormatFunction,t)},getPixelForValue:function(t,e,a){var i=this,n=null;if(void 0!==e&&void 0!==a&&(n=i.getLabelDiff(a,e)),null===n&&(t&&t.isValid||(t=i.parseTime(i.getRightValue(t))),t&&t.isValid&&t.isValid()&&(n=t.diff(i.firstTick,i.tickUnit,!0))),null!==n){var o=0!==n?n/i.scaleSizeInUnits:n;if(i.isHorizontal()){var r=i.width*o;return i.left+Math.round(r)}var s=i.height*o;return i.top+Math.round(s)}},getPixelForTick:function(t){return this.getPixelForValue(this.tickMoments[t],null,null)},getValueForPixel:function(t){var e=this,a=e.isHorizontal()?e.width:e.height,n=(t-(e.isHorizontal()?e.left:e.top))/a;return n*=e.scaleSizeInUnits,e.firstTick.clone().add(i.duration(n,e.tickUnit).asSeconds(),"seconds")},parseTime:function(t){var e=this;return"string"==typeof e.options.time.parser?i(t,e.options.time.parser):"function"==typeof e.options.time.parser?e.options.time.parser(t):"function"==typeof t.getMonth||"number"==typeof t?i(t):t.isValid&&t.isValid()?t:"string"!=typeof e.options.time.format&&e.options.time.format.call?(console.warn("options.time.format is deprecated and replaced by options.time.parser. See http://nnnick.github.io/Chart.js/docs-v2/#scales-time-scale"),e.options.time.format(t)):i(t,e.options.time.format)}});t.scaleService.registerScaleType("time",o,n)}},{1:1}]},{},[7])(7)});;
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
;
(function()
{
 "use strict";
 var Global,Samples,ChartJs,SC$1,WebSharper,Obj,UI,HtmlModule,attr,Operators,Arrays,Expense,Object,ADataSet,Employee,Doc,AttrProxy,AttrModule,JavaScript,Pervasives,Concurrency,Seq,Random,Client,Templates,View,DomUtility,Attrs,AsyncBody,Enumerator,T,List,SC$2,CT,EventTarget,Node,JS,Collections,Dictionary,Unchecked,Snap,Scheduler,T$1,CancellationTokenSource,SC$3,HashSet,WindowOrWorkerGlobalScope,SC$4,Docs,Elt,Array,DocElemNode,CharacterData,Error,OperationCanceledException,DictionaryUtil,Prepare,Slice,KeyCollection,An,Settings,Abbrev,Mailbox,Updates,Attrs$1,Dyn,Strings,Docs$1,RunState,NodeSet,Anims,SC$5,Fresh,SC$6,SC$7,AppendList,Easing,HashSet$1,HashSetUtil,SC$8,DomNodes,Lazy,SC$9,Queue,LazyExtensionsProxy,LazyRecord,Math,IntelliFactory,Runtime,console,$,Date;
 Global=self;
 Samples=Global.Samples=Global.Samples||{};
 ChartJs=Samples.ChartJs=Samples.ChartJs||{};
 SC$1=Global.StartupCode$ChartJS$Client=Global.StartupCode$ChartJS$Client||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 UI=WebSharper.UI=WebSharper.UI||{};
 HtmlModule=UI.HtmlModule=UI.HtmlModule||{};
 attr=HtmlModule.attr=HtmlModule.attr||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Expense=ChartJs.Expense=ChartJs.Expense||{};
 Object=Global.Object;
 ADataSet=Global.ADataSet;
 Employee=ChartJs.Employee=ChartJs.Employee||{};
 Doc=UI.Doc=UI.Doc||{};
 AttrProxy=UI.AttrProxy=UI.AttrProxy||{};
 AttrModule=UI.AttrModule=UI.AttrModule||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 Concurrency=WebSharper.Concurrency=WebSharper.Concurrency||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 Random=WebSharper.Random=WebSharper.Random||{};
 Client=UI.Client=UI.Client||{};
 Templates=Client.Templates=Client.Templates||{};
 View=UI.View=UI.View||{};
 DomUtility=UI.DomUtility=UI.DomUtility||{};
 Attrs=UI.Attrs=UI.Attrs||{};
 AsyncBody=Concurrency.AsyncBody=Concurrency.AsyncBody||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 T=Enumerator.T=Enumerator.T||{};
 List=WebSharper.List=WebSharper.List||{};
 SC$2=Global.StartupCode$WebSharper_Main$Concurrency=Global.StartupCode$WebSharper_Main$Concurrency||{};
 CT=Concurrency.CT=Concurrency.CT||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 JS=JavaScript.JS=JavaScript.JS||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 Dictionary=Collections.Dictionary=Collections.Dictionary||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Snap=UI.Snap=UI.Snap||{};
 Scheduler=Concurrency.Scheduler=Concurrency.Scheduler||{};
 T$1=List.T=List.T||{};
 CancellationTokenSource=WebSharper.CancellationTokenSource=WebSharper.CancellationTokenSource||{};
 SC$3=Global.StartupCode$WebSharper_UI$Templates=Global.StartupCode$WebSharper_UI$Templates||{};
 HashSet=Collections.HashSet=Collections.HashSet||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 SC$4=Global.StartupCode$WebSharper_UI$DomUtility=Global.StartupCode$WebSharper_UI$DomUtility||{};
 Docs=UI.Docs=UI.Docs||{};
 Elt=UI.Elt=UI.Elt||{};
 Array=UI.Array=UI.Array||{};
 DocElemNode=UI.DocElemNode=UI.DocElemNode||{};
 CharacterData=Global.CharacterData;
 Error=Global.Error;
 OperationCanceledException=WebSharper.OperationCanceledException=WebSharper.OperationCanceledException||{};
 DictionaryUtil=Collections.DictionaryUtil=Collections.DictionaryUtil||{};
 Prepare=Templates.Prepare=Templates.Prepare||{};
 Slice=WebSharper.Slice=WebSharper.Slice||{};
 KeyCollection=Collections.KeyCollection=Collections.KeyCollection||{};
 An=UI.An=UI.An||{};
 Settings=Client.Settings=Client.Settings||{};
 Abbrev=UI.Abbrev=UI.Abbrev||{};
 Mailbox=Abbrev.Mailbox=Abbrev.Mailbox||{};
 Updates=UI.Updates=UI.Updates||{};
 Attrs$1=Client.Attrs=Client.Attrs||{};
 Dyn=Attrs$1.Dyn=Attrs$1.Dyn||{};
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 Docs$1=Client.Docs=Client.Docs||{};
 RunState=Docs$1.RunState=Docs$1.RunState||{};
 NodeSet=Docs$1.NodeSet=Docs$1.NodeSet||{};
 Anims=UI.Anims=UI.Anims||{};
 SC$5=Global.StartupCode$WebSharper_UI$Doc_Proxy=Global.StartupCode$WebSharper_UI$Doc_Proxy||{};
 Fresh=Abbrev.Fresh=Abbrev.Fresh||{};
 SC$6=Global.StartupCode$WebSharper_UI$Attr_Client=Global.StartupCode$WebSharper_UI$Attr_Client||{};
 SC$7=Global.StartupCode$WebSharper_UI$Animation=Global.StartupCode$WebSharper_UI$Animation||{};
 AppendList=UI.AppendList=UI.AppendList||{};
 Easing=UI.Easing=UI.Easing||{};
 HashSet$1=Abbrev.HashSet=Abbrev.HashSet||{};
 HashSetUtil=Collections.HashSetUtil=Collections.HashSetUtil||{};
 SC$8=Global.StartupCode$WebSharper_UI$Abbrev=Global.StartupCode$WebSharper_UI$Abbrev||{};
 DomNodes=Docs$1.DomNodes=Docs$1.DomNodes||{};
 Lazy=WebSharper.Lazy=WebSharper.Lazy||{};
 SC$9=Global.StartupCode$WebSharper_UI$AppendList=Global.StartupCode$WebSharper_UI$AppendList||{};
 Queue=WebSharper.Queue=WebSharper.Queue||{};
 LazyExtensionsProxy=WebSharper.LazyExtensionsProxy=WebSharper.LazyExtensionsProxy||{};
 LazyRecord=LazyExtensionsProxy.LazyRecord=LazyExtensionsProxy.LazyRecord||{};
 Math=Global.Math;
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 console=Global.console;
 $=Global.jQuery;
 Date=Global.Date;
 ChartJs.Main=function()
 {
  SC$1.$cctor();
  return SC$1.Main;
 };
 ChartJs.GetAllExpenses=function()
 {
  new Random.New();
  return Concurrency.Return(Arrays.ofSeq(Seq.delay(function()
  {
   return Seq.map(function(index)
   {
    return Expense.New("Jan "+Global.String(index)+", 2015",Math.random()*100);
   },List.ofSeq(Operators.range(1,7)));
  })));
 };
 ChartJs.GetAllEmployees=function()
 {
  return Concurrency.Return([Employee.New("Sandor",20),Employee.New("Loic",25),Employee.New("Istvan",21),Employee.New("Andras",29)]);
 };
 ChartJs.LineChart=function()
 {
  SC$1.$cctor();
  return SC$1.LineChart;
 };
 ChartJs.BarChart=function()
 {
  SC$1.$cctor();
  return SC$1.BarChart;
 };
 ChartJs.RadarChart=function()
 {
  SC$1.$cctor();
  return SC$1.RadarChart;
 };
 SC$1.$cctor=function()
 {
  var a;
  SC$1.$cctor=Global.ignore;
  SC$1.LineChart=Doc.Element("div",[],[Doc.Element("h3",[],[Doc.TextNode("My expenses as a line chart (in US dollars)")]),Doc.Element("canvas",[AttrProxy.Create("width","450"),AttrProxy.Create("height","300"),AttrModule.OnAfterRender(function(canvas)
  {
   var b;
   Concurrency.Start((b=null,Concurrency.Delay(function()
   {
    var context;
    context=canvas.getContext("2d");
    return Concurrency.Bind(ChartJs.GetAllExpenses(),function(a$1)
    {
     var p,cd,r;
     p=Arrays.unzip(Arrays.map(function(expense)
     {
      return[expense.Date,Global.Number(expense.Amount.toFixed(2))];
     },a$1));
     cd={
      datasets:[(r={},r.backgroundColor="#d6e8f6",r.pointBackgroundColor="#b0c4de",r.data=p[1],r)],
      labels:p[0]
     };
     new Global.Chart(context.canvas,{
      type:"line",
      data:cd,
      options:{}
     });
     return Concurrency.Zero();
    });
   })),null);
  })],[])]);
  SC$1.BarChart=Doc.Element("div",[],[Doc.Element("h3",[],[Doc.TextNode("Employees and their ages")]),Doc.Element("canvas",[AttrProxy.Create("width","450"),AttrProxy.Create("height","300"),AttrModule.OnAfterRender(function(canvas)
  {
   var b;
   Concurrency.Start((b=null,Concurrency.Delay(function()
   {
    var context;
    context=canvas.getContext("2d");
    return Concurrency.Bind(ChartJs.GetAllEmployees(),function(a$1)
    {
     var p,x,r;
     p=Arrays.unzip(Arrays.map(function(employee)
     {
      return[employee.Name,employee.Age];
     },a$1));
     x={
      datasets:[(r={},r.backgroundColor="#d6e8f6",r.data=p[1],r)],
      labels:p[0]
     };
     new Global.Chart(context.canvas,{
      type:"bar",
      data:x,
      options:{}
     });
     return Concurrency.Zero();
    });
   })),null);
  })],[])]);
  SC$1.RadarChart=Doc.Element("div",[],[Doc.Element("h3",[],[Doc.TextNode("Advanced usage (radar chart)")]),Doc.Element("canvas",[AttrProxy.Create("width","450"),AttrProxy.Create("height","300"),AttrModule.OnAfterRender(function(canvas)
  {
   var context,x,r,r$1;
   context=canvas.getContext("2d");
   x={
    datasets:[(r={},r.backgroundColor="rgba(151, 187, 205, 0.2)",r.borderColor="rgba(151, 187, 205, 1)",r.pointBackgroundColor="rgba(151, 187, 205, 1)",r.data=[28,48,40,19,96,27,100],r),(r$1={},r$1.backgroundColor="rgba(220, 220, 220, 0.2)",r$1.borderColor="rgba(220, 220, 220, 1)",r$1.pointBackgroundColor="rgba(220,220,220,1)",r$1.data=[65,59,90,81,56,55,40],r$1)],
    labels:["Eating","Drinking","Sleeping","Designing","Coding","Cycling","Running"]
   };
   new Global.Chart(context.canvas,{
    type:"radar",
    data:x,
    options:{}
   });
  })],[])]);
  SC$1.Main=(a=Doc.Element("div",[],[ChartJs.LineChart(),ChartJs.BarChart(),ChartJs.RadarChart()]),(Templates.LoadLocalTemplates(""),Doc.RunById("main",a)));
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  },
  GetHashCode:function()
  {
   return -1;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 attr=HtmlModule.attr=Runtime.Class({},Obj,attr);
 Operators.range=function(min,max)
 {
  var count;
  count=1+max-min;
  return count<=0?[]:Seq.init(count,function(x)
  {
   return x+min;
  });
 };
 Operators.FailWith=function(msg)
 {
  throw new Error(msg);
 };
 Operators.KeyValue=function(kvp)
 {
  return[kvp.K,kvp.V];
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.unzip=function(arr)
 {
  var x,y,i,$1,p;
  x=[];
  y=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   p=arr[i];
   x.push(p[0]);
   y.push(p[1]);
  }
  return[x,y];
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T$1)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Arrays.tryPick=function(f,arr)
 {
  var res,i,m;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    m=f(arr[i]);
    m!=null&&m.$==1?res=m:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.tryFindIndex=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:i
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.filter=function(f,arr)
 {
  var r,i,$1;
  r=[];
  for(i=0,$1=arr.length-1;i<=$1;i++)if(f(arr[i]))
   r.push(arr[i]);
  return r;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.foldBack=function(f,arr,zero)
 {
  var acc,$1,len,i,$2;
  acc=zero;
  len=arr.length;
  for(i=1,$2=len;i<=$2;i++)acc=f(arr[len-i],acc);
  return acc;
 };
 Arrays.pick=function(f,arr)
 {
  var m;
  m=Arrays.tryPick(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   m==null?void 0:q.push(m.$0);
  }
  return q;
 };
 Arrays.concat=function(xs)
 {
  return Global.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.create=function(size,value)
 {
  var r,i,$1;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=value;
  return r;
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Arrays.forall=function(f,x)
 {
  var a,i,$1,l;
  a=true;
  i=0;
  l=Arrays.length(x);
  while(a&&i<l)
   if(f(x[i]))
    i=i+1;
   else
    a=false;
  return a;
 };
 Expense.New=function(Date$1,Amount)
 {
  return{
   Date:Date$1,
   Amount:Amount
  };
 };
 Employee.New=function(Name,Age)
 {
  return{
   Name:Name,
   Age:Age
  };
 };
 Doc=UI.Doc=Runtime.Class({},Obj,Doc);
 Doc.TextNode=function(v)
 {
  return Doc.Mk({
   $:5,
   $0:DomUtility.CreateText(v)
  },View.Const());
 };
 Doc.RunById=function(id,tr)
 {
  var m;
  m=DomUtility.Doc().getElementById(id);
  Unchecked.Equals(m,null)?Operators.FailWith("invalid id: "+id):Doc.Run(m,tr);
 };
 Doc.Element=function(name,attr$1,children)
 {
  var a,a$1;
  a=AttrProxy.Concat(attr$1);
  a$1=Doc.Concat(children);
  return Elt.New(DomUtility.CreateElement(name),a,a$1);
 };
 Doc.Mk=function(node,updates)
 {
  return new Doc.New(node,updates);
 };
 Doc.Run=function(parent,doc)
 {
  Docs.LinkElement(parent,doc.docNode);
  Doc.RunInPlace(false,parent,doc);
 };
 Doc.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Doc.get_Empty(),Doc.Append,x);
 };
 Doc.RunInPlace=function(childrenOnly,parent,doc)
 {
  var st;
  st=Docs.CreateRunState(parent,doc.docNode);
  View.Sink(An.get_UseAnimations()||Settings.BatchUpdatesEnabled()?Mailbox.StartProcessor(Docs.PerformAnimatedUpdate(childrenOnly,st,doc.docNode)):function()
  {
   Docs.PerformSyncUpdate(childrenOnly,st,doc.docNode);
  },doc.updates);
 };
 Doc.Append=function(a,b)
 {
  return Doc.Mk({
   $:0,
   $0:a.docNode,
   $1:b.docNode
  },View.Map2Unit(a.updates,b.updates));
 };
 Doc.get_Empty=function()
 {
  return Doc.Mk(null,View.Const());
 };
 Doc.New=Runtime.Ctor(function(docNode,updates)
 {
  Obj.New.call(this);
  this.docNode=docNode;
  this.updates=updates;
 },Doc);
 AttrProxy=UI.AttrProxy=Runtime.Class({},null,AttrProxy);
 AttrProxy.Create=function(name,value)
 {
  return Attrs.Static(function(el)
  {
   DomUtility.SetAttr(el,name,value);
  });
 };
 AttrProxy.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Attrs.EmptyAttr(),AttrProxy.Append,x);
 };
 AttrProxy.Append=function(a,b)
 {
  return Attrs.AppendTree(a,b);
 };
 AttrModule.OnAfterRender=function(callback)
 {
  return new AttrProxy({
   $:4,
   $0:callback
  });
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Concurrency.Delay=function(mk)
 {
  return function(c)
  {
   try
   {
    (mk(null))(c);
   }
   catch(e)
   {
    c.k({
     $:1,
     $0:e
    });
   }
  };
 };
 Concurrency.Bind=function(r,f)
 {
  return Concurrency.checkCancel(function(c)
  {
   r(AsyncBody.New(function(a)
   {
    var x;
    if(a.$==0)
     {
      x=a.$0;
      Concurrency.scheduler().Fork(function()
      {
       try
       {
        (f(x))(c);
       }
       catch(e)
       {
        c.k({
         $:1,
         $0:e
        });
       }
      });
     }
    else
     Concurrency.scheduler().Fork(function()
     {
      c.k(a);
     });
   },c.ct));
  });
 };
 Concurrency.Zero=function()
 {
  SC$2.$cctor();
  return SC$2.Zero;
 };
 Concurrency.Start=function(c,ctOpt)
 {
  var ct,d;
  ct=(d=(Concurrency.defCTS())[0],ctOpt==null?d:ctOpt.$0);
  Concurrency.scheduler().Fork(function()
  {
   if(!ct.c)
    c(AsyncBody.New(function(a)
    {
     if(a.$==1)
      Concurrency.UncaughtAsyncError(a.$0);
    },ct));
  });
 };
 Concurrency.checkCancel=function(r)
 {
  return function(c)
  {
   if(c.ct.c)
    Concurrency.cancel(c);
   else
    r(c);
  };
 };
 Concurrency.Return=function(x)
 {
  return function(c)
  {
   c.k({
    $:0,
    $0:x
   });
  };
 };
 Concurrency.defCTS=function()
 {
  SC$2.$cctor();
  return SC$2.defCTS;
 };
 Concurrency.UncaughtAsyncError=function(e)
 {
  console.log("WebSharper: Uncaught asynchronous exception",e);
 };
 Concurrency.cancel=function(c)
 {
  c.k({
   $:2,
   $0:new OperationCanceledException.New(c.ct)
  });
 };
 Concurrency.scheduler=function()
 {
  SC$2.$cctor();
  return SC$2.scheduler;
 };
 Concurrency.FromContinuations=function(subscribe)
 {
  return function(c)
  {
   var continued;
   function once(cont)
   {
    if(continued[0])
     Operators.FailWith("A continuation provided by Async.FromContinuations was invoked multiple times");
    else
     {
      continued[0]=true;
      Concurrency.scheduler().Fork(cont);
     }
   }
   continued=[false];
   subscribe(function(a)
   {
    once(function()
    {
     c.k({
      $:0,
      $0:a
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:1,
      $0:e
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:2,
      $0:e
     });
    });
   });
  };
 };
 Seq.delay=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return Enumerator.Get(f());
   }
  };
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.init=function(n,f)
 {
  return Seq.take(n,Seq.initInfinite(f));
 };
 Seq.take=function(n,s)
 {
  n<0?Seq.nonNegative():void 0;
  return{
   GetEnumerator:function()
   {
    var e;
    e=[Enumerator.Get(s)];
    return new T.New(0,null,function(o)
    {
     var en;
     o.s=o.s+1;
     return o.s>n?false:(en=e[0],Unchecked.Equals(en,null)?Seq.insufficient():en.MoveNext()?(o.c=en.Current(),o.s===n?(en.Dispose(),e[0]=null):void 0,true):(en.Dispose(),e[0]=null,Seq.insufficient()));
    },function()
    {
     var x;
     x=e[0];
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
    });
   }
  };
 };
 Seq.initInfinite=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return new T.New(0,null,function(e)
    {
     e.c=f(e.s);
     e.s=e.s+1;
     return true;
    },void 0);
   }
  };
 };
 Seq.head=function(s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   return e.MoveNext()?e.Current():Seq.insufficient();
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.fold=function(f,x,s)
 {
  var r,e;
  r=x;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.iter=function(p,s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    p(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.max=function(s)
 {
  var e,m,x;
  e=Enumerator.Get(s);
  try
  {
   if(!e.MoveNext())
    Seq.seqEmpty();
   m=e.Current();
   while(e.MoveNext())
    {
     x=e.Current();
     Unchecked.Compare(x,m)===1?m=x:void 0;
    }
   return m;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.seqEmpty=function()
 {
  return Operators.FailWith("The input sequence was empty.");
 };
 Random=WebSharper.Random=Runtime.Class({},Obj,Random);
 Random.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Random);
 Templates.LoadLocalTemplates=function(baseName)
 {
  !Templates.LocalTemplatesLoaded()?(Templates.set_LocalTemplatesLoaded(true),Templates.LoadNestedTemplates(self.document.body,"")):void 0;
  Templates.LoadedTemplates().set_Item(baseName,Templates.LoadedTemplateFile(""));
 };
 Templates.LocalTemplatesLoaded=function()
 {
  SC$3.$cctor();
  return SC$3.LocalTemplatesLoaded;
 };
 Templates.set_LocalTemplatesLoaded=function($1)
 {
  SC$3.$cctor();
  SC$3.LocalTemplatesLoaded=$1;
 };
 Templates.LoadNestedTemplates=function(root,baseName)
 {
  var loadedTpls,rawTpls,wsTemplates,i,$1,node,name,wsChildrenTemplates,i$1,$2,node$1,name$1,els,instantiated;
  function prepareTemplate(name$2)
  {
   var m,o;
   if(!loadedTpls.ContainsKey(name$2))
    {
     m=(o=null,[rawTpls.TryGetValue(name$2,{
      get:function()
      {
       return o;
      },
      set:function(v)
      {
       o=v;
      }
     }),o]);
     m[0]?(instantiated.Add(name$2),rawTpls.Remove(name$2),Templates.PrepareTemplateStrict(baseName,{
      $:1,
      $0:name$2
     },m[1][0],{
      $:1,
      $0:m[1][1]
     },{
      $:1,
      $0:prepareTemplate
     })):console.warn(instantiated.Contains(name$2)?"Encountered loop when instantiating "+name$2:"Local template does not exist: "+name$2);
    }
  }
  loadedTpls=Templates.LoadedTemplateFile(baseName);
  rawTpls=new Dictionary.New$5();
  wsTemplates=root.querySelectorAll("[ws-template]");
  for(i=0,$1=wsTemplates.length-1;i<=$1;i++){
   node=wsTemplates[i];
   name=node.getAttribute("ws-template").toLowerCase();
   node.removeAttribute("ws-template");
   rawTpls.set_Item(name,[[node],Templates.FakeRootSingle(node)]);
  }
  wsChildrenTemplates=root.querySelectorAll("[ws-children-template]");
  for(i$1=0,$2=wsChildrenTemplates.length-1;i$1<=$2;i$1++){
   node$1=wsChildrenTemplates[i$1];
   name$1=node$1.getAttribute("ws-children-template").toLowerCase();
   node$1.removeAttribute("ws-children-template");
   rawTpls.set_Item(name$1,(els=DomUtility.ChildrenArray(node$1),[els,Templates.FakeRoot(els)]));
  }
  instantiated=new HashSet.New$3();
  while(rawTpls.count>0)
   prepareTemplate(Seq.head(rawTpls.get_Keys()));
 };
 Templates.LoadedTemplates=function()
 {
  SC$3.$cctor();
  return SC$3.LoadedTemplates;
 };
 Templates.LoadedTemplateFile=function(name)
 {
  var m,o,d;
  m=(o=null,[Templates.LoadedTemplates().TryGetValue(name,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?m[1]:(d=new Dictionary.New$5(),(Templates.LoadedTemplates().set_Item(name,d),d));
 };
 Templates.FakeRootSingle=function(el)
 {
  var m,m$1,n;
  el.removeAttribute("ws-template");
  m=el.getAttribute("ws-replace");
  m===null?void 0:(el.removeAttribute("ws-replace"),m$1=el.parentNode,Unchecked.Equals(m$1,null)?void 0:(n=self.document.createElement(el.tagName),n.setAttribute("ws-replace",m),m$1.replaceChild(n,el)));
  return Templates.FakeRoot([el]);
 };
 Templates.FakeRoot=function(els)
 {
  var fakeroot,i,$1;
  fakeroot=self.document.createElement("div");
  for(i=0,$1=els.length-1;i<=$1;i++)fakeroot.appendChild(Arrays.get(els,i));
  return fakeroot;
 };
 Templates.PrepareTemplateStrict=function(baseName,name,els,root,prepareLocalTemplate)
 {
  var fakeroot,name$1;
  function recF(recI,$1)
  {
   var next,m,$2,x,f,name$2,p,instName,instBaseName,d,t,instance,usedHoles,mappings,attrs,i,$3,name$3,m$1,i$1,$4,n,singleTextFill,i$2,$5,n$1;
   function g(v)
   {
   }
   while(true)
    switch(recI)
    {
     case 0:
      if($1!==null)
       {
        next=$1.nextSibling;
        if(Unchecked.Equals($1.nodeType,Node.TEXT_NODE))
         Prepare.convertTextNode($1);
        else
         if(Unchecked.Equals($1.nodeType,Node.ELEMENT_NODE))
          convertElement($1);
        $1=next;
       }
      else
       return null;
      break;
     case 1:
      name$2=Slice.string($1.nodeName,{
       $:1,
       $0:3
      },null).toLowerCase();
      p=(m=name$2.indexOf("."),m===-1?[baseName,name$2]:[Slice.string(name$2,null,{
       $:1,
       $0:m-1
      }),Slice.string(name$2,{
       $:1,
       $0:m+1
      },null)]);
      instName=p[1];
      instBaseName=p[0];
      if(instBaseName!==""&&!Templates.LoadedTemplates().ContainsKey(instBaseName))
       return Prepare.failNotLoaded(instName);
      else
       {
        if(instBaseName===""&&prepareLocalTemplate!=null)
         prepareLocalTemplate.$0(instName);
        d=Templates.LoadedTemplates().get_Item(instBaseName);
        if(!d.ContainsKey(instName))
         return Prepare.failNotLoaded(instName);
        else
         {
          t=d.get_Item(instName);
          instance=t.cloneNode(true);
          usedHoles=new HashSet.New$3();
          mappings=new Dictionary.New$5();
          attrs=$1.attributes;
          for(i=0,$3=attrs.length-1;i<=$3;i++){
           name$3=attrs.item(i).name.toLowerCase();
           mappings.set_Item(name$3,(m$1=attrs.item(i).nodeValue,m$1===""?name$3:m$1.toLowerCase()));
           !usedHoles.Add(name$3)?console.warn("Hole mapped twice",name$3):void 0;
          }
          for(i$1=0,$4=$1.childNodes.length-1;i$1<=$4;i$1++){
           n=$1.childNodes[i$1];
           Unchecked.Equals(n.nodeType,Node.ELEMENT_NODE)?!usedHoles.Add(n.nodeName.toLowerCase())?console.warn("Hole filled twice",instName):void 0:void 0;
          }
          singleTextFill=$1.childNodes.length===1&&Unchecked.Equals($1.firstChild.nodeType,Node.TEXT_NODE);
          if(singleTextFill)
           {
            x=Prepare.fillTextHole(instance,$1.firstChild.textContent,instName);
            ((function(a)
            {
             return function(o)
             {
              if(o!=null)
               a(o.$0);
             };
            }((f=function(usedHoles$1)
            {
             return function(a)
             {
              return usedHoles$1.Add(a);
             };
            }(usedHoles),function(x$1)
            {
             return g(f(x$1));
            })))(x));
           }
          Prepare.removeHolesExcept(instance,usedHoles);
          if(!singleTextFill)
           {
            for(i$2=0,$5=$1.childNodes.length-1;i$2<=$5;i$2++){
             n$1=$1.childNodes[i$2];
             Unchecked.Equals(n$1.nodeType,Node.ELEMENT_NODE)?n$1.hasAttributes()?Prepare.fillInstanceAttrs(instance,n$1):fillDocHole(instance,n$1):void 0;
            }
           }
          Prepare.mapHoles(instance,mappings);
          Prepare.fill(instance,$1.parentNode,$1);
          $1.parentNode.removeChild($1);
          return;
         }
       }
      break;
    }
  }
  function fillDocHole(instance,fillWith)
  {
   var m,name$2,m$1;
   function fillHole(p,n)
   {
    var parsed,i,$1;
    if(name$2==="title"&&fillWith.hasChildNodes())
     {
      parsed=$.parseHTML(fillWith.textContent);
      fillWith.removeChild(fillWith.firstChild);
      for(i=0,$1=parsed.length-1;i<=$1;i++)fillWith.appendChild(Arrays.get(parsed,i));
     }
    else
     null;
    convertElement(fillWith);
    return Prepare.fill(fillWith,p,n);
   }
   name$2=fillWith.nodeName.toLowerCase();
   DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1,attrName,_this;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
     attrName=Arrays.get(holeAttrs,i);
     e.setAttribute(attrName,(_this=new Global.RegExp("\\${"+name$2+"}","ig"),e.getAttribute(attrName).replace(_this,fillWith.textContent)));
    }
   });
   m$1=instance.querySelector("[ws-hole="+name$2+"]");
   if(Unchecked.Equals(m$1,null))
    {
     m=instance.querySelector("[ws-replace="+name$2+"]");
     return Unchecked.Equals(m,null)?null:(fillHole(m.parentNode,m),void m.parentNode.removeChild(m));
    }
   else
    {
     while(m$1.hasChildNodes())
      m$1.removeChild(m$1.lastChild);
     m$1.removeAttribute("ws-hole");
     return fillHole(m$1,null);
    }
  }
  function convertElement(el)
  {
   if(Strings.StartsWith(el.nodeName.toLowerCase(),"ws-"))
    convertInstantiation(el);
   else
    {
     Prepare.convertAttrs(el);
     convertNodeAndSiblings(el.firstChild);
    }
  }
  function convertNodeAndSiblings(n)
  {
   return recF(0,n);
  }
  function convertInstantiation(el)
  {
   return recF(1,el);
  }
  fakeroot=root==null?Templates.FakeRoot(els):root.$0;
  name$1=(name==null?"":name.$0).toLowerCase();
  Templates.LoadedTemplateFile(baseName).set_Item(name$1,fakeroot);
  Arrays.length(els)>0?(function(el)
  {
   var m,m$1,name$2,name$3;
   while(true)
    {
     m=el.querySelector("[ws-template]");
     if(Unchecked.Equals(m,null))
      {
       m$1=el.querySelector("[ws-children-template]");
       if(Unchecked.Equals(m$1,null))
        return null;
       else
        {
         name$2=m$1.getAttribute("ws-children-template");
         m$1.removeAttribute("ws-children-template");
         Templates.PrepareTemplateStrict(baseName,{
          $:1,
          $0:name$2
         },DomUtility.ChildrenArray(m$1),null,null);
         el=el;
        }
      }
     else
      {
       name$3=m.getAttribute("ws-template");
       (Templates.PrepareSingleTemplate(baseName,{
        $:1,
        $0:name$3
       },m))(null);
       el=el;
      }
    }
  }(fakeroot),convertNodeAndSiblings(Arrays.get(els,0))):void 0;
 };
 Templates.PrepareSingleTemplate=function(baseName,name,el)
 {
  var root,e,r;
  root=Templates.FakeRootSingle(el);
  e=[el];
  r={
   $:1,
   $0:root
  };
  return function(p)
  {
   Templates.PrepareTemplateStrict(baseName,name,e,r,p);
  };
 };
 Templates.TextHoleRE=function()
 {
  SC$3.$cctor();
  return SC$3.TextHoleRE;
 };
 View.Const=function(x)
 {
  var o;
  o=Snap.New({
   $:0,
   $0:x
  });
  return function()
  {
   return o;
  };
 };
 View.Sink=function(act,a)
 {
  function loop()
  {
   Snap.WhenRun(a(),act,function()
   {
    Concurrency.scheduler().Fork(loop);
   });
  }
  Concurrency.scheduler().Fork(loop);
 };
 View.Map2Unit=function(a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2Unit(a(),a$1());
  });
 };
 View.CreateLazy=function(observe)
 {
  var lv;
  lv={
   c:null,
   o:observe
  };
  return function()
  {
   var c,$1;
   c=lv.c;
   return c===null?(c=lv.o(),lv.c=c,($1=c.s,$1!=null&&$1.$==0)?lv.o=null:Snap.WhenObsoleteRun(c,function()
   {
    lv.c=null;
   }),c):c;
  };
 };
 DomUtility.CreateText=function(s)
 {
  return DomUtility.Doc().createTextNode(s);
 };
 DomUtility.SetAttr=function(el,name,value)
 {
  el.setAttribute(name,value);
 };
 DomUtility.Doc=function()
 {
  SC$4.$cctor();
  return SC$4.Doc;
 };
 DomUtility.CreateElement=function(name)
 {
  return DomUtility.Doc().createElement(name);
 };
 DomUtility.ChildrenArray=function(element)
 {
  var a,i,$1;
  a=[];
  for(i=0,$1=element.childNodes.length-1;i<=$1;i++)a.push(element.childNodes[i]);
  return a;
 };
 DomUtility.IterSelector=function(el,selector,f)
 {
  var l,i,$1;
  l=el.querySelectorAll(selector);
  for(i=0,$1=l.length-1;i<=$1;i++)f(l[i]);
 };
 DomUtility.InsertAt=function(parent,pos,node)
 {
  var m;
  if(!(node.parentNode===parent&&pos===(m=node.nextSibling,Unchecked.Equals(m,null)?null:m)))
   parent.insertBefore(node,pos);
 };
 DomUtility.RemoveNode=function(parent,el)
 {
  if(el.parentNode===parent)
   parent.removeChild(el);
 };
 Attrs.Static=function(attr$1)
 {
  return new AttrProxy({
   $:3,
   $0:attr$1
  });
 };
 Attrs.Updates=function(dyn)
 {
  return Array.MapTreeReduce(function(x)
  {
   return x.NChanged();
  },View.Const(),View.Map2Unit,dyn.DynNodes);
 };
 Attrs.AppendTree=function(a,b)
 {
  var x;
  return a===null?b:b===null?a:(x=new AttrProxy({
   $:2,
   $0:a,
   $1:b
  }),(Attrs.SetFlags(x,Attrs.Flags(a)|Attrs.Flags(b)),x));
 };
 Attrs.EmptyAttr=function()
 {
  SC$6.$cctor();
  return SC$6.EmptyAttr;
 };
 Attrs.Insert=function(elem,tree)
 {
  var nodes,oar,arr;
  function loop(node)
  {
   if(!(node===null))
    if(node!=null&&node.$==1)
     nodes.push(node.$0);
    else
     if(node!=null&&node.$==2)
      {
       loop(node.$0);
       loop(node.$1);
      }
     else
      if(node!=null&&node.$==3)
       node.$0(elem);
      else
       if(node!=null&&node.$==4)
        oar.push(node.$0);
  }
  nodes=[];
  oar=[];
  loop(tree);
  arr=nodes.slice(0);
  return Dyn.New(elem,Attrs.Flags(tree),arr,oar.length===0?null:{
   $:1,
   $0:function(el)
   {
    Seq.iter(function(f)
    {
     f(el);
    },oar);
   }
  });
 };
 Attrs.SetFlags=function(a,f)
 {
  a.flags=f;
 };
 Attrs.Flags=function(a)
 {
  return a!==null&&a.hasOwnProperty("flags")?a.flags:0;
 };
 Attrs.HasExitAnim=function(attr$1)
 {
  var flag;
  flag=2;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetExitAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetExitAnim($2);
  });
 };
 Attrs.HasEnterAnim=function(attr$1)
 {
  var flag;
  flag=1;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetEnterAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetEnterAnim($2);
  });
 };
 Attrs.HasChangeAnim=function(attr$1)
 {
  var flag;
  flag=4;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetChangeAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetChangeAnim($2);
  });
 };
 Attrs.GetAnim=function(dyn,f)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return f(n,dyn.DynElem);
  },dyn.DynNodes));
 };
 Attrs.Sync=function(elem,dyn)
 {
  Arrays.iter(function(d)
  {
   d.NSync(elem);
  },dyn.DynNodes);
 };
 AsyncBody.New=function(k,ct)
 {
  return{
   k:k,
   ct:ct
  };
 };
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Enumerator.Get0=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):"GetEnumerator0"in x?x.GetEnumerator0():x.GetEnumerator();
 };
 T=Enumerator.T=Runtime.Class({
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  },
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  }
 },Obj,T);
 T.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T);
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T$1)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T$1.Empty;
      else
       {
        res=new T$1({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          e.MoveNext()?r=(t=new T$1({
           $:1
          }),r.$1=t,t):go=false;
         }
        r.$1=T$1.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T$1.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T$1({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.noneCT=CT.New(false,[]);
  SC$2.scheduler=new Scheduler.New();
  SC$2.defCTS=[new CancellationTokenSource.New()];
  SC$2.Zero=Concurrency.Return();
  SC$2.GetCT=function(c)
  {
   c.k({
    $:0,
    $0:c.ct
   });
  };
 };
 CT.New=function(IsCancellationRequested,Registrations)
 {
  return{
   c:IsCancellationRequested,
   r:Registrations
  };
 };
 JS.GetFieldValues=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push(o[k$1]);
  return r;
 };
 Dictionary=Collections.Dictionary=Runtime.Class({
  set_Item:function(k,v)
  {
   this.set(k,v);
  },
  ContainsKey:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:Arrays.exists(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d);
  },
  TryGetValue:function(k,res)
  {
   var $this,d,v;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:(v=Arrays.tryPick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d),v!=null&&v.$==1&&(res.set(v.$0),true));
  },
  Remove:function(k)
  {
   return this.remove(k);
  },
  get_Keys:function()
  {
   return new KeyCollection.New(this);
  },
  set:function(k,v)
  {
   var $this,h,d,m;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   d==null?(this.count=this.count+1,this.data[h]=new Global.Array({
    K:k,
    V:v
   })):(m=Arrays.tryFindIndex(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),m==null?(this.count=this.count+1,d.push({
    K:k,
    V:v
   })):d[m.$0]={
    K:k,
    V:v
   });
  },
  remove:function(k)
  {
   var $this,h,d,r;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   return d==null?false:(r=Arrays.filter(function(a)
   {
    return!$this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),Arrays.length(r)<d.length&&(this.count=this.count-1,this.data[h]=r,true));
  },
  get_Item:function(k)
  {
   return this.get(k);
  },
  get:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?DictionaryUtil.notPresent():Arrays.pick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d);
  },
  GetEnumerator:function()
  {
   return Enumerator.Get0(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(Arrays.concat(JS.GetFieldValues(this.data)));
  }
 },Obj,Dictionary);
 Dictionary.New$5=Runtime.Ctor(function()
 {
  Dictionary.New$6.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },Dictionary);
 Dictionary.New$6=Runtime.Ctor(function(init,equals,hash)
 {
  var e,x;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.count=0;
  this.data=[];
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     this.set(x.K,x.V);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },Dictionary);
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof Global.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s[i].charCodeAt());
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
     case 2:
      return a<b?-1:1;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof Global.Array&&b instanceof Global.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof Global.Date&&b instanceof Global.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
    }
   }
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 View=UI.View=Runtime.Class({},null,View);
 Snap.WhenRun=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?(m.$1.push(obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),m.$1.push(obs)):avail(m.$0);
 };
 Snap.Copy=function(sn)
 {
  var m,res,res$1;
  m=sn.s;
  return m==null?sn:m!=null&&m.$==2?(res=Snap.New({
   $:2,
   $0:m.$0,
   $1:[]
  }),(Snap.WhenObsolete(sn,res),res)):m!=null&&m.$==3?(res$1=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(v)
  {
   Snap.MarkDone(res$1,sn,v);
  },res$1),res$1)):sn;
 };
 Snap.WhenObsoleteRun=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?m.$1.push(obs):m!=null&&m.$==3?m.$1.push(obs):void 0;
 };
 Snap.Map2Unit=function(sn1,sn2)
 {
  var $1,$2,res;
  function cont()
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,null):Snap.MarkReady(res,null):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:null
  }):sn2:$2!=null&&$2.$==0?sn1:(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.WhenObsolete=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?Snap.EnqueueSafe(m.$1,obs):m!=null&&m.$==3?Snap.EnqueueSafe(m.$1,obs):void 0;
 };
 Snap.When=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?(Snap.EnqueueSafe(m.$1,obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),Snap.EnqueueSafe(m.$1,obs)):avail(m.$0);
 };
 Snap.MarkDone=function(res,sn,v)
 {
  var $1;
  if($1=sn.s,$1!=null&&$1.$==0)
   Snap.MarkForever(res,v);
  else
   Snap.MarkReady(res,v);
 };
 Snap.ValueAndForever=function(snap)
 {
  var m;
  m=snap.s;
  return m!=null&&m.$==0?{
   $:1,
   $0:[m.$0,true]
  }:m!=null&&m.$==2?{
   $:1,
   $0:[m.$0,false]
  }:null;
 };
 Snap.MarkForever=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:0,
     $0:v
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.MarkReady=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:2,
     $0:v,
     $1:m.$1
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.EnqueueSafe=function(q,x)
 {
  var qcopy,i,$1,o;
  q.push(x);
  if(q.length%20===0)
   {
    qcopy=q.slice(0);
    Queue.Clear(q);
    for(i=0,$1=Arrays.length(qcopy)-1;i<=$1;i++){
     o=Arrays.get(qcopy,i);
     typeof o=="object"?function(sn)
     {
      if(sn.s)
       q.push(sn);
     }(o):function(f)
     {
      q.push(f);
     }(o);
    }
   }
  else
   void 0;
 };
 Scheduler=Concurrency.Scheduler=Runtime.Class({
  Fork:function(action)
  {
   var $this;
   $this=this;
   this.robin.push(action);
   this.idle?(this.idle=false,Global.setTimeout(function()
   {
    $this.tick();
   },0)):void 0;
  },
  tick:function()
  {
   var loop,$this,t;
   $this=this;
   t=Date.now();
   loop=true;
   while(loop)
    if(this.robin.length===0)
     {
      this.idle=true;
      loop=false;
     }
    else
     {
      (this.robin.shift())();
      Date.now()-t>40?(Global.setTimeout(function()
      {
       $this.tick();
      },0),loop=false):void 0;
     }
  }
 },Obj,Scheduler);
 Scheduler.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.idle=true;
  this.robin=[];
 },Scheduler);
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 T$1=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this);
  }
 },null,T$1);
 T$1.Empty=new T$1({
  $:0
 });
 CancellationTokenSource=WebSharper.CancellationTokenSource=Runtime.Class({},Obj,CancellationTokenSource);
 CancellationTokenSource.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.c=false;
  this.pending=null;
  this.r=[];
  this.init=1;
 },CancellationTokenSource);
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.LoadedTemplates=new Dictionary.New$5();
  SC$3.LocalTemplatesLoaded=false;
  SC$3.TextHoleRE="\\${([^}]+)}";
 };
 HashSet=Collections.HashSet=Runtime.Class({
  Add:function(item)
  {
   return this.add(item);
  },
  Contains:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrContains(item,arr);
  },
  add:function(item)
  {
   var h,arr;
   h=this.hash(item);
   arr=this.data[h];
   return arr==null?(this.data[h]=[item],this.count=this.count+1,true):this.arrContains(item,arr)?false:(arr.push(item),this.count=this.count+1,true);
  },
  arrContains:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     c=false;
    else
     i=i+1;
   return!c;
  },
  ExceptWith:function(xs)
  {
   var e;
   e=Enumerator.Get(xs);
   try
   {
    while(e.MoveNext())
     this.Remove(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
  },
  get_Count:function()
  {
   return this.count;
  },
  CopyTo:function(arr)
  {
   var i,all,i$1,$1;
   i=0;
   all=HashSetUtil.concat(this.data);
   for(i$1=0,$1=all.length-1;i$1<=$1;i$1++)Arrays.set(arr,i$1,all[i$1]);
  },
  IntersectWith:function(xs)
  {
   var other,all,i,$1,item;
   other=new HashSet.New$4(xs,this.equals,this.hash);
   all=HashSetUtil.concat(this.data);
   for(i=0,$1=all.length-1;i<=$1;i++){
    item=all[i];
    !other.Contains(item)?this.Remove(item):void 0;
   }
  },
  Remove:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrRemove(item,arr)&&(this.count=this.count-1,true);
  },
  arrRemove:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     {
      arr.splice.apply(arr,[i,1]);
      c=false;
     }
    else
     i=i+1;
   return!c;
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  }
 },Obj,HashSet);
 HashSet.New$3=Runtime.Ctor(function()
 {
  HashSet.New$4.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 HashSet.New$4=Runtime.Ctor(function(init,equals,hash)
 {
  var e;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.data=[];
  this.count=0;
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    this.add(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },HashSet);
 HashSet.New$2=Runtime.Ctor(function(init)
 {
  HashSet.New$4.call(this,init,Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.Doc=self.document;
 };
 Docs.LinkElement=function(el,children)
 {
  Docs.InsertDoc(el,children,null);
 };
 Docs.InsertDoc=function(parent,doc,pos)
 {
  var d;
  return doc!=null&&doc.$==1?Docs.InsertNode(parent,doc.$0.El,pos):doc!=null&&doc.$==2?(d=doc.$0,(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos))):doc==null?pos:doc!=null&&doc.$==4?Docs.InsertNode(parent,doc.$0.Text,pos):doc!=null&&doc.$==5?Docs.InsertNode(parent,doc.$0,pos):doc!=null&&doc.$==6?Arrays.foldBack(function($1,$2)
  {
   return $1==null||$1.constructor===Object?Docs.InsertDoc(parent,$1,$2):Docs.InsertNode(parent,$1,$2);
  },doc.$0.Els,pos):Docs.InsertDoc(parent,doc.$0,Docs.InsertDoc(parent,doc.$1,pos));
 };
 Docs.CreateRunState=function(parent,doc)
 {
  return RunState.New(NodeSet.get_Empty(),Docs.CreateElemNode(parent,Attrs.EmptyAttr(),doc));
 };
 Docs.PerformAnimatedUpdate=function(childrenOnly,st,doc)
 {
  var b;
  return An.get_UseAnimations()?(b=null,Concurrency.Delay(function()
  {
   var cur,change,enter;
   cur=NodeSet.FindAll(doc);
   change=Docs.ComputeChangeAnim(st,cur);
   enter=Docs.ComputeEnterAnim(st,cur);
   return Concurrency.Bind(An.Play(An.Append(change,Docs.ComputeExitAnim(st,cur))),function()
   {
    return Concurrency.Bind(Docs.SyncElemNodesNextFrame(childrenOnly,st),function()
    {
     return Concurrency.Bind(An.Play(enter),function()
     {
      st.PreviousNodes=cur;
      return Concurrency.Return(null);
     });
    });
   });
  })):Docs.SyncElemNodesNextFrame(childrenOnly,st);
 };
 Docs.PerformSyncUpdate=function(childrenOnly,st,doc)
 {
  var cur;
  cur=NodeSet.FindAll(doc);
  Docs.SyncElemNode(childrenOnly,st.Top);
  st.PreviousNodes=cur;
 };
 Docs.CreateElemNode=function(el,attr$1,children)
 {
  var attr$2;
  Docs.LinkElement(el,children);
  attr$2=Attrs.Insert(el,attr$1);
  return DocElemNode.New(attr$2,children,null,el,Fresh.Int(),Runtime.GetOptional(attr$2.OnAfterRender));
 };
 Docs.InsertNode=function(parent,node,pos)
 {
  DomUtility.InsertAt(parent,pos,node);
  return node;
 };
 Docs.SyncElemNodesNextFrame=function(childrenOnly,st)
 {
  function a(ok)
  {
   Global.requestAnimationFrame(function()
   {
    Docs.SyncElemNode(childrenOnly,st.Top);
    ok();
   });
  }
  return Settings.BatchUpdatesEnabled()?Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  }):(Docs.SyncElemNode(childrenOnly,st.Top),Concurrency.Return(null));
 };
 Docs.ComputeExitAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetExitAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(cur,NodeSet.Filter(function(n)
  {
   return Attrs.HasExitAnim(n.Attr);
  },st.PreviousNodes)))));
 };
 Docs.ComputeEnterAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetEnterAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(st.PreviousNodes,NodeSet.Filter(function(n)
  {
   return Attrs.HasEnterAnim(n.Attr);
  },cur)))));
 };
 Docs.ComputeChangeAnim=function(st,cur)
 {
  var relevant;
  function a(n)
  {
   return Attrs.HasChangeAnim(n.Attr);
  }
  relevant=function(a$1)
  {
   return NodeSet.Filter(a,a$1);
  };
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetChangeAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Intersect(relevant(st.PreviousNodes),relevant(cur)))));
 };
 Docs.SyncElemNode=function(childrenOnly,el)
 {
  !childrenOnly?Docs.SyncElement(el):void 0;
  Docs.Sync(el.Children);
  Docs.AfterRender(el);
 };
 Docs.SyncElement=function(el)
 {
  function hasDirtyChildren(el$1)
  {
   function dirty(doc)
   {
    var d,t;
    return doc!=null&&doc.$==0?dirty(doc.$0)||dirty(doc.$1):doc!=null&&doc.$==2?(d=doc.$0,d.Dirty||dirty(d.Current)):doc!=null&&doc.$==6&&(t=doc.$0,t.Dirty||Arrays.exists(hasDirtyChildren,t.Holes));
   }
   return dirty(el$1.Children);
  }
  Attrs.Sync(el.El,el.Attr);
  hasDirtyChildren(el)?Docs.DoSyncElement(el):void 0;
 };
 Docs.Sync=function(doc)
 {
  var d,t;
  if(doc!=null&&doc.$==1)
   Docs.SyncElemNode(false,doc.$0);
  else
   if(doc!=null&&doc.$==2)
    Docs.Sync(doc.$0.Current);
   else
    if(doc==null)
     ;
    else
     if(doc!=null&&doc.$==5)
      ;
     else
      if(doc!=null&&doc.$==4)
       {
        d=doc.$0;
        d.Dirty?(d.Text.nodeValue=d.Value,d.Dirty=false):void 0;
       }
      else
       if(doc!=null&&doc.$==6)
        {
         t=doc.$0;
         Arrays.iter(function(e)
         {
          Docs.SyncElemNode(false,e);
         },t.Holes);
         Arrays.iter(function(t$1)
         {
          Attrs.Sync(t$1[0],t$1[1]);
         },t.Attrs);
         Docs.AfterRender(t);
        }
       else
        {
         Docs.Sync(doc.$0);
         Docs.Sync(doc.$1);
        }
 };
 Docs.AfterRender=function(el)
 {
  var m;
  m=Runtime.GetOptional(el.Render);
  m!=null&&m.$==1?(m.$0(el.El),Runtime.SetOptional(el,"Render",null)):void 0;
 };
 Docs.DoSyncElement=function(el)
 {
  var parent,p,m;
  function ins(doc,pos)
  {
   var d,t;
   return doc!=null&&doc.$==1?doc.$0.El:doc!=null&&doc.$==2?(d=doc.$0,d.Dirty?(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos)):ins(d.Current,pos)):doc==null?pos:doc!=null&&doc.$==4?doc.$0.Text:doc!=null&&doc.$==5?doc.$0:doc!=null&&doc.$==6?(t=doc.$0,(t.Dirty?t.Dirty=false:void 0,Arrays.foldBack(function($1,$2)
   {
    return $1==null||$1.constructor===Object?ins($1,$2):$1;
   },t.Els,pos))):ins(doc.$0,ins(doc.$1,pos));
  }
  parent=el.El;
  DomNodes.Iter((p=el.El,function(e)
  {
   DomUtility.RemoveNode(p,e);
  }),DomNodes.Except(DomNodes.DocChildren(el),DomNodes.Children(el.El,Runtime.GetOptional(el.Delimiters))));
  ins(el.Children,(m=Runtime.GetOptional(el.Delimiters),m!=null&&m.$==1?m.$0[1]:null));
 };
 Elt=UI.Elt=Runtime.Class({},Doc,Elt);
 Elt.New=function(el,attr$1,children)
 {
  var node,rvUpdates;
  node=Docs.CreateElemNode(el,attr$1,children.docNode);
  rvUpdates=Updates.Create(children.updates);
  return new Elt.New$1({
   $:1,
   $0:node
  },View.Map2Unit(Attrs.Updates(node.Attr),rvUpdates.v),el,rvUpdates);
 };
 Elt.New$1=Runtime.Ctor(function(docNode,updates,elt,rvUpdates)
 {
  Doc.New.call(this,docNode,updates);
  this.docNode$1=docNode;
  this.updates$1=updates;
  this.elt=elt;
  this.rvUpdates=rvUpdates;
 },Elt);
 Array.ofSeqNonCopying=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs;
  else
   if(xs instanceof T$1)
    return Arrays.ofList(xs);
   else
    if(xs===null)
     return[];
    else
     {
      q=[];
      o=Enumerator.Get(xs);
      try
      {
       while(o.MoveNext())
        q.push(o.Current());
       return q;
      }
      finally
      {
       if(typeof o=="object"&&"Dispose"in o)
        o.Dispose();
      }
     }
 };
 Array.TreeReduce=function(defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?Arrays.get(array,off):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 Array.MapTreeReduce=function(mapping,defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?mapping(Arrays.get(array,off)):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 DocElemNode=UI.DocElemNode=Runtime.Class({
  Equals:function(o)
  {
   return this.ElKey===o.ElKey;
  },
  GetHashCode:function()
  {
   return this.ElKey;
  }
 },null,DocElemNode);
 DocElemNode.New=function(Attr,Children,Delimiters,El,ElKey,Render)
 {
  var $1;
  return new DocElemNode(($1={
   Attr:Attr,
   Children:Children,
   El:El,
   ElKey:ElKey
  },(Runtime.SetOptional($1,"Delimiters",Delimiters),Runtime.SetOptional($1,"Render",Render),$1)));
 };
 OperationCanceledException=WebSharper.OperationCanceledException=Runtime.Class({},Error,OperationCanceledException);
 OperationCanceledException.New=Runtime.Ctor(function(ct)
 {
  OperationCanceledException.New$1.call(this,"The operation was canceled.",null,ct);
 },OperationCanceledException);
 OperationCanceledException.New$1=Runtime.Ctor(function(message,inner,ct)
 {
  this.message=message;
  this.inner=inner;
  Object.setPrototypeOf(this,OperationCanceledException.prototype);
  this.ct=ct;
 },OperationCanceledException);
 Seq.nonNegative=function()
 {
  return Operators.FailWith("The input must be non-negative.");
 };
 Seq.insufficient=function()
 {
  return Operators.FailWith("The input sequence has an insufficient number of elements.");
 };
 DictionaryUtil.notPresent=function()
 {
  return Operators.FailWith("The given key was not present in the dictionary.");
 };
 Prepare.convertTextNode=function(n)
 {
  var m,li,$1,s,strRE,hole;
  m=null;
  li=0;
  s=n.textContent;
  strRE=new Global.RegExp(Templates.TextHoleRE(),"g");
  while(m=strRE.exec(s),m!==null)
   {
    n.parentNode.insertBefore(self.document.createTextNode(Slice.string(s,{
     $:1,
     $0:li
    },{
     $:1,
     $0:strRE.lastIndex-Arrays.get(m,0).length-1
    })),n);
    li=strRE.lastIndex;
    hole=self.document.createElement("span");
    hole.setAttribute("ws-replace",Arrays.get(m,1).toLowerCase());
    n.parentNode.insertBefore(hole,n);
   }
  strRE.lastIndex=0;
  n.textContent=Slice.string(s,{
   $:1,
   $0:li
  },null);
 };
 Prepare.failNotLoaded=function(name)
 {
  console.warn("Instantiating non-loaded template",name);
 };
 Prepare.fillTextHole=function(instance,fillWith,templateName)
 {
  var m;
  m=instance.querySelector("[ws-replace]");
  return Unchecked.Equals(m,null)?(console.warn("Filling non-existent text hole",templateName),null):(m.parentNode.replaceChild(new Global.Text(fillWith),m),{
   $:1,
   $0:m.getAttribute("ws-replace")
  });
 };
 Prepare.removeHolesExcept=function(instance,dontRemove)
 {
  function run(attrName)
  {
   DomUtility.IterSelector(instance,"["+attrName+"]",function(e)
   {
    if(!dontRemove.Contains(e.getAttribute(attrName)))
     e.removeAttribute(attrName);
   });
  }
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  DomUtility.IterSelector(instance,"[ws-hole]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-hole")))
    {
     e.removeAttribute("ws-hole");
     while(e.hasChildNodes())
      e.removeChild(e.lastChild);
    }
  });
  DomUtility.IterSelector(instance,"[ws-replace]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-replace")))
    e.parentNode.removeChild(e);
  });
  DomUtility.IterSelector(instance,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.filter(function(x)
   {
    return dontRemove.Contains(Arrays.get(Strings.SplitChars(x,[":"],1),1));
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1,attrName,_this;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
    attrName=Arrays.get(holeAttrs,i);
    e.setAttribute(attrName,(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),e.getAttribute(attrName).replace(_this,function($2,$3)
    {
     return dontRemove.Contains($3)?$2:"";
    })));
   }
  });
 };
 Prepare.fillInstanceAttrs=function(instance,fillWith)
 {
  var name,m,i,$1,a;
  Prepare.convertAttrs(fillWith);
  name=fillWith.nodeName.toLowerCase();
  m=instance.querySelector("[ws-attr="+name+"]");
  if(Unchecked.Equals(m,null))
   console.warn("Filling non-existent attr hole",name);
  else
   {
    m.removeAttribute("ws-attr");
    for(i=0,$1=fillWith.attributes.length-1;i<=$1;i++){
     a=fillWith.attributes.item(i);
     a.name==="class"&&m.hasAttribute("class")?m.setAttribute("class",m.getAttribute("class")+" "+a.nodeValue):m.setAttribute(a.name,a.nodeValue);
    }
   }
 };
 Prepare.mapHoles=function(t,mappings)
 {
  function run(attrName)
  {
   DomUtility.IterSelector(t,"["+attrName+"]",function(e)
   {
    var m,o;
    m=(o=null,[mappings.TryGetValue(e.getAttribute(attrName).toLowerCase(),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    m[0]?e.setAttribute(attrName,m[1]):void 0;
   });
  }
  run("ws-hole");
  run("ws-replace");
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  DomUtility.IterSelector(t,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.map(function(x)
   {
    var a,m,o;
    a=Strings.SplitChars(x,[":"],1);
    m=(o=null,[mappings.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?Arrays.get(a,0)+":"+m[1]:x;
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  DomUtility.IterSelector(t,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++)(function()
   {
    var attrName;
    function f(s,a)
    {
     var a$1;
     a$1=Operators.KeyValue(a);
     return s.replace(new Global.RegExp("\\${"+a$1[0]+"}","ig"),"${"+a$1[1]+"}");
    }
    attrName=Arrays.get(holeAttrs,i);
    return e.setAttribute(attrName,(((Runtime.Curried3(Seq.fold))(f))(e.getAttribute(attrName)))(mappings));
   }());
  });
 };
 Prepare.fill=function(fillWith,p,n)
 {
  while(true)
   if(fillWith.hasChildNodes())
    n=p.insertBefore(fillWith.lastChild,n);
   else
    return null;
 };
 Prepare.convertAttrs=function(el)
 {
  var attrs,toRemove,events,holedAttrs,i,$1,a,_this;
  function lowercaseAttr(name)
  {
   var m;
   m=el.getAttribute(name);
   m===null?void 0:el.setAttribute(name,m.toLowerCase());
  }
  attrs=el.attributes;
  toRemove=[];
  events=[];
  holedAttrs=[];
  for(i=0,$1=attrs.length-1;i<=$1;i++){
   a=attrs.item(i);
   Strings.StartsWith(a.nodeName,"ws-on")&&a.nodeName!=="ws-onafterrender"&&a.nodeName!=="ws-on"?(toRemove.push(a.nodeName),events.push(Slice.string(a.nodeName,{
    $:1,
    $0:"ws-on".length
   },null)+":"+a.nodeValue.toLowerCase())):!Strings.StartsWith(a.nodeName,"ws-")&&(new Global.RegExp(Templates.TextHoleRE())).test(a.nodeValue)?(a.nodeValue=(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),a.nodeValue.replace(_this,function($2,$3)
   {
    return"${"+$3.toLowerCase()+"}";
   })),holedAttrs.push(a.nodeName)):void 0;
  }
  !(events.length==0)?el.setAttribute("ws-on",Strings.concat(" ",events)):void 0;
  !(holedAttrs.length==0)?el.setAttribute("ws-attr-holes",Strings.concat(" ",holedAttrs)):void 0;
  lowercaseAttr("ws-hole");
  lowercaseAttr("ws-replace");
  lowercaseAttr("ws-attr");
  lowercaseAttr("ws-onafterrender");
  lowercaseAttr("ws-var");
  Arrays.iter(function(a$1)
  {
   el.removeAttribute(a$1);
  },toRemove);
 };
 Slice.string=function(source,start,finish)
 {
  return start==null?finish!=null&&finish.$==1?source.slice(0,finish.$0+1):"":finish==null?source.slice(start.$0):source.slice(start.$0,finish.$0+1);
 };
 KeyCollection=Collections.KeyCollection=Runtime.Class({
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kvp)
   {
    return kvp.K;
   },this.d));
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  }
 },Obj,KeyCollection);
 KeyCollection.New=Runtime.Ctor(function(d)
 {
  Obj.New.call(this);
  this.d=d;
 },KeyCollection);
 An.get_UseAnimations=function()
 {
  return Anims.UseAnimations();
 };
 An.Play=function(anim)
 {
  var b;
  b=null;
  return Concurrency.Delay(function()
  {
   return Concurrency.Bind(An.Run(Global.ignore,Anims.Actions(anim)),function()
   {
    Anims.Finalize(anim);
    return Concurrency.Return(null);
   });
  });
 };
 An.Append=function(a,a$1)
 {
  return{
   $:0,
   $0:AppendList.Append(a.$0,a$1.$0)
  };
 };
 An.Run=function(k,anim)
 {
  var dur;
  function a(ok)
  {
   function loop(start,now)
   {
    var t;
    t=now-start;
    anim.Compute(t);
    k();
    return t<=dur?void Global.requestAnimationFrame(function(t$1)
    {
     loop(start,t$1);
    }):ok();
   }
   Global.requestAnimationFrame(function(t)
   {
    loop(t,t);
   });
  }
  dur=anim.Duration;
  return dur===0?Concurrency.Zero():Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  });
 };
 An.Concat=function(xs)
 {
  return{
   $:0,
   $0:AppendList.Concat(Seq.map(Anims.List,xs))
  };
 };
 Settings.BatchUpdatesEnabled=function()
 {
  SC$5.$cctor();
  return SC$5.BatchUpdatesEnabled;
 };
 Mailbox.StartProcessor=function(procAsync)
 {
  var st;
  function work()
  {
   var b;
   b=null;
   return Concurrency.Delay(function()
   {
    return Concurrency.Bind(procAsync,function()
    {
     var m;
     m=st[0];
     return m===1?(st[0]=0,Concurrency.Zero()):m===2?(st[0]=1,work()):Concurrency.Zero();
    });
   });
  }
  st=[0];
  return function()
  {
   var m;
   m=st[0];
   m===0?(st[0]=1,Concurrency.Start(work(),null)):m===1?st[0]=2:void 0;
  };
 };
 Updates=UI.Updates=Runtime.Class({},null,Updates);
 Updates.Create=function(v)
 {
  var _var;
  _var=null;
  _var=Updates.New(v,null,function()
  {
   var c;
   c=_var.s;
   return c===null?(c=Snap.Copy(_var.c()),_var.s=c,Snap.WhenObsoleteRun(c,function()
   {
    _var.s=null;
   }),c):c;
  });
  return _var;
 };
 Updates.New=function(Current,Snap$1,VarView)
 {
  return new Updates({
   c:Current,
   s:Snap$1,
   v:VarView
  });
 };
 Dyn.New=function(DynElem,DynFlags,DynNodes,OnAfterRender)
 {
  var $1;
  $1={
   DynElem:DynElem,
   DynFlags:DynFlags,
   DynNodes:DynNodes
  };
  Runtime.SetOptional($1,"OnAfterRender",OnAfterRender);
  return $1;
 };
 Snap.Obsolete=function(sn)
 {
  var $1,m,i,$2,o;
  m=sn.s;
  if(m==null||(m!=null&&m.$==2?($1=m.$1,false):m!=null&&m.$==3?($1=m.$1,false):true))
   void 0;
  else
   {
    sn.s=null;
    for(i=0,$2=Arrays.length($1)-1;i<=$2;i++){
     o=Arrays.get($1,i);
     typeof o=="object"?function(sn$1)
     {
      Snap.Obsolete(sn$1);
     }(o):o();
    }
   }
 };
 Snap.New=function(State)
 {
  return{
   s:State
  };
 };
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 Strings.SplitChars=function(s,sep,opts)
 {
  return Strings.Split(s,new Global.RegExp("["+Strings.RegexEscape(sep.join(""))+"]"),opts);
 };
 Strings.StartsWith=function(t,s)
 {
  return t.substring(0,s.length)==s;
 };
 Strings.Split=function(s,pat,opts)
 {
  return opts===1?Arrays.filter(function(x)
  {
   return x!=="";
  },Strings.SplitWith(s,pat)):Strings.SplitWith(s,pat);
 };
 Strings.RegexEscape=function(s)
 {
  return s.replace(new Global.RegExp("[-\\/\\\\^$*+?.()|[\\]{}]","g"),"\\$&");
 };
 Strings.SplitWith=function(str,pat)
 {
  return str.split(pat);
 };
 RunState.New=function(PreviousNodes,Top)
 {
  return{
   PreviousNodes:PreviousNodes,
   Top:Top
  };
 };
 NodeSet.get_Empty=function()
 {
  return{
   $:0,
   $0:new HashSet.New$3()
  };
 };
 NodeSet.FindAll=function(doc)
 {
  var q;
  function loop(node)
  {
   if(node!=null&&node.$==0)
    {
     loop(node.$0);
     loop(node.$1);
    }
   else
    if(node!=null&&node.$==1)
     loopEN(node.$0);
    else
     if(node!=null&&node.$==2)
      loop(node.$0.Current);
     else
      if(node!=null&&node.$==6)
       Arrays.iter(loopEN,node.$0.Holes);
  }
  function loopEN(el)
  {
   q.push(el);
   loop(el.Children);
  }
  q=[];
  loop(doc);
  return{
   $:0,
   $0:new HashSet.New$2(q)
  };
 };
 NodeSet.Filter=function(f,a)
 {
  return{
   $:0,
   $0:HashSet$1.Filter(f,a.$0)
  };
 };
 NodeSet.Except=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Except(a.$0,a$1.$0)
  };
 };
 NodeSet.ToArray=function(a)
 {
  return HashSet$1.ToArray(a.$0);
 };
 NodeSet.Intersect=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Intersect(a.$0,a$1.$0)
  };
 };
 Anims.UseAnimations=function()
 {
  SC$7.$cctor();
  return SC$7.UseAnimations;
 };
 Anims.Actions=function(a)
 {
  return Anims.ConcatActions(Arrays.choose(function(a$1)
  {
   return a$1.$==1?{
    $:1,
    $0:a$1.$0
   }:null;
  },AppendList.ToArray(a.$0)));
 };
 Anims.Finalize=function(a)
 {
  Arrays.iter(function(a$1)
  {
   if(a$1.$==0)
    a$1.$0();
  },AppendList.ToArray(a.$0));
 };
 Anims.ConcatActions=function(xs)
 {
  var xs$1,m,dur,xs$2;
  xs$1=Array.ofSeqNonCopying(xs);
  m=Arrays.length(xs$1);
  return m===0?Anims.Const():m===1?Arrays.get(xs$1,0):(dur=Seq.max(Seq.map(function(anim)
  {
   return anim.Duration;
  },xs$1)),(xs$2=Arrays.map(function(a)
  {
   return Anims.Prolong(dur,a);
  },xs$1),Anims.Def(dur,function(t)
  {
   Arrays.iter(function(anim)
   {
    anim.Compute(t);
   },xs$2);
  })));
 };
 Anims.List=function(a)
 {
  return a.$0;
 };
 Anims.Const=function(v)
 {
  return Anims.Def(0,function()
  {
   return v;
  });
 };
 Anims.Def=function(d,f)
 {
  return{
   Compute:f,
   Duration:d
  };
 };
 Anims.Prolong=function(nextDuration,anim)
 {
  var comp,dur,last;
  comp=anim.Compute;
  dur=anim.Duration;
  last=Lazy.Create(function()
  {
   return anim.Compute(anim.Duration);
  });
  return{
   Compute:function(t)
   {
    return t>=dur?last.f():comp(t);
   },
   Duration:nextDuration
  };
 };
 SC$5.$cctor=function()
 {
  SC$5.$cctor=Global.ignore;
  SC$5.BatchUpdatesEnabled=true;
 };
 Fresh.Int=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return Fresh.counter();
 };
 Fresh.set_counter=function($1)
 {
  SC$8.$cctor();
  SC$8.counter=$1;
 };
 Fresh.counter=function()
 {
  SC$8.$cctor();
  return SC$8.counter;
 };
 SC$6.$cctor=function()
 {
  SC$6.$cctor=Global.ignore;
  SC$6.EmptyAttr=null;
 };
 SC$7.$cctor=function()
 {
  SC$7.$cctor=Global.ignore;
  SC$7.CubicInOut=Easing.Custom(function(t)
  {
   var t2;
   t2=t*t;
   return 3*t2-2*(t2*t);
  });
  SC$7.UseAnimations=true;
 };
 AppendList.Append=function(x,y)
 {
  return x.$==0?y:y.$==0?x:{
   $:2,
   $0:x,
   $1:y
  };
 };
 AppendList.ToArray=function(xs)
 {
  var out;
  function loop(xs$1)
  {
   if(xs$1.$==1)
    out.push(xs$1.$0);
   else
    if(xs$1.$==2)
     {
      loop(xs$1.$0);
      loop(xs$1.$1);
     }
    else
     if(xs$1.$==3)
      Arrays.iter(function(v)
      {
       out.push(v);
      },xs$1.$0);
  }
  out=[];
  loop(xs);
  return out.slice(0);
 };
 AppendList.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(AppendList.Empty(),AppendList.Append,x);
 };
 AppendList.Empty=function()
 {
  SC$9.$cctor();
  return SC$9.Empty;
 };
 Easing=UI.Easing=Runtime.Class({},Obj,Easing);
 Easing.Custom=function(f)
 {
  return new Easing.New(f);
 };
 Easing.New=Runtime.Ctor(function(transformTime)
 {
  Obj.New.call(this);
  this.transformTime=transformTime;
 },Easing);
 HashSet$1.Filter=function(ok,set)
 {
  return new HashSet.New$2(Arrays.filter(ok,HashSet$1.ToArray(set)));
 };
 HashSet$1.Except=function(excluded,included)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(included));
  set.ExceptWith(HashSet$1.ToArray(excluded));
  return set;
 };
 HashSet$1.ToArray=function(set)
 {
  var arr;
  arr=Arrays.create(set.get_Count(),void 0);
  set.CopyTo(arr);
  return arr;
 };
 HashSet$1.Intersect=function(a,b)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(a));
  set.IntersectWith(HashSet$1.ToArray(b));
  return set;
 };
 HashSetUtil.concat=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push.apply(r,o[k$1]);
  return r;
 };
 SC$8.$cctor=function()
 {
  SC$8.$cctor=Global.ignore;
  SC$8.counter=0;
 };
 DomNodes.Children=function(elem,delims)
 {
  var n,o,a;
  if(delims!=null&&delims.$==1)
   {
    a=[];
    n=delims.$0[0].nextSibling;
    while(n!==delims.$0[1])
     {
      a.push(n);
      n=n.nextSibling;
     }
    return{
     $:0,
     $0:a
    };
   }
  else
   return{
    $:0,
    $0:Arrays.init(elem.childNodes.length,(o=elem.childNodes,function(a$1)
    {
     return o[a$1];
    }))
   };
 };
 DomNodes.Except=function(a,a$1)
 {
  var excluded;
  excluded=a.$0;
  return{
   $:0,
   $0:Arrays.filter(function(n)
   {
    return Arrays.forall(function(k)
    {
     return!(n===k);
    },excluded);
   },a$1.$0)
  };
 };
 DomNodes.Iter=function(f,a)
 {
  Arrays.iter(f,a.$0);
 };
 DomNodes.DocChildren=function(node)
 {
  var q;
  function loop(doc)
  {
   if(doc!=null&&doc.$==2)
    loop(doc.$0.Current);
   else
    if(doc!=null&&doc.$==1)
     q.push(doc.$0.El);
    else
     if(doc==null)
      ;
     else
      if(doc!=null&&doc.$==5)
       q.push(doc.$0);
      else
       if(doc!=null&&doc.$==4)
        q.push(doc.$0.Text);
       else
        if(doc!=null&&doc.$==6)
         Arrays.iter(function(a)
         {
          if(a==null||a.constructor===Object)
           loop(a);
          else
           q.push(a);
         },doc.$0.Els);
        else
         {
          loop(doc.$0);
          loop(doc.$1);
         }
  }
  q=[];
  loop(node.Children);
  return{
   $:0,
   $0:Array.ofSeqNonCopying(q)
  };
 };
 Lazy.Create=function(f)
 {
  return LazyRecord.New(false,f,Lazy.forceLazy);
 };
 Lazy.forceLazy=function()
 {
  var v;
  v=this.v();
  this.c=true;
  this.v=v;
  this.f=Lazy.cachedLazy;
  return v;
 };
 Lazy.cachedLazy=function()
 {
  return this.v;
 };
 SC$9.$cctor=function()
 {
  SC$9.$cctor=Global.ignore;
  SC$9.Empty={
   $:0
  };
 };
 Queue.Clear=function(a)
 {
  a.splice(0,Arrays.length(a));
 };
 LazyRecord.New=function(created,evalOrVal,force)
 {
  return{
   c:created,
   v:evalOrVal,
   f:force
  };
 };
 Runtime.OnLoad(function()
 {
  ChartJs.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
