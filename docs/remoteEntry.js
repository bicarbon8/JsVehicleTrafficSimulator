var L={6098:(i,d,l)=>{var s={"./Module":()=>l.e(87).then(()=>()=>l(2087))},m=(f,S)=>(l.R=S,S=l.o(s,f)?s[f]():Promise.resolve().then(()=>{throw new Error('Module "'+f+'" does not exist in container.')}),l.R=void 0,S),p=(f,S)=>{if(l.S){var c="default",V=l.S[c];if(V&&V!==f)throw new Error("Container initialization failed as it has already been initialized with a different share scope");return l.S[c]=f,l.I(c,S)}};l.d(d,{get:()=>m,init:()=>p})}},$={};function a(i){var d=$[i];if(void 0!==d)return d.exports;var l=$[i]={exports:{}};return L[i](l,l.exports,a),l.exports}a.m=L,a.c=$,a.d=(i,d)=>{for(var l in d)a.o(d,l)&&!a.o(i,l)&&Object.defineProperty(i,l,{enumerable:!0,get:d[l]})},a.f={},a.e=i=>Promise.all(Object.keys(a.f).reduce((d,l)=>(a.f[l](i,d),d),[])),a.u=i=>i+".js",a.miniCssF=i=>{},a.o=(i,d)=>Object.prototype.hasOwnProperty.call(i,d),(()=>{var i={},d="jsVehicleTrafficSimulator:";a.l=(l,s,m,p)=>{if(i[l])i[l].push(s);else{var f,S;if(void 0!==m)for(var c=document.getElementsByTagName("script"),V=0;V<c.length;V++){var g=c[V];if(g.getAttribute("src")==l||g.getAttribute("data-webpack")==d+m){f=g;break}}f||(S=!0,(f=document.createElement("script")).type="module",f.charset="utf-8",f.timeout=120,a.nc&&f.setAttribute("nonce",a.nc),f.setAttribute("data-webpack",d+m),f.src=a.tu(l)),i[l]=[s];var b=(j,E)=>{f.onerror=f.onload=null,clearTimeout(y);var w=i[l];if(delete i[l],f.parentNode&&f.parentNode.removeChild(f),w&&w.forEach(h=>h(E)),j)return j(E)},y=setTimeout(b.bind(null,void 0,{type:"timeout",target:f}),12e4);f.onerror=b.bind(null,f.onerror),f.onload=b.bind(null,f.onload),S&&document.head.appendChild(f)}}})(),a.r=i=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(i,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(i,"__esModule",{value:!0})},(()=>{a.S={};var i={},d={};a.I=(l,s)=>{s||(s=[]);var m=d[l];if(m||(m=d[l]={}),!(s.indexOf(m)>=0)){if(s.push(m),i[l])return i[l];a.o(a.S,l)||(a.S[l]={});var p=a.S[l],S="jsVehicleTrafficSimulator",c=(b,y,j,E)=>{var w=p[b]=p[b]||{},h=w[y];(!h||!h.loaded&&(!E!=!h.eager?E:S>h.from))&&(w[y]={get:j,from:S,eager:!!E})},g=[];return"default"===l&&(c("@angular/common/http","13.2.1",()=>a.e(471).then(()=>()=>a(529))),c("@angular/common","13.2.1",()=>a.e(181).then(()=>()=>a(6895))),c("@angular/core","13.2.1",()=>a.e(738).then(()=>()=>a(6738))),c("@angular/router","13.2.1",()=>a.e(24).then(()=>()=>a(4340)))),i[l]=g.length?Promise.all(g).then(()=>i[l]=1):1}}})(),(()=>{var i;a.tt=()=>(void 0===i&&(i={createScriptURL:d=>d},"undefined"!=typeof trustedTypes&&trustedTypes.createPolicy&&(i=trustedTypes.createPolicy("angular#bundler",i))),i)})(),a.tu=i=>a.tt().createScriptURL(i),(()=>{var i;if("string"==typeof import.meta.url&&(i=import.meta.url),!i)throw new Error("Automatic publicPath is not supported in this browser");i=i.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),a.p=i})(),(()=>{var i=e=>{var t=o=>o.split(".").map(u=>+u==u?+u:u),r=/^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(e),n=r[1]?t(r[1]):[];return r[2]&&(n.length++,n.push.apply(n,t(r[2]))),r[3]&&(n.push([]),n.push.apply(n,t(r[3]))),n},l=e=>{var t=e[0],r="";if(1===e.length)return"*";if(t+.5){r+=0==t?">=":-1==t?"<":1==t?"^":2==t?"~":t>0?"=":"!=";for(var n=1,o=1;o<e.length;o++)n--,r+="u"==(typeof(v=e[o]))[0]?"-":(n>0?".":"")+(n=2,v);return r}var u=[];for(o=1;o<e.length;o++){var v=e[o];u.push(0===v?"not("+C()+")":1===v?"("+C()+" || "+C()+")":2===v?u.pop()+" "+u.pop():l(v))}return C();function C(){return u.pop().replace(/^\((.+)\)$/,"$1")}},s=(e,t)=>{if(0 in e){t=i(t);var r=e[0],n=r<0;n&&(r=-r-1);for(var o=0,u=1,v=!0;;u++,o++){var C,O,x=u<e.length?(typeof e[u])[0]:"";if(o>=t.length||"o"==(O=(typeof(C=t[o]))[0]))return!v||("u"==x?u>r&&!n:""==x!=n);if("u"==O){if(!v||"u"!=x)return!1}else if(v)if(x==O)if(u<=r){if(C!=e[u])return!1}else{if(n?C>e[u]:C<e[u])return!1;C!=e[u]&&(v=!1)}else if("s"!=x&&"n"!=x){if(n||u<=r)return!1;v=!1,u--}else{if(u<=r||O<x!=n)return!1;v=!1}else"s"!=x&&"n"!=x&&(v=!1,u--)}}var F=[],T=F.pop.bind(F);for(o=1;o<e.length;o++){var A=e[o];F.push(1==A?T()|T():2==A?T()&T():A?s(A,t):!T())}return!!T()},f=(e,t)=>{var r=e[t];return Object.keys(r).reduce((n,o)=>!n||!r[n].loaded&&((e,t)=>{e=i(e),t=i(t);for(var r=0;;){if(r>=e.length)return r<t.length&&"u"!=(typeof t[r])[0];var n=e[r],o=(typeof n)[0];if(r>=t.length)return"u"==o;var u=t[r],v=(typeof u)[0];if(o!=v)return"o"==o&&"n"==v||"s"==v||"u"==o;if("o"!=o&&"u"!=o&&n!=u)return n<u;r++}})(n,o)?o:n,0)},g=(e,t,r,n)=>{var o=f(e,r);if(!s(n,o))throw new Error(((e,t,r,n)=>"Unsatisfied version "+r+" from "+(r&&e[t][r].from)+" of shared singleton module "+t+" (required "+l(n)+")")(e,r,o,n));return w(e[r][o])},w=e=>(e.loaded=1,e.get()),M=(e=>function(t,r,n,o){var u=a.I(t);return u&&u.then?u.then(e.bind(e,t,a.S[t],r,n,o)):e(t,a.S[t],r,n,o)})((e,t,r,n,o)=>t&&a.o(t,r)?g(t,0,r,n):o()),P={},z={1643:()=>M("default","@angular/common",[1,13,2,0],()=>a.e(895).then(()=>()=>a(6895))),8802:()=>M("default","@angular/core",[1,13,2,0],()=>a.e(738).then(()=>()=>a(6738))),9697:()=>M("default","@angular/common/http",[1,13,2,0],()=>a.e(529).then(()=>()=>a(529))),3464:()=>M("default","@angular/router",[1,13,2,0],()=>a.e(340).then(()=>()=>a(4340)))},k={24:[1643,8802],87:[1643,9697,3464,8802],181:[8802],471:[1643,8802]};a.f.consumes=(e,t)=>{a.o(k,e)&&k[e].forEach(r=>{if(a.o(P,r))return t.push(P[r]);var n=v=>{P[r]=0,a.m[r]=C=>{delete a.c[r],C.exports=v()}},o=v=>{delete P[r],a.m[r]=C=>{throw delete a.c[r],v}};try{var u=z[r]();u.then?t.push(P[r]=u.then(n).catch(o)):n(u)}catch(v){o(v)}})}})(),(()=>{var i={296:0};a.f.j=(s,m)=>{var p=a.o(i,s)?i[s]:void 0;if(0!==p)if(p)m.push(p[2]);else{var f=new Promise((g,b)=>p=i[s]=[g,b]);m.push(p[2]=f);var S=a.p+a.u(s),c=new Error;a.l(S,g=>{if(a.o(i,s)&&(0!==(p=i[s])&&(i[s]=void 0),p)){var b=g&&("load"===g.type?"missing":g.type),y=g&&g.target&&g.target.src;c.message="Loading chunk "+s+" failed.\n("+b+": "+y+")",c.name="ChunkLoadError",c.type=b,c.request=y,p[1](c)}},"chunk-"+s,s)}};var d=(s,m)=>{var c,V,[p,f,S]=m,g=0;if(p.some(y=>0!==i[y])){for(c in f)a.o(f,c)&&(a.m[c]=f[c]);S&&S(a)}for(s&&s(m);g<p.length;g++)a.o(i,V=p[g])&&i[V]&&i[V][0](),i[V]=0},l=self.webpackChunkjsVehicleTrafficSimulator=self.webpackChunkjsVehicleTrafficSimulator||[];l.forEach(d.bind(null,0)),l.push=d.bind(null,l.push.bind(l))})();var U=a(6098),R=U.get,B=U.init;export{R as get,B as init};