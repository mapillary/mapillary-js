"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[3662],{3905:function(e,t,r){r.d(t,{Zo:function(){return s},kt:function(){return d}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var c=n.createContext({}),p=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},s=function(e){var t=p(e.components);return n.createElement(c.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,c=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),f=p(r),d=a,m=f["".concat(c,".").concat(d)]||f[d]||u[d]||i;return r?n.createElement(m,o(o({ref:t},s),{},{components:r})):n.createElement(m,o({ref:t},s))}));function d(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,o=new Array(i);o[0]=f;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,o[1]=l;for(var p=2;p<i;p++)o[p]=r[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},9006:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return o},contentTitle:function(){return l},metadata:function(){return c},toc:function(){return p},default:function(){return u}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),o={id:"api.ClusterContract",title:"Interface: ClusterContract",sidebar_label:"ClusterContract",custom_edit_url:null},l=void 0,c={unversionedId:"interfaces/api.ClusterContract",id:"interfaces/api.ClusterContract",isDocsHomePage:!1,title:"Interface: ClusterContract",description:"api.ClusterContract",source:"@site/api/interfaces/api.ClusterContract.md",sourceDirName:"interfaces",slug:"/interfaces/api.ClusterContract",permalink:"/mapillary-js/api/interfaces/api.ClusterContract",editUrl:null,tags:[],version:"current",frontMatter:{id:"api.ClusterContract",title:"Interface: ClusterContract",sidebar_label:"ClusterContract",custom_edit_url:null},sidebar:"api",previous:{title:"CameraEnt",permalink:"/mapillary-js/api/interfaces/api.CameraEnt"},next:{title:"CoreImageEnt",permalink:"/mapillary-js/api/interfaces/api.CoreImageEnt"}},p=[{value:"Properties",id:"properties",children:[{value:"id",id:"id",children:[]},{value:"points",id:"points",children:[]},{value:"reference",id:"reference",children:[]}]}],s={toc:p};function u(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".ClusterContract"),(0,i.kt)("p",null,"Contract describing cluster reconstruction data."),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"id"},"id"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"id"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"The unique id of the cluster."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/api/contracts/ClusterContract.ts#L11"},"api/contracts/ClusterContract.ts:11")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"points"},"points"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"points"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"Object")),(0,i.kt)("p",null,"The points of the reconstruction."),(0,i.kt)("h4",{id:"index-signature"},"Index signature"),(0,i.kt)("p",null,"\u25aa ","[pointId: ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),"]",": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.PointContract"},(0,i.kt)("inlineCode",{parentName:"a"},"PointContract"))),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/api/contracts/ClusterContract.ts#L16"},"api/contracts/ClusterContract.ts:16")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"reference"},"reference"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"reference"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLatAlt"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLatAlt"))),(0,i.kt)("p",null,"The reference longitude, latitude, altitude of\nthe reconstruction. Determines the\nposition of the reconstruction in world reference\nframe."),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/api/contracts/ClusterContract.ts#L24"},"api/contracts/ClusterContract.ts:24")))}u.isMDXComponent=!0}}]);