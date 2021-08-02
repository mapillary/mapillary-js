"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[9584],{3905:function(t,e,r){r.d(e,{Zo:function(){return s},kt:function(){return d}});var n=r(7294);function o(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function i(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function a(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?i(Object(r),!0).forEach((function(e){o(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function c(t,e){if(null==t)return{};var r,n,o=function(t,e){if(null==t)return{};var r,n,o={},i=Object.keys(t);for(n=0;n<i.length;n++)r=i[n],e.indexOf(r)>=0||(o[r]=t[r]);return o}(t,e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(n=0;n<i.length;n++)r=i[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(o[r]=t[r])}return o}var l=n.createContext({}),p=function(t){var e=n.useContext(l),r=e;return t&&(r="function"==typeof t?t(e):a(a({},e),t)),r},s=function(t){var e=p(t.components);return n.createElement(l.Provider,{value:e},t.children)},u={inlineCode:"code",wrapper:function(t){var e=t.children;return n.createElement(n.Fragment,{},e)}},f=n.forwardRef((function(t,e){var r=t.components,o=t.mdxType,i=t.originalType,l=t.parentName,s=c(t,["components","mdxType","originalType","parentName"]),f=p(r),d=o,m=f["".concat(l,".").concat(d)]||f[d]||u[d]||i;return r?n.createElement(m,a(a({ref:e},s),{},{components:r})):n.createElement(m,a({ref:e},s))}));function d(t,e){var r=arguments,o=e&&e.mdxType;if("string"==typeof t||o){var i=r.length,a=new Array(i);a[0]=f;var c={};for(var l in e)hasOwnProperty.call(e,l)&&(c[l]=e[l]);c.originalType=t,c.mdxType="string"==typeof t?t:o,a[1]=c;for(var p=2;p<i;p++)a[p]=r[p];return n.createElement.apply(null,a)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},7272:function(t,e,r){r.r(e),r.d(e,{frontMatter:function(){return a},contentTitle:function(){return c},metadata:function(){return l},toc:function(){return p},default:function(){return u}});var n=r(2122),o=r(9756),i=(r(7294),r(3905)),a={id:"api.PointContract",title:"Interface: PointContract",sidebar_label:"PointContract",custom_edit_url:null},c=void 0,l={unversionedId:"interfaces/api.PointContract",id:"interfaces/api.PointContract",isDocsHomePage:!1,title:"Interface: PointContract",description:"api.PointContract",source:"@site/api/interfaces/api.PointContract.md",sourceDirName:"interfaces",slug:"/interfaces/api.PointContract",permalink:"/mapillary-js/api/interfaces/api.PointContract",editUrl:null,version:"current",frontMatter:{id:"api.PointContract",title:"Interface: PointContract",sidebar_label:"PointContract",custom_edit_url:null},sidebar:"api",previous:{title:"MeshContract",permalink:"/mapillary-js/api/interfaces/api.MeshContract"},next:{title:"ProviderCellEvent",permalink:"/mapillary-js/api/interfaces/api.ProviderCellEvent"}},p=[{value:"Properties",id:"properties",children:[{value:"color",id:"color",children:[]},{value:"coordinates",id:"coordinates",children:[]}]}],s={toc:p};function u(t){var e=t.components,r=(0,o.Z)(t,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:e,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".PointContract"),(0,i.kt)("p",null,"Contract describing a reconstruction point."),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"color"},"color"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"color"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"RGB color vector of the point, normalized to floats\non the interval ","[0, 1]",";"),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/contracts/PointContract.ts#L9"},"api/contracts/PointContract.ts:9")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"coordinates"},"coordinates"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"coordinates"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number"),"[]"),(0,i.kt)("p",null,"Coordinates in metric scale in topocentric ENU\nreference frame with respect to a geo reference."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/contracts/PointContract.ts#L15"},"api/contracts/PointContract.ts:15")))}u.isMDXComponent=!0}}]);