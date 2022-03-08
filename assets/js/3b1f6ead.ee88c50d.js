"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[3632],{3905:function(e,t,r){r.d(t,{Zo:function(){return f},kt:function(){return d}});var n=r(7294);function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){i(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}var p=n.createContext({}),c=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},f=function(e){var t=c(e.components);return n.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},s=n.forwardRef((function(e,t){var r=e.components,i=e.mdxType,a=e.originalType,p=e.parentName,f=l(e,["components","mdxType","originalType","parentName"]),s=c(r),d=i,m=s["".concat(p,".").concat(d)]||s[d]||u[d]||a;return r?n.createElement(m,o(o({ref:t},f),{},{components:r})):n.createElement(m,o({ref:t},f))}));function d(e,t){var r=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=r.length,o=new Array(a);o[0]=s;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:i,o[1]=l;for(var c=2;c<a;c++)o[c]=r[c];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}s.displayName="MDXCreateElement"},6260:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return o},contentTitle:function(){return l},metadata:function(){return p},toc:function(){return c},default:function(){return u}});var n=r(2122),i=r(9756),a=(r(7294),r(3905)),o={id:"viewer.PointOfView",title:"Interface: PointOfView",sidebar_label:"PointOfView",custom_edit_url:null},l=void 0,p={unversionedId:"interfaces/viewer.PointOfView",id:"interfaces/viewer.PointOfView",isDocsHomePage:!1,title:"Interface: PointOfView",description:"viewer.PointOfView",source:"@site/api/interfaces/viewer.PointOfView.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.PointOfView",permalink:"/mapillary-js/api/interfaces/viewer.PointOfView",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.PointOfView",title:"Interface: PointOfView",sidebar_label:"PointOfView",custom_edit_url:null},sidebar:"api",previous:{title:"NavigationEdgeStatus",permalink:"/mapillary-js/api/interfaces/viewer.NavigationEdgeStatus"},next:{title:"UrlOptions",permalink:"/mapillary-js/api/interfaces/viewer.UrlOptions"}},c=[{value:"Properties",id:"properties",children:[{value:"bearing",id:"bearing",children:[]},{value:"tilt",id:"tilt",children:[]}]}],f={toc:c};function u(e){var t=e.components,r=(0,i.Z)(e,["components"]);return(0,a.kt)("wrapper",(0,n.Z)({},f,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".PointOfView"),(0,a.kt)("p",null,(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("inlineCode",{parentName:"strong"},"interface"))," PointOfView"),(0,a.kt)("p",null,"Interface that represents the point of view of the viewer."),(0,a.kt)("h2",{id:"properties"},"Properties"),(0,a.kt)("h3",{id:"bearing"},"bearing"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"bearing"),": ",(0,a.kt)("inlineCode",{parentName:"p"},"number")),(0,a.kt)("p",null,"Value indicating the current bearing of the viewer\nmeasured in degrees clockwise with respect to north.\nRanges from 0\xb0 to 360\xb0."),(0,a.kt)("h4",{id:"defined-in"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/interfaces/PointOfView.ts#L12"},"viewer/interfaces/PointOfView.ts:12")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"tilt"},"tilt"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"tilt"),": ",(0,a.kt)("inlineCode",{parentName:"p"},"number")),(0,a.kt)("p",null,"The camera tilt in degrees, relative to a horizontal plane.\nRanges from 90\xb0 (directly upwards) to -90\xb0 (directly downwards)."),(0,a.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/interfaces/PointOfView.ts#L18"},"viewer/interfaces/PointOfView.ts:18")))}u.isMDXComponent=!0}}]);