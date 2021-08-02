"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[8193],{3905:function(e,t,r){r.d(t,{Zo:function(){return s},kt:function(){return d}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function o(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var p=n.createContext({}),c=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},s=function(e){var t=c(e.components);return n.createElement(p.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},k=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,p=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),k=c(r),d=a,u=k["".concat(p,".").concat(d)]||k[d]||m[d]||i;return r?n.createElement(u,l(l({ref:t},s),{},{components:r})):n.createElement(u,l({ref:t},s))}));function d(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,l=new Array(i);l[0]=k;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:a,l[1]=o;for(var c=2;c<i;c++)l[c]=r[c];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}k.displayName="MDXCreateElement"},8226:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return l},contentTitle:function(){return o},metadata:function(){return p},toc:function(){return c},default:function(){return m}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),l={id:"component.CircleMarker",title:"Class: CircleMarker",sidebar_label:"CircleMarker",custom_edit_url:null},o=void 0,p={unversionedId:"classes/component.CircleMarker",id:"classes/component.CircleMarker",isDocsHomePage:!1,title:"Class: CircleMarker",description:"component.CircleMarker",source:"@site/api/classes/component.CircleMarker.md",sourceDirName:"classes",slug:"/classes/component.CircleMarker",permalink:"/mapillary-js/api/classes/component.CircleMarker",editUrl:null,version:"current",frontMatter:{id:"component.CircleMarker",title:"Class: CircleMarker",sidebar_label:"CircleMarker",custom_edit_url:null},sidebar:"api",previous:{title:"CacheComponent",permalink:"/mapillary-js/api/classes/component.CacheComponent"},next:{title:"Component",permalink:"/mapillary-js/api/classes/component.Component"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Constructors",id:"constructors",children:[{value:"constructor",id:"constructor",children:[]}]},{value:"Accessors",id:"accessors",children:[{value:"id",id:"id",children:[]},{value:"lngLat",id:"lnglat",children:[]}]}],s={toc:c};function m(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".CircleMarker"),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"classdesc"))," Non-interactive marker with a flat circle shape. The circle\nmarker can not be configured to be interactive."),(0,i.kt)("p",null,"Circle marker properties can not be updated after creation."),(0,i.kt)("p",null,"To create and add one ",(0,i.kt)("inlineCode",{parentName:"p"},"CircleMarker")," with default configuration\nand one with configuration use"),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},'var defaultMarker = new CircleMarker(\n    "id-1",\n    { lat: 0, lng: 0, });\n\nvar configuredMarker = new CircleMarker(\n    "id-2",\n    { lat: 0, lng: 0, },\n    {\n        color: "#0ff",\n        opacity: 0.3,\n        radius: 0.7,\n    });\n\nmarkerComponent.add([defaultMarker, configuredMarker]);\n')),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Marker"},(0,i.kt)("inlineCode",{parentName:"a"},"Marker"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"CircleMarker"))))),(0,i.kt)("h2",{id:"constructors"},"Constructors"),(0,i.kt)("h3",{id:"constructor"},"constructor"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"new CircleMarker"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"id"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"lngLat"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"options?"),")"),(0,i.kt)("h4",{id:"parameters"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"id")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"lngLat")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat")))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"options?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.CircleMarkerOptions"},(0,i.kt)("inlineCode",{parentName:"a"},"CircleMarkerOptions")))))),(0,i.kt)("h4",{id:"overrides"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Marker"},"Marker"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Marker#constructor"},"constructor")),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/marker/marker/CircleMarker.ts#L40"},"component/marker/marker/CircleMarker.ts:40")),(0,i.kt)("h2",{id:"accessors"},"Accessors"),(0,i.kt)("h3",{id:"id"},"id"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"id"),"(): ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Get id."),(0,i.kt)("h4",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"The id of the marker."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/marker/marker/Marker.ts#L24"},"component/marker/marker/Marker.ts:24")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"lnglat"},"lngLat"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"lngLat"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Get lngLat."),(0,i.kt)("h4",{id:"returns-1"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"The geographic coordinates of the marker."),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/marker/marker/Marker.ts#L41"},"component/marker/marker/Marker.ts:41")))}m.isMDXComponent=!0}}]);