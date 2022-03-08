"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[4549],{3905:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return f}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var o=r.createContext({}),c=function(e){var t=r.useContext(o),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},u=function(e){var t=c(e.components);return r.createElement(o.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,u=p(e,["components","mdxType","originalType","parentName"]),d=c(n),f=a,m=d["".concat(o,".").concat(f)]||d[f]||s[f]||i;return n?r.createElement(m,l(l({ref:t},u),{},{components:n})):r.createElement(m,l({ref:t},u))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,l=new Array(i);l[0]=d;var p={};for(var o in t)hasOwnProperty.call(t,o)&&(p[o]=t[o]);p.originalType=e,p.mdxType="string"==typeof e?e:a,l[1]=p;for(var c=2;c<i;c++)l[c]=n[c];return r.createElement.apply(null,l)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},3291:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return p},metadata:function(){return o},toc:function(){return c},default:function(){return s}});var r=n(2122),a=n(9756),i=(n(7294),n(3905)),l={id:"api.LngLatAlt",title:"Interface: LngLatAlt",sidebar_label:"LngLatAlt",custom_edit_url:null},p=void 0,o={unversionedId:"interfaces/api.LngLatAlt",id:"interfaces/api.LngLatAlt",isDocsHomePage:!1,title:"Interface: LngLatAlt",description:"api.LngLatAlt",source:"@site/api/interfaces/api.LngLatAlt.md",sourceDirName:"interfaces",slug:"/interfaces/api.LngLatAlt",permalink:"/mapillary-js/api/interfaces/api.LngLatAlt",editUrl:null,tags:[],version:"current",frontMatter:{id:"api.LngLatAlt",title:"Interface: LngLatAlt",sidebar_label:"LngLatAlt",custom_edit_url:null},sidebar:"api",previous:{title:"LngLat",permalink:"/mapillary-js/api/interfaces/api.LngLat"},next:{title:"MeshContract",permalink:"/mapillary-js/api/interfaces/api.MeshContract"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"alt",id:"alt",children:[]},{value:"lat",id:"lat",children:[]},{value:"lng",id:"lng",children:[]}]}],u={toc:c};function s(e){var t=e.components,n=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".LngLatAlt"),(0,i.kt)("p",null,"Interface that represents longitude-latitude-altitude\ncoordinates. Longitude and latitude are measured in degrees\nand altitude in meters. Coordinates are defined in the WGS84 datum."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"LngLatAlt"))))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"alt"},"alt"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"alt"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Altitude, measured in meters."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/api/interfaces/LngLatAlt.ts#L14"},"api/interfaces/LngLatAlt.ts:14")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"lat"},"lat"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"lat"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Latitude, measured in degrees."),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},"LngLat"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat#lat"},"lat")),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/api/interfaces/LngLat.ts#L9"},"api/interfaces/LngLat.ts:9")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"lng"},"lng"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"lng"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"number")),(0,i.kt)("p",null,"Longitude, measured in degrees."),(0,i.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},"LngLat"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat#lng"},"lng")),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/api/interfaces/LngLat.ts#L14"},"api/interfaces/LngLat.ts:14")))}s.isMDXComponent=!0}}]);