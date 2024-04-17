"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[1171],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return f}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=r.createContext({}),s=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=s(e.components);return r.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,p=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),m=s(n),f=a,d=m["".concat(p,".").concat(f)]||m[f]||u[f]||i;return n?r.createElement(d,o(o({ref:t},c),{},{components:n})):r.createElement(d,o({ref:t},c))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=m;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:a,o[1]=l;for(var s=2;s<i;s++)o[s]=n[s];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},1997:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return o},contentTitle:function(){return l},metadata:function(){return p},toc:function(){return s},default:function(){return u}});var r=n(2122),a=n(9756),i=(n(7294),n(3905)),o={id:"viewer.FallbackOptions",title:"Interface: FallbackOptions",sidebar_label:"FallbackOptions",custom_edit_url:null},l=void 0,p={unversionedId:"interfaces/viewer.FallbackOptions",id:"interfaces/viewer.FallbackOptions",isDocsHomePage:!1,title:"Interface: FallbackOptions",description:"viewer.FallbackOptions",source:"@site/api/interfaces/viewer.FallbackOptions.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.FallbackOptions",permalink:"/mapillary-js/api/interfaces/viewer.FallbackOptions",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.FallbackOptions",title:"Interface: FallbackOptions",sidebar_label:"FallbackOptions",custom_edit_url:null},sidebar:"api",previous:{title:"ComponentOptions",permalink:"/mapillary-js/api/interfaces/viewer.ComponentOptions"},next:{title:"ICustomCameraControls",permalink:"/mapillary-js/api/interfaces/viewer.ICustomCameraControls"}},s=[{value:"Properties",id:"properties",children:[{value:"image",id:"image",children:[]},{value:"navigation",id:"navigation",children:[]}]}],c={toc:s};function u(e){var t=e.components,n=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".FallbackOptions"),(0,i.kt)("p",null,"Interface for the fallback component options that can be\nprovided to the viewer when the browser does not have\nWebGL support."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"image"},"image"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"image"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"boolean")),(0,i.kt)("p",null,"Show static images without pan, zoom, or transitions."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Fallback for ",(0,i.kt)("inlineCode",{parentName:"p"},"image")," when WebGL is not supported."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/options/FallbackOptions.ts#L20"},"viewer/options/FallbackOptions.ts:20")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"navigation"},"navigation"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"navigation"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},"NavigationFallbackConfiguration")),(0,i.kt)("p",null,"Show static navigation arrows in the corners."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Fallback for ",(0,i.kt)("inlineCode",{parentName:"p"},"direction")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"sequence")," when WebGL is not supported."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/options/FallbackOptions.ts#L29"},"viewer/options/FallbackOptions.ts:29")))}u.isMDXComponent=!0}}]);