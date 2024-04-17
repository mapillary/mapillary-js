"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[81],{3905:function(e,t,r){r.d(t,{Zo:function(){return d},kt:function(){return u}});var a=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,a)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,a,n=function(e,t){if(null==e)return{};var r,a,n={},i=Object.keys(e);for(a=0;a<i.length;a++)r=i[a],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)r=i[a],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var p=a.createContext({}),c=function(e){var t=a.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},d=function(e){var t=c(e.components);return a.createElement(p.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},g=a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,i=e.originalType,p=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),g=c(r),u=n,f=g["".concat(p,".").concat(u)]||g[u]||s[u]||i;return r?a.createElement(f,o(o({ref:t},d),{},{components:r})):a.createElement(f,o({ref:t},d))}));function u(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=r.length,o=new Array(i);o[0]=g;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:n,o[1]=l;for(var c=2;c<i;c++)o[c]=r[c];return a.createElement.apply(null,o)}return a.createElement.apply(null,r)}g.displayName="MDXCreateElement"},4249:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return o},contentTitle:function(){return l},metadata:function(){return p},toc:function(){return c},default:function(){return s}});var a=r(2122),n=r(9756),i=(r(7294),r(3905)),o={id:"viewer.NavigationEdge",title:"Interface: NavigationEdge",sidebar_label:"NavigationEdge",custom_edit_url:null},l=void 0,p={unversionedId:"interfaces/viewer.NavigationEdge",id:"interfaces/viewer.NavigationEdge",isDocsHomePage:!1,title:"Interface: NavigationEdge",description:"viewer.NavigationEdge",source:"@site/api/interfaces/viewer.NavigationEdge.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.NavigationEdge",permalink:"/mapillary-js/api/interfaces/viewer.NavigationEdge",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.NavigationEdge",title:"Interface: NavigationEdge",sidebar_label:"NavigationEdge",custom_edit_url:null},sidebar:"api",previous:{title:"IViewer",permalink:"/mapillary-js/api/interfaces/viewer.IViewer"},next:{title:"NavigationEdgeData",permalink:"/mapillary-js/api/interfaces/viewer.NavigationEdgeData"}},c=[{value:"Properties",id:"properties",children:[{value:"data",id:"data",children:[]},{value:"source",id:"source",children:[]},{value:"target",id:"target",children:[]}]}],d={toc:c};function s(e){var t=e.components,r=(0,n.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,a.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".NavigationEdge"),(0,i.kt)("p",null,"Interface that describes the properties for a\nnavigation edge from a source image to a\ntarget image."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"interface"))," NavigationEdge"),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"data"},"data"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"data"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.NavigationEdgeData"},(0,i.kt)("inlineCode",{parentName:"a"},"NavigationEdgeData"))),(0,i.kt)("p",null,"Additional data describing properties of the edge."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/graph/edge/interfaces/NavigationEdge.ts#L24"},"graph/edge/interfaces/NavigationEdge.ts:24")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"source"},"source"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"source"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"The id of the source image."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/graph/edge/interfaces/NavigationEdge.ts#L14"},"graph/edge/interfaces/NavigationEdge.ts:14")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"target"},"target"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"target"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"The id of the target image."),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/graph/edge/interfaces/NavigationEdge.ts#L19"},"graph/edge/interfaces/NavigationEdge.ts:19")))}s.isMDXComponent=!0}}]);