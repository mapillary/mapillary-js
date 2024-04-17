"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[7618],{3905:function(e,n,t){t.d(n,{Zo:function(){return u},kt:function(){return f}});var r=t(7294);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function i(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?i(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):i(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function p(e,n){if(null==e)return{};var t,r,a=function(e,n){if(null==e)return{};var t,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)t=i[r],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)t=i[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var l=r.createContext({}),c=function(e){var n=r.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},u=function(e){var n=c(e.components);return r.createElement(l.Provider,{value:n},e.children)},s={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},m=r.forwardRef((function(e,n){var t=e.components,a=e.mdxType,i=e.originalType,l=e.parentName,u=p(e,["components","mdxType","originalType","parentName"]),m=c(t),f=a,h=m["".concat(l,".").concat(f)]||m[f]||s[f]||i;return t?r.createElement(h,o(o({ref:n},u),{},{components:t})):r.createElement(h,o({ref:n},u))}));function f(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var i=t.length,o=new Array(i);o[0]=m;var p={};for(var l in n)hasOwnProperty.call(n,l)&&(p[l]=n[l]);p.originalType=e,p.mdxType="string"==typeof e?e:a,o[1]=p;for(var c=2;c<i;c++)o[c]=t[c];return r.createElement.apply(null,o)}return r.createElement.apply(null,t)}m.displayName="MDXCreateElement"},304:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return o},contentTitle:function(){return p},metadata:function(){return l},toc:function(){return c},default:function(){return s}});var r=t(2122),a=t(9756),i=(t(7294),t(3905)),o={id:"component.CacheDepthConfiguration",title:"Interface: CacheDepthConfiguration",sidebar_label:"CacheDepthConfiguration",custom_edit_url:null},p=void 0,l={unversionedId:"interfaces/component.CacheDepthConfiguration",id:"interfaces/component.CacheDepthConfiguration",isDocsHomePage:!1,title:"Interface: CacheDepthConfiguration",description:"component.CacheDepthConfiguration",source:"@site/api/interfaces/component.CacheDepthConfiguration.md",sourceDirName:"interfaces",slug:"/interfaces/component.CacheDepthConfiguration",permalink:"/mapillary-js/api/interfaces/component.CacheDepthConfiguration",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.CacheDepthConfiguration",title:"Interface: CacheDepthConfiguration",sidebar_label:"CacheDepthConfiguration",custom_edit_url:null},sidebar:"api",previous:{title:"CacheConfiguration",permalink:"/mapillary-js/api/interfaces/component.CacheConfiguration"},next:{title:"CircleMarkerOptions",permalink:"/mapillary-js/api/interfaces/component.CircleMarkerOptions"}},c=[{value:"Properties",id:"properties",children:[{value:"sequence",id:"sequence",children:[]},{value:"spherical",id:"spherical",children:[]},{value:"step",id:"step",children:[]},{value:"turn",id:"turn",children:[]}]}],u={toc:c};function s(e){var n=e.components,t=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,r.Z)({},u,t,{components:n,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".CacheDepthConfiguration"),(0,i.kt)("p",null,"Interface for configuration of cache depth."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"var viewer = new Viewer({\n    ...\n    component: {\n        cache: {\n            depth: {\n                spherical: 2,\n                sequence: 3,\n            }\n        },\n    },\n    ...\n});\n")),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"sequence"},"sequence"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"sequence"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Cache depth in the sequence directions."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Max value is 4. Value will be clamped\nto the interval ","[0, 4]","."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," 2"),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/interfaces/CacheConfiguration.ts#L31"},"component/interfaces/CacheConfiguration.ts:31")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"spherical"},"spherical"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"spherical"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Cache depth in the spherical direction."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Max value is 2. Value will be clamped\nto the interval ","[0, 2]","."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," 1"),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/interfaces/CacheConfiguration.ts#L40"},"component/interfaces/CacheConfiguration.ts:40")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"step"},"step"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"step"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Cache depth in the step directions."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Max value is 3. Value will be clamped\nto the interval ","[0, 3]","."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," 1"),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/interfaces/CacheConfiguration.ts#L49"},"component/interfaces/CacheConfiguration.ts:49")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"turn"},"turn"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"turn"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Cache depth in the turn directions."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Max value is 1. Value will be clamped\nto the interval ","[0, 1]","."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"default"))," 0"),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/interfaces/CacheConfiguration.ts#L58"},"component/interfaces/CacheConfiguration.ts:58")))}s.isMDXComponent=!0}}]);